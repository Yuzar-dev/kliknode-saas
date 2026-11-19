import { Request, Response } from 'express';
import prisma from '../../config/database';

/**
 * Récupère les données publiques d'une carte via son slug
 */
export const getPublicCard = async (req: Request, res: Response) => {
    try {
        const slug = String(req.params.slug);

        const card = await prisma.card.findFirst({
            where: {
                OR: [
                    { publicSlug: slug },
                    { userId: slug },
                    { id: slug },
                ],
            },
            include: {
                company: {
                    include: {
                        branding: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        avatarUrl: true,
                        isPro: true,
                        createdAt: true,
                        companyId: true,
                        company: {
                            include: {
                                branding: true,
                                subscription: {
                                    include: { plan: true },
                                },
                            }
                        }
                    }
                }
            }
        });

        if (!card || !card.isPublic || card.deletedAt) {
            return res.status(404).json({
                success: false,
                error: 'Carte introuvable ou privée.'
            });
        }

        // Incrémenter le compteur de vues
        await prisma.card.update({
            where: { id: card.id },
            data: { viewCount: { increment: 1 } }
        }).catch(() => {});

        // Enregistrer le scan (async sans attendre pour la performance)
        prisma.cardScan.create({
            data: {
                cardId: card.id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            }
        }).catch(err => console.error('Error logging scan:', err));

        const companyObj = card.company || card.user?.company || null;
        const branding = companyObj?.branding || null;
        const rawCompanyName = companyObj?.name || card.companyName || '';
        const parenMatch = rawCompanyName.match(/^[^()]+\(([^()]+)\)\s*$/);
        const cleanCompanyName = parenMatch ? parenMatch[1].trim() : rawCompanyName;

        if (parenMatch && companyObj?.id) {
            prisma.company.update({ where: { id: companyObj.id }, data: { name: cleanCompanyName } }).catch(() => {});
            prisma.card.updateMany({ where: { companyId: companyObj.id }, data: { companyName: cleanCompanyName } }).catch(() => {});
        }

        // Calculer le statut PRO effectif en temps réel (plan B2B ou essai 7 jours B2C)
        let effectiveOwnerIsPro = Boolean(card.user?.isPro);
        if (card.user?.role === 'ADMIN' || card.user?.role === 'MANAGER') {
            effectiveOwnerIsPro = true;
        } else if (card.user?.companyId) {
            const companySub = card.user.company?.subscription;
            const companyPlan = companySub?.plan;
            const isSubActive = !companySub || companySub.status === 'active' || companySub.status === 'trialing';
            effectiveOwnerIsPro = Boolean(
                companyPlan &&
                isSubActive &&
                Number(companyPlan.priceEur) > 0 &&
                String(companyPlan.slug || '').toLowerCase() !== 'free' &&
                String(companyPlan.name || '').toLowerCase() !== 'free'
            );
        } else if (card.user) {
            const latestSubLog = await prisma.auditLog.findFirst({
                where: { userId: card.user.id, action: 'B2C_TRIAL_SUBSCRIPTION' },
                orderBy: { createdAt: 'desc' },
            }).catch(() => null);
            if (!latestSubLog) {
                const ageMs = Date.now() - new Date(card.user.createdAt).getTime();
                if (ageMs < 7 * 24 * 60 * 60 * 1000) {
                    effectiveOwnerIsPro = true;
                }
            } else {
                const subMeta = (latestSubLog.changes && typeof latestSubLog.changes === 'object')
                    ? (latestSubLog.changes as any)
                    : null;
                if (subMeta && !subMeta.stripeSubscriptionId && !subMeta.paidConfirmed && subMeta.trialEndsAt) {
                    effectiveOwnerIsPro = new Date(subMeta.trialEndsAt).getTime() > Date.now();
                    if (card.user.isPro !== effectiveOwnerIsPro) {
                        prisma.user.update({ where: { id: card.user.id }, data: { isPro: effectiveOwnerIsPro } }).catch(() => {});
                    }
                }
            }
        }

        return res.json({
            success: true,
            data: {
                ...card,
                user: card.user ? { ...card.user, isPro: effectiveOwnerIsPro } : card.user,
                primaryColor: branding?.primaryColor || card.primaryColor || '#0666EB',
                companyName: cleanCompanyName,
                bioVisible: card.bio_visible !== false,
                companyBranding: branding ? { ...branding, companyName: cleanCompanyName } : (cleanCompanyName ? { companyName: cleanCompanyName } : null),
            }
        });
    } catch (error: any) {
        console.error('Error fetching public card:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de la carte.'
        });
    }
};

/**
 * Enregistre un lead (échange de contact)
 * Fonctionne pour B2C (companyId peut être null) et B2B
 */
export const exchangeContact = async (req: Request, res: Response) => {
    try {
        const slug = String(req.params.slug);
        const { firstName, lastName, email, phone, companyName, notes } = req.body;

        const card = await prisma.card.findUnique({
            where: { publicSlug: slug },
            include: {
                user: {
                    select: {
                        id: true,
                        companyId: true
                    }
                }
            }
        });

        if (!card) {
            return res.status(404).json({
                success: false,
                error: 'Carte introuvable.'
            });
        }

        const leadData: any = {
            cardId: card.id,
            userId: card.userId,
            firstName,
            lastName,
            email,
            phone,
            companyName: companyName || null,
            notes,
            source: 'web_link',
        };

        // Relier à la company uniquement si l'utilisateur en a une (B2B)
        if (card.user.companyId) {
            leadData.companyId = card.user.companyId;
        }

        const lead = await prisma.contactLead.create({ data: leadData });

        // Synchronisation automatique temps réel vers le CRM (Tiime.fr, HubSpot, Pipedrive, Webhook)
        try {
            const { getCrmConfig, pushLeadToCrm } = await import('../../services/crm-sync.service');
            const ownerFullName = [card.firstName, card.lastName].filter(Boolean).join(' ') || 'Membre KlikNode';

            if (card.user.companyId) {
                const companyScope = `company:${card.user.companyId}`;
                const companyCrm = getCrmConfig(companyScope);
                if (companyCrm.enabled && companyCrm.autoSync) {
                    pushLeadToCrm(companyScope, { ...lead, ownerName: ownerFullName }).catch((err) =>
                        console.error('Auto CRM sync (company) failed:', err)
                    );
                }
            }

            const userScope = `user:${card.userId}`;
            const userCrm = getCrmConfig(userScope);
            if (userCrm.enabled && userCrm.autoSync) {
                pushLeadToCrm(userScope, { ...lead, ownerName: ownerFullName }).catch((err) =>
                    console.error('Auto CRM sync (user) failed:', err)
                );
            }
        } catch (crmErr) {
            console.error('CRM auto-sync hook error:', crmErr);
        }

        return res.json({
            success: true,
            message: 'Contact partagé avec succès !',
            data: lead
        });
    } catch (error: any) {
        console.error('Error creating contact lead:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'envoi de vos informations.'
        });
    }
};

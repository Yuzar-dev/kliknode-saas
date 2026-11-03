import { Request, Response } from 'express';
import prisma from '../../config/database';
import logger from '../../utils/logger.util';
import { ApiResponse } from '../../types/express';

// ═══════════════════════════════════════
//  CARD CRUD
// ═══════════════════════════════════════

/**
 * GET /api/user/card
 * Récupérer ma carte digitale
 */
export const getMyCard = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const card = await prisma.card.findUnique({
            where: { userId: req.user!.id },
            include: {
                physicalCard: {
                    select: {
                        uid: true,
                        status: true,
                        pairedAt: true,
                    },
                },
            },
        });

        if (!card) {
            return res.status(404).json({
                success: false,
                error: { code: 'CARD_NOT_FOUND', message: 'Aucune carte associée à votre compte' },
            });
        }

        return res.status(200).json({ success: true, data: card });
    } catch (error: any) {
        logger.error('Get my card error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la récupération de la carte' },
        });
    }
};

/**
 * PUT /api/user/card
 * Mettre à jour ma carte
 */
export const updateMyCard = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const {
            firstName, lastName, jobTitle, companyName,
            bio, phoneMobile, phoneOffice, email,
            website, address, city, country,
            theme, primaryColor, isPublic,
        } = req.body;

        const card = await prisma.card.findUnique({ where: { userId: req.user!.id } });
        if (!card) {
            return res.status(404).json({
                success: false,
                error: { code: 'CARD_NOT_FOUND', message: 'Aucune carte associée' },
            });
        }

        const updated = await prisma.card.update({
            where: { userId: req.user!.id },
            data: {
                firstName, lastName, jobTitle, companyName,
                bio, phoneMobile, phoneOffice, email,
                website, address, city, country,
                theme, primaryColor, isPublic,
            },
        });

        return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
        logger.error('Update card error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la mise à jour' },
        });
    }
};

/**
 * POST /api/user/card/avatar
 * Upload avatar (multer, à intégrer plus tard avec S3)
 * Pour l'instant on accepte une URL directe
 */
export const uploadAvatar = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { avatarUrl } = req.body;

        if (!avatarUrl) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_URL', message: 'URL de l\'avatar requise' },
            });
        }

        const updated = await prisma.card.update({
            where: { userId: req.user!.id },
            data: { avatarUrl },
        });

        return res.status(200).json({ success: true, data: { avatarUrl: updated.avatarUrl } });
    } catch (error: any) {
        logger.error('Upload avatar error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de l\'upload' },
        });
    }
};

// ═══════════════════════════════════════
//  SOCIAL LINKS CRUD (USING JSON FIELD)
// ═══════════════════════════════════════

/**
 * GET /api/user/social-links
 */
export const getSocialLinks = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const card = await prisma.card.findUnique({ where: { userId: req.user!.id } });
        if (!card) {
            return res.status(404).json({
                success: false,
                error: { code: 'CARD_NOT_FOUND', message: 'Aucune carte associée' },
            });
        }

        const links = Array.isArray(card.socialLinks) ? card.socialLinks : [];
        return res.status(200).json({ success: true, data: links });
    } catch (error: any) {
        logger.error('Get social links error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur' },
        });
    }
};

/**
 * POST /api/user/social-links
 */
export const addSocialLink = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { platform, url, label, icon } = req.body;

        const card = await prisma.card.findUnique({ where: { userId: req.user!.id } });
        if (!card) {
            return res.status(404).json({
                success: false,
                error: { code: 'CARD_NOT_FOUND', message: 'Aucune carte associée' },
            });
        }

        const currentLinks: any[] = Array.isArray(card.socialLinks) ? card.socialLinks : [];
        const maxOrder = currentLinks.length > 0 ? Math.max(...currentLinks.map(l => l.order || 0)) : -1;

        const crypto = await import('crypto');
        const newLink = {
            id: crypto.randomUUID(),
            platform,
            url,
            label: label || platform,
            icon: icon || platform.toLowerCase(),
            order: maxOrder + 1,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const updatedLinks = [...currentLinks, newLink];

        await prisma.card.update({
            where: { id: card.id },
            data: { socialLinks: updatedLinks }
        });

        return res.status(201).json({ success: true, data: newLink });
    } catch (error: any) {
        logger.error('Add social link error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de l\'ajout du lien' },
        });
    }
};

/**
 * PUT /api/user/social-links/:id
 */
export const updateSocialLink = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = req.params.id as string;
        const { platform, url, label, icon, isActive } = req.body;

        const card = await prisma.card.findUnique({ where: { userId: req.user!.id } });
        if (!card) {
            return res.status(404).json({
                success: false,
                error: { code: 'CARD_NOT_FOUND', message: 'Aucune carte associée' },
            });
        }

        const currentLinks: any[] = Array.isArray(card.socialLinks) ? card.socialLinks : [];
        const linkIndex = currentLinks.findIndex(l => l.id === id);

        if (linkIndex === -1) {
            return res.status(404).json({
                success: false,
                error: { code: 'LINK_NOT_FOUND', message: 'Lien introuvable' },
            });
        }

        currentLinks[linkIndex] = {
            ...currentLinks[linkIndex],
            platform: platform !== undefined ? platform : currentLinks[linkIndex].platform,
            url: url !== undefined ? url : currentLinks[linkIndex].url,
            label: label !== undefined ? label : currentLinks[linkIndex].label,
            icon: icon !== undefined ? icon : currentLinks[linkIndex].icon,
            isActive: isActive !== undefined ? isActive : currentLinks[linkIndex].isActive,
            updatedAt: new Date().toISOString()
        };

        await prisma.card.update({
            where: { id: card.id },
            data: { socialLinks: currentLinks }
        });

        return res.status(200).json({ success: true, data: currentLinks[linkIndex] });
    } catch (error: any) {
        logger.error('Update social link error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la modification' },
        });
    }
};

/**
 * DELETE /api/user/social-links/:id
 */
export const deleteSocialLink = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = req.params.id as string;

        const card = await prisma.card.findUnique({ where: { userId: req.user!.id } });
        if (!card) {
            return res.status(404).json({
                success: false,
                error: { code: 'CARD_NOT_FOUND', message: 'Aucune carte associée' },
            });
        }

        const currentLinks: any[] = Array.isArray(card.socialLinks) ? card.socialLinks : [];
        const linkExists = currentLinks.some(l => l.id === id);

        if (!linkExists) {
            return res.status(404).json({
                success: false,
                error: { code: 'LINK_NOT_FOUND', message: 'Lien introuvable' },
            });
        }

        const updatedLinks = currentLinks.filter(l => l.id !== id);

        await prisma.card.update({
            where: { id: card.id },
            data: { socialLinks: updatedLinks }
        });

        return res.status(200).json({ success: true, data: { deleted: true } });
    } catch (error: any) {
        logger.error('Delete social link error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la suppression' },
        });
    }
};

/**
 * PUT /api/user/social-links/reorder
 */
export const reorderSocialLinks = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { orderedIds } = req.body; // Array of link IDs in desired order

        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_DATA', message: 'orderedIds doit être un tableau' },
            });
        }

        const card = await prisma.card.findUnique({ where: { userId: req.user!.id } });
        if (!card) {
            return res.status(404).json({
                success: false,
                error: { code: 'CARD_NOT_FOUND', message: 'Aucune carte associée' },
            });
        }

        const currentLinks: any[] = Array.isArray(card.socialLinks) ? card.socialLinks : [];

        // Mettre à jour l'ordre selon le tableau
        const updatedLinks = currentLinks.map(link => {
            const index = orderedIds.indexOf(link.id);
            if (index !== -1) {
                return { ...link, order: index, updatedAt: new Date().toISOString() };
            }
            return link;
        });

        await prisma.card.update({
            where: { id: card.id },
            data: { socialLinks: updatedLinks }
        });

        return res.status(200).json({ success: true, data: { reordered: true } });
    } catch (error: any) {
        logger.error('Reorder links error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors du réordonnancement' },
        });
    }
};

// ═══════════════════════════════════════
//  ANALYTICS
// ═══════════════════════════════════════

/**
 * GET /api/user/analytics
 * Stats personnelles (vues, scans, contacts)
 */
export const getAnalytics = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const card = await prisma.card.findUnique({
            where: { userId: req.user!.id },
            select: { id: true, viewCount: true },
        });

        if (!card) {
            return res.status(404).json({
                success: false,
                error: { code: 'CARD_NOT_FOUND', message: 'Aucune carte associée' },
            });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [totalScans, recentScans, totalContacts, scansByDay] = await Promise.all([
            prisma.cardScan.count({ where: { cardId: card.id } }),
            prisma.cardScan.count({
                where: { cardId: card.id, scannedAt: { gte: thirtyDaysAgo } },
            }),
            prisma.contactLead.count({ where: { cardId: card.id } }),
            prisma.cardScan.groupBy({
                by: ['scannedAt'],
                where: { cardId: card.id, scannedAt: { gte: thirtyDaysAgo } },
                _count: { id: true },
            }),
        ]);

        // Group scans by day
        const dailyScans: Record<string, number> = {};
        scansByDay.forEach((s) => {
            const day = new Date(s.scannedAt).toISOString().split('T')[0];
            dailyScans[day] = (dailyScans[day] || 0) + s._count.id;
        });

        return res.status(200).json({
            success: true,
            data: {
                totalViews: card.viewCount,
                totalScans,
                recentScans,
                totalContacts,
                dailyScans,
            },
        });
    } catch (error: any) {
        logger.error('Get analytics error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la récupération des analytics' },
        });
    }
};

// ═══════════════════════════════════════
//  LEADS
// ═══════════════════════════════════════

export const getLeads = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const card = await prisma.card.findUnique({ where: { userId: req.user!.id }, select: { id: true } });
        if (!card) {
            return res.status(404).json({ success: false, error: { code: 'CARD_NOT_FOUND', message: 'Aucune carte associée' } });
        }

        const [leads, total] = await Promise.all([
            prisma.contactLead.findMany({ where: { cardId: card.id }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
            prisma.contactLead.count({ where: { cardId: card.id } }),
        ]);

        return res.status(200).json({ success: true, data: { leads, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
    } catch (error: any) {
        logger.error('Get leads error:', error);
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur' } });
    }
};

export const updateUserLead = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = req.params.id as string;
        const { notes, firstName, lastName, email, phone, companyName } = req.body;
        const existing = await prisma.contactLead.findFirst({
            where: { id, userId: req.user!.id }
        });
        if (!existing) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Prospect introuvable' } });
        }
        const updated = await prisma.contactLead.update({
            where: { id },
            data: {
                notes: notes !== undefined ? notes : existing.notes,
                firstName: firstName !== undefined ? firstName : existing.firstName,
                lastName: lastName !== undefined ? lastName : existing.lastName,
                email: email !== undefined ? email : existing.email,
                phone: phone !== undefined ? phone : existing.phone,
                companyName: companyName !== undefined ? companyName : existing.companyName,
            }
        });
        return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
        logger.error('Update user lead error:', error);
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur mise à jour prospect' } });
    }
};

export const deleteUserLead = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = req.params.id as string;
        const existing = await prisma.contactLead.findFirst({
            where: { id, userId: req.user!.id }
        });
        if (!existing) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Prospect introuvable' } });
        }
        await prisma.contactLead.delete({ where: { id } });
        return res.status(200).json({ success: true, data: { deleted: true } });
    } catch (error: any) {
        logger.error('Delete user lead error:', error);
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur suppression prospect' } });
    }
};

export const getUserCrmConfig = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { getCrmConfig } = await import('../../services/crm-sync.service');
        const config = getCrmConfig(`user:${req.user!.id}`);
        return res.status(200).json({ success: true, data: config });
    } catch (error: any) {
        logger.error('Get user CRM config error:', error);
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur CRM' } });
    }
};

export const saveUserCrmConfig = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { provider, enabled, autoSync, apiKey, webhookUrl, tiimeCompanyId } = req.body;
        const { saveCrmConfig } = await import('../../services/crm-sync.service');
        const updated = saveCrmConfig(`user:${req.user!.id}`, {
            provider: provider || 'tiime',
            enabled: Boolean(enabled),
            autoSync: autoSync !== undefined ? Boolean(autoSync) : true,
            apiKey: apiKey !== undefined ? String(apiKey).trim() : '',
            webhookUrl: webhookUrl !== undefined ? String(webhookUrl).trim() : '',
            tiimeCompanyId: tiimeCompanyId !== undefined ? String(tiimeCompanyId).trim() : '',
        });
        return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
        logger.error('Save user CRM config error:', error);
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur sauvegarde CRM' } });
    }
};

export const syncUserLeadsToCrm = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const card = await prisma.card.findUnique({ where: { userId: req.user!.id } });
        if (!card) {
            return res.status(404).json({ success: false, error: { code: 'CARD_NOT_FOUND', message: 'Aucune carte associée' } });
        }
        const leads = await prisma.contactLead.findMany({
            where: { cardId: card.id },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        const { syncLeadsBatchToCrm } = await import('../../services/crm-sync.service');
        const ownerName = [card.firstName, card.lastName].filter(Boolean).join(' ') || 'Membre PRO';
        const result = await syncLeadsBatchToCrm(
            `user:${req.user!.id}`,
            leads.map(l => ({ ...l, ownerName }))
        );

        return res.status(200).json({ success: result.syncedCount > 0, data: result });
    } catch (error: any) {
        logger.error('Sync user leads CRM error:', error);
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur synchronisation CRM' } });
    }
};

// ═══════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════

export const changePassword = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const bcrypt = await import('bcryptjs');
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Champs requis manquants' } });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: 'Minimum 6 caractères' } });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
        if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'Introuvable' } });

        const isValid = await bcrypt.default.compare(currentPassword, user.passwordHash);
        if (!isValid) return res.status(400).json({ success: false, error: { code: 'WRONG_PASSWORD', message: 'Mot de passe actuel incorrect' } });

        const hashed = await bcrypt.default.hash(newPassword, 10);
        await prisma.user.update({ where: { id: req.user!.id }, data: { passwordHash: hashed } });

        return res.status(200).json({ success: true, data: { message: 'Mot de passe mis à jour' } });
    } catch (error: any) {
        logger.error('Change password error:', error);
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur' } });
    }
};

/**
 * GET /api/user/plans
 * Récupère les plans d'abonnement B2C actifs et le plan actuel de l'utilisateur
 */
export const getB2CPlans = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.id;
        const { resolvePlanAudience } = await import('../admin/plan.controller');

        const [user, allActivePlans] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, firstName: true, lastName: true, role: true, isPro: true }
            }),
            prisma.subscriptionPlan.findMany({
                where: { isActive: true },
                orderBy: { priceEur: 'asc' }
            })
        ]);

        let b2cPlans = allActivePlans.filter(p => resolvePlanAudience(p) === 'B2C');

        // S'assurer qu'au moins un plan B2C PRO existe
        if (!b2cPlans.some(p => Number(p.priceEur) > 0)) {
            const createdPro = await prisma.subscriptionPlan.create({
                data: {
                    name: 'KlikNode PRO (Individuel)',
                    slug: 'pro-b2c',
                    priceEur: 9.99,
                    priceMad: 99,
                    billingPeriod: 'monthly',
                    maxLicenses: 1,
                    isActive: true,
                    features: {
                        targetAudience: 'B2C',
                        grantsPro: true,
                        lead_gen: true,
                        analytics: true,
                        wallet_pass: true,
                        custom_branding: true,
                        priority_support: true
                    }
                }
            });
            b2cPlans.push(createdPro);
        }

        const currentPlan = user?.isPro
            ? (b2cPlans.find(p => Number(p.priceEur) > 0) || b2cPlans[0])
            : (b2cPlans.find(p => Number(p.priceEur) === 0) || null);

        return res.status(200).json({
            success: true,
            data: {
                plans: b2cPlans,
                currentPlan,
                isPro: user?.isPro || false,
                user
            }
        });
    } catch (error: any) {
        logger.error('Get B2C plans error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la récupération des offres B2C' }
        });
    }
};

/**
 * POST /api/user/subscribe
 * Souscrire ou changer de plan B2C pour un utilisateur normal
 */
export const subscribeB2CPlan = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.id;
        const { planId } = req.body;

        if (!planId) {
            return res.status(400).json({
                success: false,
                error: { code: 'BAD_REQUEST', message: 'Identifiant du plan requis' }
            });
        }

        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!plan) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Plan introuvable' }
            });
        }

        const feat = (plan.features && typeof plan.features === 'object') ? (plan.features as any) : {};
        const grantsPro = feat.grantsPro !== undefined ? Boolean(feat.grantsPro) : Number(plan.priceEur) > 0;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isPro: grantsPro }
        });

        return res.status(200).json({
            success: true,
            data: {
                message: grantsPro
                    ? `Abonnement ${plan.name} activé avec succès ⚡`
                    : `Vous êtes passé sur l'offre ${plan.name}`,
                plan,
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    isPro: updatedUser.isPro,
                    role: updatedUser.role
                }
            }
        });
    } catch (error: any) {
        logger.error('Subscribe B2C plan error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors du changement d\'offre B2C' }
        });
    }
};

/**
 * POST /api/user/upgrade-simulate
 * Simulation de passage au statut PRO pour les tests en local
 */
export const upgradeSimulate = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.id;

        // Mettre à jour l'utilisateur local
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isPro: true }
        });

        logger.info(`User ${userId} successfully upgraded to PRO (Simulated)`);

        return res.status(200).json({
            success: true,
            data: {
                message: "Vous êtes maintenant membre PRO ⚡ (Simulation)",
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    isPro: updatedUser.isPro,
                    role: updatedUser.role
                }
            }
        });
    } catch (error: any) {
        logger.error('Upgrade simulate error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la simulation de surclassement PRO' },
        });
    }
};


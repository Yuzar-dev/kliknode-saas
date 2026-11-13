import { Request, Response } from 'express';
import prisma from '../../config/database';
import logger from '../../utils/logger.util';
import { ApiResponse } from '../../types/express';

// ═══════════════════════════════════════
//  CARD CRUD
// ═══════════════════════════════════════

const makeDefaultSlug = (firstName?: string | null, lastName?: string | null) => {
    const base = `${firstName || 'user'}-${lastName || 'card'}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${base}-${suffix}`;
};

/**
 * GET /api/user/card
 * Récupérer ma carte digitale (avec auto-création si absente, auto-pairage B2B et branding entreprise)
 */
export const getMyCard = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: {
                company: {
                    include: { branding: true },
                },
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'Utilisateur introuvable' },
            });
        }

        const branding = user.company?.branding || null;

        let card = await prisma.card.findUnique({
            where: { userId: user.id },
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

        // Si l'utilisateur n'a pas encore de carte dans `cards`, on la crée automatiquement avec ses infos
        if (!card) {
            card = await prisma.card.create({
                data: {
                    userId: user.id,
                    companyId: user.companyId || null,
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email,
                    phoneMobile: user.phone || null,
                    jobTitle: user.companyId ? 'Collaborateur' : '',
                    companyName: user.company?.name || null,
                    primaryColor: branding?.primaryColor || '#0666EB',
                    publicSlug: makeDefaultSlug(user.firstName, user.lastName),
                    isPublic: true,
                },
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
        } else if (user.companyId && (!card.companyId || (!card.companyName && user.company?.name))) {
            card = await prisma.card.update({
                where: { id: card.id },
                data: {
                    companyId: user.companyId,
                    companyName: card.companyName || user.company?.name || null,
                },
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
        }

        // Si l'employé appartient à une entreprise qui a des cartes physiques B2B réservées non encore pairées,
        // associer automatiquement une carte disponible à son profil
        if (user.companyId && !card.physicalCard && user.role !== 'MANAGER' && user.role !== 'ADMIN') {
            const availablePhysical = await prisma.physicalCard.findFirst({
                where: {
                    companyId: user.companyId,
                    status: 'reserved',
                    pairedCardId: null,
                },
                orderBy: { createdAt: 'asc' },
            }).catch(() => null);

            if (availablePhysical) {
                const paired = await prisma.physicalCard.update({
                    where: { id: availablePhysical.id },
                    data: {
                        status: 'paired',
                        pairedCardId: card.id,
                        pairedAt: new Date(),
                    },
                    select: {
                        uid: true,
                        status: true,
                        pairedAt: true,
                    },
                }).catch(() => null);
                if (paired) {
                    (card as any).physicalCard = paired;
                }
            }
        }

        const effectivePrimaryColor = branding?.primaryColor || card.primaryColor || '#0666EB';
        const rawCompanyName = user.company?.name || card.companyName || '';
        const parenMatch = rawCompanyName.match(/^[^()]+\(([^()]+)\)\s*$/);
        const effectiveCompanyName = parenMatch ? parenMatch[1].trim() : rawCompanyName;
        if (parenMatch && user.companyId) {
            prisma.company.update({ where: { id: user.companyId }, data: { name: effectiveCompanyName } }).catch(() => {});
            prisma.card.updateMany({ where: { companyId: user.companyId }, data: { companyName: effectiveCompanyName } }).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            data: {
                ...card,
                primaryColor: effectivePrimaryColor,
                companyName: effectiveCompanyName,
                bioVisible: card.bio_visible !== false,
                companyBranding: branding ? { ...branding, companyName: effectiveCompanyName } : null,
            },
        });
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
 * Mettre à jour ma carte (avec respect strict du Master Lock B2B)
 */
export const updateMyCard = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const {
            firstName, lastName, jobTitle, companyName,
            bio, bioVisible, phoneMobile, phoneOffice, email,
            website, address, city, country,
            theme, primaryColor, coverUrl, avatarUrl,
            isPublic, leadGenActive, socialLinks,
        } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: {
                company: {
                    include: { branding: true },
                },
            },
        });

        const branding = user?.company?.branding || null;
        const lockJobTitle = Boolean(branding?.lockJobTitle);
        const lockPhoto = Boolean(branding?.lockPhoto);
        const lockSocialLinks = Boolean(branding?.lockSocialLinks);

        let card = await prisma.card.findUnique({ where: { userId: req.user!.id } });
        if (!card) {
            card = await prisma.card.create({
                data: {
                    userId: req.user!.id,
                    companyId: user?.companyId || null,
                    firstName: firstName || user?.firstName || '',
                    lastName: lastName || user?.lastName || '',
                    email: email || user?.email || '',
                    publicSlug: makeDefaultSlug(firstName || user?.firstName, lastName || user?.lastName),
                    isPublic: true,
                },
            });
        }

        const updateData: any = {
            firstName: firstName !== undefined ? firstName : card.firstName,
            lastName: lastName !== undefined ? lastName : card.lastName,
            jobTitle: lockJobTitle ? card.jobTitle : (jobTitle !== undefined ? jobTitle : card.jobTitle),
            companyName: user?.company?.name ? user.company.name : (companyName !== undefined ? companyName : card.companyName),
            bio: bio !== undefined ? bio : card.bio,
            bio_visible: bioVisible !== undefined ? Boolean(bioVisible) : card.bio_visible,
            phoneMobile: phoneMobile !== undefined ? phoneMobile : card.phoneMobile,
            phoneOffice: phoneOffice !== undefined ? phoneOffice : card.phoneOffice,
            email: email !== undefined ? email : card.email,
            website: website !== undefined ? website : card.website,
            address: address !== undefined ? address : card.address,
            city: city !== undefined ? city : card.city,
            country: country !== undefined ? country : card.country,
            theme: theme !== undefined ? theme : card.theme,
            primaryColor: branding?.primaryColor ? branding.primaryColor : (primaryColor !== undefined ? primaryColor : card.primaryColor),
            coverUrl: coverUrl !== undefined ? coverUrl : card.coverUrl,
            avatarUrl: lockPhoto ? card.avatarUrl : (avatarUrl !== undefined ? avatarUrl : card.avatarUrl),
            isPublic: isPublic !== undefined ? Boolean(isPublic) : card.isPublic,
            leadGenActive: leadGenActive !== undefined ? Boolean(leadGenActive) : card.leadGenActive,
            ...(socialLinks !== undefined && !lockSocialLinks ? { socialLinks } : {}),
        };

        const updated = await prisma.card.update({
            where: { userId: req.user!.id },
            data: updateData,
        });

        return res.status(200).json({
            success: true,
            data: {
                ...updated,
                bioVisible: updated.bio_visible !== false,
                companyBranding: branding,
            },
        });
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
 * Upload avatar (supporte Data URL base64 ou URL directe, avec respect de Master Lock)
 */
export const uploadAvatar = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { avatarUrl } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: { company: { include: { branding: true } } },
        });

        if (user?.company?.branding?.lockPhoto) {
            return res.status(403).json({
                success: false,
                error: { code: 'MASTER_LOCK', message: 'La photo de profil est verrouillée par votre entreprise (Master Lock)' },
            });
        }

        const updated = await prisma.card.update({
            where: { userId: req.user!.id },
            data: { avatarUrl: avatarUrl || null },
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
 * Si l'utilisateur appartient à une entreprise (companyId != null), synchronise son statut isPro
 * avec le plan B2B réel de son entreprise.
 */
export const getB2CPlans = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.id;
        const { resolvePlanAudience } = await import('../admin/plan.controller');

        const [user, allActivePlans] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                include: {
                    company: {
                        include: {
                            subscription: {
                                include: { plan: true },
                            },
                        },
                    },
                },
            }),
            prisma.subscriptionPlan.findMany({
                where: { isActive: true },
                orderBy: { priceEur: 'asc' },
            }),
        ]);

        // Cas 1 : Collaborateur rattaché à une entreprise B2B
        if (user?.companyId) {
            const companySub = user.company?.subscription;
            const companyPlan = companySub?.plan || null;
            const isSubActive = !companySub || companySub.status === 'active' || companySub.status === 'trialing';
            const companyIsPro = Boolean(
                companyPlan &&
                isSubActive &&
                Number(companyPlan.priceEur) > 0 &&
                String(companyPlan.slug || '').toLowerCase() !== 'free' &&
                String(companyPlan.name || '').toLowerCase() !== 'free'
            );

            if (user.isPro !== companyIsPro && user.role === 'USER') {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { isPro: companyIsPro },
                }).catch(() => {});
            }

            const rawName = user.company?.name || 'Entreprise';
            const parenMatch = rawName.match(/^[^()]+\(([^()]+)\)\s*$/);
            const cleanedCompanyName = parenMatch ? parenMatch[1].trim() : rawName;

            const existingRequest = await prisma.auditLog.findFirst({
                where: {
                    userId: user.id,
                    action: 'EMPLOYEE_UPGRADE_REQUEST',
                },
                orderBy: { createdAt: 'desc' },
            }).catch(() => null);

            const effectiveCompanyPlan = companyPlan || {
                id: 'free-b2b',
                name: 'Free',
                slug: 'free',
                priceEur: 0,
                priceMad: 0,
                billingPeriod: 'monthly',
                features: {},
            };

            return res.status(200).json({
                success: true,
                data: {
                    isCompanyMember: true,
                    companyName: cleanedCompanyName,
                    companyAdminEmail: user.company?.adminEmail || '',
                    companyPlan: effectiveCompanyPlan,
                    upgradeRequested: Boolean(existingRequest),
                    plans: [],
                    currentPlan: effectiveCompanyPlan,
                    isPro: user.role === 'ADMIN' || user.role === 'MANAGER' ? true : companyIsPro,
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        companyId: user.companyId,
                        companyName: cleanedCompanyName,
                        isPro: user.role === 'ADMIN' || user.role === 'MANAGER' ? true : companyIsPro,
                    },
                },
            });
        }

        // Cas 2 : Utilisateur individuel B2C (sans entreprise)
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
                        trialDays: 7,
                        lead_gen: true,
                        analytics: true,
                        wallet_pass: true,
                        custom_branding: true,
                        priority_support: true,
                    },
                },
            });
            b2cPlans.push(createdPro);
        }

        // Vérifier l'état de l'essai gratuit B2C (7 jours) ou de l'abonnement Stripe actif
        const latestSubLog = await prisma.auditLog.findFirst({
            where: {
                userId,
                action: 'B2C_TRIAL_SUBSCRIPTION',
            },
            orderBy: { createdAt: 'desc' },
        }).catch(() => null);

        const subMeta = (latestSubLog?.changes && typeof latestSubLog.changes === 'object')
            ? (latestSubLog.changes as any)
            : null;

        let effectiveB2CIsPro = Boolean(user?.isPro);
        let trialEndsAt: string | null = subMeta?.trialEndsAt || null;
        const hasUsedTrial = Boolean(latestSubLog);

        if (subMeta?.stripeSubscriptionId) {
            const { checkStripeSubscriptionStatus } = await import('../../services/stripe.service');
            const liveSub = await checkStripeSubscriptionStatus(subMeta.stripeSubscriptionId);
            if (liveSub) {
                effectiveB2CIsPro = liveSub.isActive;
                if (liveSub.trialEndsAt) trialEndsAt = liveSub.trialEndsAt;
                if (user && user.isPro !== effectiveB2CIsPro) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { isPro: effectiveB2CIsPro },
                    }).catch(() => {});
                }
            }
        } else if (subMeta && !subMeta.paidConfirmed && trialEndsAt) {
            // Essai local de 7 jours sans paiement confirmé : expiration automatique après 7 jours
            if (new Date(trialEndsAt).getTime() <= Date.now()) {
                effectiveB2CIsPro = false;
                if (user?.isPro) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { isPro: false },
                    }).catch(() => {});
                }
            }
        }

        const isTrialActive = Boolean(
            effectiveB2CIsPro &&
            trialEndsAt &&
            new Date(trialEndsAt).getTime() > Date.now()
        );
        const trialDaysLeft = isTrialActive && trialEndsAt
            ? Math.max(1, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
            : 0;

        const currentPlan = effectiveB2CIsPro
            ? (b2cPlans.find(p => p.id === subMeta?.planId) || b2cPlans.find(p => Number(p.priceEur) > 0) || b2cPlans[0])
            : (b2cPlans.find(p => Number(p.priceEur) === 0) || null);

        return res.status(200).json({
            success: true,
            data: {
                isCompanyMember: false,
                trialEligible: !hasUsedTrial,
                isTrialActive,
                trialEndsAt,
                trialDaysLeft,
                plans: b2cPlans,
                currentPlan,
                isPro: effectiveB2CIsPro,
                user: user ? {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    companyId: null,
                    isPro: effectiveB2CIsPro,
                } : null,
            },
        });
    } catch (error: any) {
        logger.error('Get B2C plans error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la récupération des offres B2C' },
        });
    }
};

/**
 * POST /api/user/subscribe
 * - Pour un collaborateur d'entreprise (companyId != null) : INTERDIT l'activation directe sans accord du Manager,
 *   synchronise isPro avec le plan de l'entreprise et envoie une demande de mise à niveau au Manager.
 * - Pour un utilisateur B2C individuel (companyId == null) : exige un paiement Stripe pour tout plan payant (priceEur > 0).
 */
export const subscribeB2CPlan = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.id;
        const { planId, sessionId } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                company: {
                    include: {
                        subscription: {
                            include: { plan: true },
                        },
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Utilisateur introuvable' },
            });
        }

        // CAS 1 : Collaborateur rattaché à une entreprise B2B -> Ne peut JAMAIS activer un abonnement tout seul
        if (user.companyId) {
            const companySub = user.company?.subscription;
            const companyPlan = companySub?.plan || null;
            const isSubActive = !companySub || companySub.status === 'active' || companySub.status === 'trialing';
            const companyIsPro = Boolean(
                companyPlan &&
                isSubActive &&
                Number(companyPlan.priceEur) > 0 &&
                String(companyPlan.slug || '').toLowerCase() !== 'free' &&
                String(companyPlan.name || '').toLowerCase() !== 'free'
            );

            if (user.isPro !== companyIsPro && user.role === 'USER') {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { isPro: companyIsPro },
                }).catch(() => {});
            }

            const rawName = user.company?.name || 'votre entreprise';
            const parenMatch = rawName.match(/^[^()]+\(([^()]+)\)\s*$/);
            const cleanedCompanyName = parenMatch ? parenMatch[1].trim() : rawName;
            const managerEmail = user.company?.adminEmail || '';

            // Enregistrer la demande d'activation pour le Manager dans les logs d'audit
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'EMPLOYEE_UPGRADE_REQUEST',
                    entityType: 'company',
                    entityId: user.companyId,
                    changes: {
                        employeeEmail: user.email,
                        employeeName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                        companyId: user.companyId,
                        companyName: cleanedCompanyName,
                        managerEmail,
                        currentCompanyPlan: companyPlan?.name || 'Free',
                        requestedAt: new Date().toISOString(),
                    },
                },
            }).catch(() => {});

            return res.status(200).json({
                success: true,
                data: {
                    requiresManagerApproval: true,
                    activated: false,
                    isPro: companyIsPro,
                    companyName: cleanedCompanyName,
                    managerEmail,
                    message: `Demande envoyée au Manager (${managerEmail || cleanedCompanyName}). Votre entreprise est sous l'offre "${companyPlan?.name || 'Free'}" : seul votre Manager peut autoriser et payer le passage à l'offre PRO.`,
                    user: {
                        id: user.id,
                        email: user.email,
                        isPro: companyIsPro,
                        role: user.role,
                    },
                },
            });
        }

        // CAS 2 : Utilisateur B2C individuel (sans entreprise)
        const {
            ensureStripeConfigLoaded,
            getStripeConfig,
            createStripeCheckoutLink,
            verifyStripeCheckoutSession,
        } = await import('../../services/stripe.service');
        await ensureStripeConfigLoaded();

        // Retour de Stripe Checkout (confirmation de session d'essai 7j ou paiement)
        if (sessionId) {
            const verified = await verifyStripeCheckoutSession(String(sessionId));
            if (!verified.paidOrTrialActive) {
                return res.status(402).json({
                    success: false,
                    error: { code: 'PAYMENT_INCOMPLETE', message: 'La session Stripe n\'a pas encore été validée.' },
                });
            }

            const resolvedPlanId = planId || verified.metadata?.planId;
            const confirmedPlan = resolvedPlanId
                ? await prisma.subscriptionPlan.findUnique({ where: { id: resolvedPlanId } })
                : null;

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { isPro: true },
            });

            const computedTrialEnd = verified.trialEndsAt || (verified.isTrial
                ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                : null);

            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'B2C_TRIAL_SUBSCRIPTION',
                    entityType: 'user',
                    entityId: user.id,
                    changes: {
                        planId: confirmedPlan?.id || resolvedPlanId || null,
                        planName: confirmedPlan?.name || 'KlikNode PRO',
                        stripeSessionId: sessionId,
                        stripeSubscriptionId: verified.subscriptionId,
                        isTrial: verified.isTrial,
                        trialEndsAt: computedTrialEnd,
                        paidConfirmed: true,
                        activatedAt: new Date().toISOString(),
                    },
                },
            }).catch(() => {});

            return res.status(200).json({
                success: true,
                data: {
                    activated: true,
                    isTrialActive: verified.isTrial,
                    trialEndsAt: computedTrialEnd,
                    trialDaysLeft: verified.isTrial ? 7 : 0,
                    message: verified.isTrial
                        ? 'Essai gratuit de 7 jours activé ! Votre abonnement passera automatiquement en facturation à l\'issue des 7 jours.'
                        : 'Abonnement PRO activé avec succès ⚡',
                    plan: confirmedPlan,
                    user: {
                        id: updatedUser.id,
                        email: updatedUser.email,
                        isPro: true,
                        role: updatedUser.role,
                    },
                },
            });
        }

        if (!planId) {
            return res.status(400).json({
                success: false,
                error: { code: 'BAD_REQUEST', message: 'Identifiant du plan requis' },
            });
        }

        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!plan) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Plan introuvable' },
            });
        }

        const priceEur = Number(plan.priceEur) || 0;

        // Si le plan choisi est Gratuit (0€), repasser en compte standard gratuit
        if (priceEur <= 0) {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { isPro: false },
            });

            return res.status(200).json({
                success: true,
                data: {
                    activated: true,
                    message: `Vous êtes passé sur l'offre ${plan.name} (Gratuit)`,
                    plan,
                    user: {
                        id: updatedUser.id,
                        email: updatedUser.email,
                        isPro: false,
                        role: updatedUser.role,
                    },
                },
            });
        }

        // Vérifier si l'utilisateur a déjà consommé sa semaine d'essai gratuit (7 jours)
        const existingTrialLog = await prisma.auditLog.findFirst({
            where: {
                userId: user.id,
                action: 'B2C_TRIAL_SUBSCRIPTION',
            },
        }).catch(() => null);

        const trialEligible = !existingTrialLog;
        const stripeConfig = getStripeConfig();

        // Si Stripe est configuré : ouvrir Stripe Checkout en mode Abonnement avec 7 jours d'essai gratuit (0€ aujourd'hui, puis débit auto à J+7)
        if (stripeConfig.isConfigured) {
            const reqOrigin = (req.headers.origin as string) || process.env.FRONTEND_URL || 'http://localhost:3001';
            const interval: 'month' | 'year' = plan.billingPeriod === 'yearly' ? 'year' : 'month';
            const checkout = await createStripeCheckoutLink({
                amount: priceEur,
                currency: 'EUR',
                customerEmail: user.email,
                title: trialEligible
                    ? `${plan.name} — 7 jours d'essai gratuit`
                    : `Abonnement ${plan.name} — KlikNode`,
                description: trialEligible
                    ? `7 jours gratuits (0,00 € aujourd'hui), puis ${priceEur.toFixed(2)}€/${interval === 'year' ? 'an' : 'mois'} automatiquement`
                    : `Souscription à l'offre ${plan.name} (${user.email})`,
                recurringInterval: interval,
                trialPeriodDays: trialEligible ? 7 : undefined,
                metadata: {
                    userId: user.id,
                    planId: plan.id,
                    type: 'b2c_subscription',
                },
                successUrl: `${reqOrigin}/user/settings?payment=success&plan=${plan.id}&session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${reqOrigin}/user/settings?payment=cancelled`,
            });

            return res.status(200).json({
                success: true,
                data: {
                    requiresPayment: true,
                    activated: false,
                    checkoutUrl: checkout.url,
                    message: trialEligible
                        ? 'Redirection vers Stripe pour démarrer vos 7 jours d\'essai gratuit (0,00 € aujourd\'hui)...'
                        : 'Redirection vers la page de paiement sécurisée Stripe...',
                    plan,
                    user: {
                        id: user.id,
                        email: user.email,
                        isPro: user.isPro,
                        role: user.role,
                    },
                },
            });
        }

        // Si Stripe n'est pas encore configuré mais que l'utilisateur n'a jamais utilisé ses 7 jours d'essai :
        // Activer l'essai gratuit unique de 7 jours (qui se verrouillera automatiquement à J+7 en exigeant le paiement)
        if (trialEligible) {
            const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { isPro: true },
            });

            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'B2C_TRIAL_SUBSCRIPTION',
                    entityType: 'user',
                    entityId: user.id,
                    changes: {
                        planId: plan.id,
                        planName: plan.name,
                        isTrial: true,
                        trialEndsAt,
                        paidConfirmed: false,
                        activatedAt: new Date().toISOString(),
                    },
                },
            }).catch(() => {});

            return res.status(200).json({
                success: true,
                data: {
                    activated: true,
                    isTrialActive: true,
                    trialEndsAt,
                    trialDaysLeft: 7,
                    message: `Semaine d'essai gratuit (7 jours) activée pour ${plan.name} ! À l'issue des 7 jours, l'abonnement deviendra payant (${priceEur.toFixed(2)}€).`,
                    plan,
                    user: {
                        id: updatedUser.id,
                        email: updatedUser.email,
                        isPro: true,
                        role: updatedUser.role,
                    },
                },
            });
        }

        return res.status(402).json({
            success: false,
            error: {
                code: 'PAYMENT_REQUIRED',
                message: `Votre période d'essai gratuit de 7 jours est terminée. Le paiement (${priceEur.toFixed(2)}€) via Stripe est requis pour continuer.`,
            },
        });
    } catch (error: any) {
        logger.error('Subscribe B2C plan error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message || 'Erreur lors du changement d\'offre' },
        });
    }
};

/**
 * POST /api/user/upgrade-simulate
 * Désactivé pour empêcher tout contournement gratuit : délègue au flux subscribeB2CPlan
 */
export const upgradeSimulate = async (req: Request, res: Response<ApiResponse>) => {
    return subscribeB2CPlan(req, res);
};


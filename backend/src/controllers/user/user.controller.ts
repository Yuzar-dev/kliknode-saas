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
                socialLinks: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' },
                },
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
//  SOCIAL LINKS CRUD
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

        const links = await prisma.socialLink.findMany({
            where: { cardId: card.id },
            orderBy: { order: 'asc' },
        });

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

        // Déterminer l'ordre max actuel
        const maxOrder = await prisma.socialLink.findFirst({
            where: { cardId: card.id },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const link = await prisma.socialLink.create({
            data: {
                cardId: card.id,
                platform,
                url,
                label: label || platform,
                icon: icon || platform.toLowerCase(),
                order: (maxOrder?.order ?? -1) + 1,
            },
        });

        return res.status(201).json({ success: true, data: link });
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
        const { id } = req.params;
        const { platform, url, label, icon, isActive } = req.body;

        // Vérifier ownership
        const card = await prisma.card.findUnique({ where: { userId: req.user!.id } });
        if (!card) {
            return res.status(404).json({
                success: false,
                error: { code: 'CARD_NOT_FOUND', message: 'Aucune carte associée' },
            });
        }

        const link = await prisma.socialLink.findFirst({
            where: { id, cardId: card.id },
        });

        if (!link) {
            return res.status(404).json({
                success: false,
                error: { code: 'LINK_NOT_FOUND', message: 'Lien introuvable' },
            });
        }

        const updated = await prisma.socialLink.update({
            where: { id },
            data: { platform, url, label, icon, isActive },
        });

        return res.status(200).json({ success: true, data: updated });
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
        const { id } = req.params;

        const card = await prisma.card.findUnique({ where: { userId: req.user!.id } });
        if (!card) {
            return res.status(404).json({
                success: false,
                error: { code: 'CARD_NOT_FOUND', message: 'Aucune carte associée' },
            });
        }

        const link = await prisma.socialLink.findFirst({
            where: { id, cardId: card.id },
        });

        if (!link) {
            return res.status(404).json({
                success: false,
                error: { code: 'LINK_NOT_FOUND', message: 'Lien introuvable' },
            });
        }

        await prisma.socialLink.delete({ where: { id } });

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

        // Mettre à jour l'ordre en batch
        await Promise.all(
            orderedIds.map((id: string, index: number) =>
                prisma.socialLink.updateMany({
                    where: { id, cardId: card.id },
                    data: { order: index },
                })
            )
        );

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

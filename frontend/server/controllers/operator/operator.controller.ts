import { Request, Response } from 'express';
import prisma from '../../config/database';
import logger from '../../utils/logger.util';
import { ApiResponse } from '../../types/express';

/**
 * POST /api/operator/encode
 * Enregistrer un UID de carte physique (NFC scan → save UID)
 */
export const encodeCard = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { uid, sku, batchTag, warehouse } = req.body;

        if (!uid) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_UID', message: 'UID de carte requis' },
            });
        }

        // Vérifier si l'UID existe déjà
        const existing = await prisma.physicalCard.findUnique({ where: { uid } });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: { code: 'UID_EXISTS', message: 'Cette carte est déjà enregistrée' },
            });
        }

        const physicalCard = await prisma.physicalCard.create({
            data: {
                uid,
                sku: sku || 'STD-NFC-01',
                batchTag: batchTag || null,
                status: 'in_stock',
                warehouse: warehouse || 'casablanca',
            },
        });

        logger.info(`Card encoded by operator ${req.user?.id}: UID=${uid}`);

        return res.status(201).json({
            success: true,
            data: physicalCard,
        });
    } catch (error: any) {
        logger.error('Encode card error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de l\'encodage' },
        });
    }
};

/**
 * POST /api/operator/pair
 * Pairer une carte physique à une carte digitale
 */
export const pairCard = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { uid, cardId } = req.body;

        if (!uid || !cardId) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_FIELDS', message: 'UID et cardId requis' },
            });
        }

        // Trouver la carte physique
        const physicalCard = await prisma.physicalCard.findUnique({ where: { uid } });
        if (!physicalCard) {
            return res.status(404).json({
                success: false,
                error: { code: 'CARD_NOT_FOUND', message: 'Carte physique introuvable' },
            });
        }

        if (physicalCard.pairedCardId) {
            return res.status(409).json({
                success: false,
                error: { code: 'ALREADY_PAIRED', message: 'Cette carte est déjà pairée' },
            });
        }

        // Vérifier que la carte digitale existe
        const digitalCard = await prisma.card.findUnique({ where: { id: cardId } });
        if (!digitalCard) {
            return res.status(404).json({
                success: false,
                error: { code: 'DIGITAL_CARD_NOT_FOUND', message: 'Carte digitale introuvable' },
            });
        }

        // Pairer
        const updated = await prisma.physicalCard.update({
            where: { uid },
            data: {
                pairedCardId: cardId,
                pairedAt: new Date(),
                pairedByOperatorId: req.user!.id,
                status: 'paired',
            },
        });

        logger.info(`Card paired: UID=${uid} → Card=${cardId} by operator ${req.user?.id}`);

        return res.status(200).json({
            success: true,
            data: updated,
        });
    } catch (error: any) {
        logger.error('Pair card error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors du pairage' },
        });
    }
};

/**
 * GET /api/operator/cards
 * Lister les cartes physiques (avec filtres)
 */
export const getCards = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { status, search, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const where: any = {};

        if (status && status !== 'all') {
            where.status = status;
        }

        if (search) {
            where.uid = { contains: search as string, mode: 'insensitive' };
        }

        const [cards, total] = await Promise.all([
            prisma.physicalCard.findMany({
                where,
                include: {
                    pairedCard: {
                        select: {
                            publicSlug: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.physicalCard.count({ where }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                cards,
                pagination: {
                    total,
                    page: parseInt(page as string),
                    limit: take,
                    totalPages: Math.ceil(total / take),
                },
            },
        });
    } catch (error: any) {
        logger.error('Get cards error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la récupération des cartes' },
        });
    }
};

/**
 * GET /api/operator/stats
 * Statistiques opérateur
 */
export const getStats = async (_req: Request, res: Response<ApiResponse>) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        const [totalCards, todayCards, weekCards, pairedCards, statusCounts] = await Promise.all([
            prisma.physicalCard.count(),
            prisma.physicalCard.count({ where: { createdAt: { gte: today } } }),
            prisma.physicalCard.count({ where: { createdAt: { gte: weekAgo } } }),
            prisma.physicalCard.count({ where: { status: 'paired' } }),
            prisma.physicalCard.groupBy({
                by: ['status'],
                _count: { status: true },
            }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                total: totalCards,
                today: todayCards,
                thisWeek: weekCards,
                paired: pairedCards,
                byStatus: statusCounts.reduce((acc: Record<string, number>, s) => {
                    acc[s.status] = s._count.status;
                    return acc;
                }, {}),
            },
        });
    } catch (error: any) {
        logger.error('Get stats error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la récupération des stats' },
        });
    }
};

/**
 * PATCH /api/operator/cards/:id/status
 * Modifier le statut d'une carte physique
 */
export const updateCardStatus = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;

        const allowedStatuses = ['in_stock', 'reserved', 'lost'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_STATUS', message: `Statut invalide. Valeurs acceptées : ${allowedStatuses.join(', ')}` },
            });
        }

        const card = await prisma.physicalCard.findUnique({ where: { id } });
        if (!card) {
            return res.status(404).json({
                success: false,
                error: { code: 'CARD_NOT_FOUND', message: 'Carte introuvable' },
            });
        }

        // Ne pas permettre de changer le statut d'une carte pairée via cette route
        if (card.status === 'paired' && status !== 'lost') {
            return res.status(400).json({
                success: false,
                error: { code: 'CARD_PAIRED', message: 'Impossible de modifier le statut d\'une carte pairée (sauf déclarer perdue)' },
            });
        }

        const updated = await prisma.physicalCard.update({
            where: { id },
            data: { status },
        });

        logger.info(`Card status updated: ${id} → ${status} by operator ${req.user?.id}`);

        return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
        logger.error('Update card status error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la mise à jour du statut' },
        });
    }
};

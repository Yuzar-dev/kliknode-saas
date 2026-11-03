import { Request, Response } from 'express';
import prisma from '../../config/database';
import logger from '../../utils/logger.util';
import { ApiResponse } from '../../types/express';
import {
    syncAllInventoryFromCardsAndOrders,
    generateRealisticUid,
    DEFAULT_SKU
} from '../../services/stock-sync.service';

/**
 * Normalise un UID au format homogène 14 caractères hexadécimaux majuscules (sans ':')
 */
function normalizeUidFormat(rawUid: string): string {
    return String(rawUid).trim().replace(/:/g, '').toUpperCase();
}

/**
 * POST /api/operator/encode
 * Enregistrer un UID de carte physique (NFC scan unitaire → save UID + sync stock)
 */
export const encodeCard = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { uid, sku, batchTag, warehouse, status } = req.body;

        const cleanUid = uid && String(uid).trim() ? normalizeUidFormat(uid) : generateRealisticUid('04');

        // Vérifier si l'UID existe déjà
        const existing = await prisma.physicalCard.findUnique({ where: { uid: cleanUid } });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: { code: 'UID_EXISTS', message: 'Cette carte (UID) est déjà enregistrée' },
            });
        }

        const targetWh = (warehouse === 'paris' ? 'paris' : 'oujda') as 'paris' | 'oujda';
        const validStatuses = ['in_stock', 'reserved', 'paired', 'lost'];
        const targetStatus = validStatuses.includes(status) ? status : 'in_stock';
        const normalizedSku = (sku || DEFAULT_SKU).trim().toUpperCase();
        const normalizedBatch = batchTag || `LOT-OPERATEUR-${targetWh.toUpperCase()}`;

        const physicalCard = await prisma.physicalCard.create({
            data: {
                uid: cleanUid,
                sku: normalizedSku,
                batchTag: normalizedBatch,
                status: targetStatus as any,
                warehouse: targetWh,
            },
        });

        await syncAllInventoryFromCardsAndOrders();

        logger.info(`Card encoded by operator ${req.user?.id}: UID=${cleanUid}`);

        return res.status(201).json({
            success: true,
            data: physicalCard,
        });
    } catch (error: any) {
        logger.error('Encode card error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de l\'encodage de la carte' },
        });
    }
};

/**
 * POST /api/operator/encode-batch
 * Enregistrer un lot d'UIDs générés depuis l'interface Opérateur + synchroniser l'inventaire
 */
export const encodeBatchCards = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { uids, quantity, prefix, warehouse, status, sku, batchTag } = req.body;

        let rawUids: string[] = Array.isArray(uids) && uids.length > 0 ? uids : [];
        if (rawUids.length === 0 && Number(quantity) > 0) {
            const qty = Math.min(500, Math.max(1, Number(quantity)));
            rawUids = Array.from({ length: qty }, () => generateRealisticUid(prefix || '04'));
        }

        if (rawUids.length === 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_UIDS', message: 'Liste d\'UIDs ou quantité requise' },
            });
        }

        const targetWh = (warehouse === 'paris' ? 'paris' : 'oujda') as 'paris' | 'oujda';
        const validStatuses = ['in_stock', 'reserved', 'paired', 'lost'];
        const targetStatus = validStatuses.includes(status) ? status : 'in_stock';
        const normalizedSku = (sku || DEFAULT_SKU).trim().toUpperCase();
        const dateTag = new Date().toISOString().slice(0, 10);
        const normalizedBatch = batchTag || `OP-BATCH-${dateTag}-${targetWh.toUpperCase()}`;

        const dataToInsert = rawUids
            .map((u: string) => normalizeUidFormat(u))
            .filter(Boolean)
            .map((cleanUid: string) => ({
                uid: cleanUid,
                sku: normalizedSku,
                batchTag: normalizedBatch,
                warehouse: targetWh,
                status: targetStatus as any,
            }));

        const created = await prisma.physicalCard.createMany({
            data: dataToInsert,
            skipDuplicates: true,
        });

        await syncAllInventoryFromCardsAndOrders();

        logger.info(`Batch encoded by operator ${req.user?.id}: ${created.count} cards (${normalizedSku}, ${targetWh})`);

        return res.status(201).json({
            success: true,
            data: {
                createdCount: created.count,
                batchTag: normalizedBatch,
                warehouse: targetWh,
                sku: normalizedSku,
            },
        });
    } catch (error: any) {
        logger.error('Encode batch cards error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de l\'encodage du lot' },
        });
    }
};

/**
 * POST /api/operator/pair
 * Pairer une carte physique à une carte digitale d'un utilisateur/employé
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

        const digitalCard = await prisma.card.findUnique({ where: { id: cardId } });
        if (!digitalCard) {
            return res.status(404).json({
                success: false,
                error: { code: 'DIGITAL_CARD_NOT_FOUND', message: 'Carte digitale introuvable' },
            });
        }

        const updated = await prisma.physicalCard.update({
            where: { uid },
            data: {
                pairedCardId: cardId,
                pairedAt: new Date(),
                pairedByOperatorId: req.user!.id,
                companyId: digitalCard.companyId || physicalCard.companyId,
                status: 'paired',
            },
        });

        await syncAllInventoryFromCardsAndOrders();

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
        // Uniformiser les éventuels anciens UIDs contenant ':' (ex: 04:6A:...) pour que tous les UIDs aient le même format
        const cardsWithColons = await prisma.physicalCard.findMany({
            where: { uid: { contains: ':' } },
            select: { id: true, uid: true }
        });
        for (const c of cardsWithColons) {
            const clean = normalizeUidFormat(c.uid);
            await prisma.physicalCard.update({
                where: { id: c.id },
                data: { uid: clean }
            }).catch(() => {});
        }

        const { status, warehouse, search, page = '1', limit = '200' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const where: any = {};

        if (status && status !== 'all') {
            where.status = status;
        }

        if (warehouse && warehouse !== 'all') {
            where.warehouse = warehouse;
        }

        if (search) {
            where.OR = [
                { uid: { contains: search as string, mode: 'insensitive' } },
                { batchTag: { contains: search as string, mode: 'insensitive' } },
                { sku: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const [cards, total] = await Promise.all([
            prisma.physicalCard.findMany({
                where,
                include: {
                    pairedCard: {
                        select: {
                            id: true,
                            publicSlug: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    company: {
                        select: {
                            id: true,
                            name: true,
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
 * Statistiques opérateur 100% alignées avec Gestion des Stocks (/admin/inventory)
 */
export const getStats = async (_req: Request, res: Response<ApiResponse>) => {
    try {
        await syncAllInventoryFromCardsAndOrders();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        const [
            totalCards,
            todayCards,
            weekCards,
            pairedCards,
            statusCounts,
            warehouseCounts,
            pendingOrdersByCompany,
            assignedCardsByCompany
        ] = await Promise.all([
            prisma.physicalCard.count(),
            prisma.physicalCard.count({ where: { createdAt: { gte: today } } }),
            prisma.physicalCard.count({ where: { createdAt: { gte: weekAgo } } }),
            prisma.physicalCard.count({ where: { status: 'paired' } }),
            prisma.physicalCard.groupBy({
                by: ['status'],
                _count: { status: true },
            }),
            prisma.physicalCard.groupBy({
                by: ['warehouse'],
                _count: { warehouse: true },
            }),
            prisma.hardwareOrder.groupBy({
                by: ['companyId'],
                where: { status: { in: ['pending', 'processing'] } },
                _sum: { quantity: true },
                _count: { id: true }
            }),
            prisma.physicalCard.groupBy({
                by: ['companyId'],
                where: {
                    companyId: { not: null },
                    status: { in: ['reserved', 'paired'] }
                },
                _count: { id: true }
            })
        ]);

        const byStatus = statusCounts.reduce((acc: Record<string, number>, s) => {
            acc[s.status] = s._count.status;
            return acc;
        }, {});

        const byWarehouse = warehouseCounts.reduce((acc: Record<string, number>, w) => {
            acc[w.warehouse] = w._count.warehouse;
            return acc;
        }, {});

        // Calculer combien de cartes commandées restent réellement à attribuer par l'opérateur
        const assignedMap = new Map<string, number>();
        for (const ac of assignedCardsByCompany) {
            if (ac.companyId) assignedMap.set(ac.companyId, ac._count.id);
        }

        let totalOrderedCards = 0;
        let remainingToAssignCards = 0;
        let pendingOrdersCount = 0;

        for (const po of pendingOrdersByCompany) {
            const ordered = po._sum.quantity || 0;
            const assigned = assignedMap.get(po.companyId) || 0;
            totalOrderedCards += ordered;
            pendingOrdersCount += po._count.id || 0;
            remainingToAssignCards += Math.max(0, ordered - assigned);
        }

        const inStock = byStatus['in_stock'] || 0;
        const reserved = byStatus['reserved'] || 0;
        const lost = byStatus['lost'] || 0;

        return res.status(200).json({
            success: true,
            data: {
                total: totalCards,
                inStock,
                reserved,
                paired: pairedCards,
                engagedTotal: reserved + pairedCards + lost, // Strictement égal à "Réservé & Commandes" dans /admin/inventory
                lost,
                today: todayCards,
                thisWeek: weekCards,
                byStatus,
                byWarehouse,
                pendingOrdersCount,
                totalOrderedCards,
                remainingToAssignCards
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
 * Modifier le statut ou l'entrepôt d'une carte physique + synchroniser l'inventaire
 */
export const updateCardStatus = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);
        const { status, warehouse } = req.body;

        const allowedStatuses = ['in_stock', 'reserved', 'paired', 'lost'];
        if (status && !allowedStatuses.includes(status)) {
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

        const updateData: any = {};
        if (status) {
            updateData.status = status;
            if (status === 'in_stock') {
                updateData.companyId = null;
                updateData.pairedCardId = null;
                updateData.pairedAt = null;
            }
        }
        if (warehouse && (warehouse === 'paris' || warehouse === 'oujda')) {
            updateData.warehouse = warehouse;
        }

        const updated = await prisma.physicalCard.update({
            where: { id },
            data: updateData,
        });

        await syncAllInventoryFromCardsAndOrders();

        logger.info(`Card updated: ${id} → status=${updated.status}, wh=${updated.warehouse} by operator ${req.user?.id}`);

        return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
        logger.error('Update card status error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la mise à jour du statut' },
        });
    }
};

/**
 * DELETE /api/operator/cards/:id
 * Supprimer une carte physique + synchroniser l'inventaire
 */
export const deleteCard = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);

        const card = await prisma.physicalCard.findUnique({ where: { id } });
        if (!card) {
            return res.status(404).json({
                success: false,
                error: { code: 'CARD_NOT_FOUND', message: 'Carte introuvable' },
            });
        }

        await prisma.physicalCard.delete({ where: { id } });
        await syncAllInventoryFromCardsAndOrders();

        logger.info(`Card deleted: ${card.uid} by operator ${req.user?.id}`);

        return res.status(200).json({
            success: true,
            data: { id, deleted: true },
        });
    } catch (error: any) {
        logger.error('Delete card error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la suppression de la carte' },
        });
    }
};

/**
 * POST /api/operator/assign-batch
 * Assigner un lot de cartes à une entreprise (B2B) + synchroniser l'inventaire
 */
export const assignBatchToCompany = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { uids, quantity, companyId, warehouse } = req.body;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_COMPANY', message: 'Veuillez sélectionner une entreprise' },
            });
        }

        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return res.status(404).json({
                success: false,
                error: { code: 'COMPANY_NOT_FOUND', message: 'Entreprise introuvable' },
            });
        }

        let targetUids: string[] = Array.isArray(uids)
            ? uids.map((u: string) => normalizeUidFormat(u)).filter(Boolean)
            : [];

        // Si l'opérateur a simplement indiqué un nombre de cartes (ex: 6) sans saisir d'UIDs manuellement,
        // on pioche automatiquement ce nombre de cartes vierges (`in_stock`) dans le stock !
        if (targetUids.length === 0 && Number(quantity) > 0) {
            const qtyToPick = Math.max(1, Number(quantity));
            const availableCards = await prisma.physicalCard.findMany({
                where: {
                    status: 'in_stock',
                    ...(warehouse && warehouse !== 'all' ? { warehouse } : {})
                },
                orderBy: { createdAt: 'desc' },
                take: qtyToPick,
                select: { uid: true }
            });

            if (availableCards.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'NO_STOCK', message: 'Aucune carte vierge disponible en stock' },
                });
            }
            targetUids = availableCards.map(c => c.uid);
        }

        if (targetUids.length === 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_UIDS', message: 'Sélectionnez un nombre de cartes ou entrez des UIDs' },
            });
        }

        const result = await prisma.physicalCard.updateMany({
            where: {
                uid: { in: targetUids },
                status: { in: ['in_stock', 'reserved'] },
            },
            data: {
                status: 'reserved',
                companyId: companyId,
                updatedAt: new Date(),
            },
        });

        await syncAllInventoryFromCardsAndOrders();

        logger.info(`Batch of ${result.count} cards assigned to company ${company.name} by operator ${req.user?.id}`);

        return res.status(200).json({
            success: true,
            data: {
                updatedCount: result.count,
                message: `${result.count} carte(s) réservée(s) et attribuée(s) à ${company.name}`,
            },
        });
    } catch (error: any) {
        logger.error('Assign batch error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de l\'assignation du lot' },
        });
    }
};

/**
 * GET /api/operator/companies
 * Obtenir la liste des entreprises (avec le nombre de cartes commandées et déjà attribuées)
 * + les profils digitaux non pairés
 */
export const getOperatorCompanies = async (_req: Request, res: Response<ApiResponse>) => {
    try {
        const [companies, activeOrders, assignedCounts, digitalCards] = await Promise.all([
            prisma.company.findMany({
                where: { deletedAt: null },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    country: true,
                },
                orderBy: { name: 'asc' },
            }),
            prisma.hardwareOrder.groupBy({
                by: ['companyId'],
                where: { status: { in: ['pending', 'processing'] } },
                _sum: { quantity: true },
            }),
            prisma.physicalCard.groupBy({
                by: ['companyId'],
                where: {
                    companyId: { not: null },
                    status: { in: ['reserved', 'paired'] },
                },
                _count: { id: true },
            }),
            prisma.card.findMany({
                where: {
                    deletedAt: null,
                    physicalCard: { is: null },
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    publicSlug: true,
                    company: {
                        select: { name: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            }),
        ]);

        const orderedMap = new Map<string, number>();
        for (const o of activeOrders) {
            orderedMap.set(o.companyId, o._sum.quantity || 0);
        }

        const assignedMap = new Map<string, number>();
        for (const a of assignedCounts) {
            if (a.companyId) assignedMap.set(a.companyId, a._count.id);
        }

        const enrichedCompanies = companies.map(c => {
            const orderedCards = orderedMap.get(c.id) || 0;
            const assignedCards = assignedMap.get(c.id) || 0;
            const remainingToAssign = Math.max(0, orderedCards - assignedCards);
            return {
                ...c,
                orderedCards,
                assignedCards,
                remainingToAssign,
            };
        });

        return res.status(200).json({
            success: true,
            data: enrichedCompanies,
            digitalCards,
        } as any);
    } catch (error: any) {
        logger.error('Get operator companies error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la récupération des entreprises' },
        });
    }
};

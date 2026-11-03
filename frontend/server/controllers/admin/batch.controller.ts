import { Request, Response } from 'express';
import prisma from '../../config/database';
import { ApiResponse } from '../../types/express';
import logger from '../../utils/logger.util';
import { syncAllInventoryFromCardsAndOrders, generateRealisticUid, DEFAULT_SKU } from '../../services/stock-sync.service';

/**
 * GET /api/admin/batches
 * Get all generated batches (grouped by batchTag and warehouse)
 */
export const getAdminBatches = async (_req: Request, res: Response<ApiResponse>) => {
    try {
        await syncAllInventoryFromCardsAndOrders();

        const batches = await prisma.physicalCard.groupBy({
            by: ['batchTag', 'warehouse', 'sku'],
            _count: {
                id: true
            },
            _min: {
                createdAt: true
            },
            where: {
                batchTag: { not: null }
            },
            orderBy: {
                _min: {
                    createdAt: 'desc'
                }
            }
        });

        // Format for frontend
        const formattedBatches = batches.map((b, index) => ({
            id: index + 1,
            batchTag: b.batchTag,
            sku: b.sku || DEFAULT_SKU,
            count: b._count.id,
            warehouse: b.warehouse,
            createdAt: b._min.createdAt
        }));

        return res.status(200).json({
            success: true,
            data: formattedBatches
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin batches:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération des lots'
            }
        });
    }
};

/**
 * POST /api/admin/batches
 * Create a new batch of physical cards with generated UIDs
 * This creates PhysicalCard records in 'in_stock' status and synchronizes Inventory
 */
export const createAdminBatch = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { quantity, batchTag, warehouse, sku } = req.body;

        if (!quantity || !batchTag || !warehouse) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'BAD_REQUEST',
                    message: 'Quantité, Référence du lot et Entrepôt sont requis'
                }
            });
        }

        const qty = parseInt(quantity as string);
        if (qty <= 0 || qty > 10000) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'BAD_REQUEST',
                    message: 'La quantité doit être comprise entre 1 et 10,000'
                }
            });
        }

        const existing = await prisma.physicalCard.findFirst({
            where: { batchTag }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'BAD_REQUEST',
                    message: 'Cette référence de lot existe déjà'
                }
            });
        }

        const normalizedSku = (sku || DEFAULT_SKU).trim().toUpperCase();
        const targetWh = (warehouse === 'oujda' ? 'oujda' : 'paris') as 'paris' | 'oujda';

        const cardsData: any[] = [];
        for (let i = 0; i < qty; i++) {
            const randomUid = generateRealisticUid('04');
            cardsData.push({
                uid: randomUid,
                sku: normalizedSku,
                batchTag,
                warehouse: targetWh,
                status: 'in_stock' as any
            });
        }

        await prisma.physicalCard.createMany({
            data: cardsData,
            skipDuplicates: true
        });

        await syncAllInventoryFromCardsAndOrders();

        return res.status(201).json({
            success: true,
            data: {
                batchTag,
                quantity: qty,
                warehouse: targetWh,
                sku: normalizedSku
            }
        });
    } catch (error: any) {
        logger.error('Failed to create admin batch:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la génération du lot'
            }
        });
    }
};

/**
 * GET /api/admin/batches/:batchTag/export
 * Export UIDs of a specific batch to CSV
 */
export const exportBatchCsv = async (req: Request, res: Response) => {
    try {
        const batchTag = decodeURIComponent(String(req.params.batchTag));

        const cards = await prisma.physicalCard.findMany({
            where: { batchTag },
            select: { uid: true, sku: true, warehouse: true, status: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
        });

        if (cards.length === 0) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Lot introuvable ou vide' }
            });
        }

        const baseUrl = process.env.PUBLIC_CARD_BASE_URL || 'https://k.kliknode.com';
        const header = 'UID,SKU,Warehouse,Status,ActivationURL,GeneratedAt\n';
        const rows = cards.map(c =>
            `${c.uid},${c.sku || ''},${c.warehouse || ''},${c.status || 'in_stock'},${baseUrl}/${c.uid},${c.createdAt.toISOString()}`
        ).join('\n');
        const csv = header + rows;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="batch-${batchTag}.csv"`);
        return res.status(200).send(csv);
    } catch (error: any) {
        logger.error('Failed to export batch CSV:', error);
        return res.status(500).send('Error generating export');
    }
};

/**
 * DELETE /api/admin/batches/:batchTag
 * Delete an entire batch of physical cards and synchronize Inventory
 */
export const deleteAdminBatch = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const batchTag = decodeURIComponent(String(req.params.batchTag));

        const deleted = await prisma.physicalCard.deleteMany({
            where: { batchTag }
        });

        await syncAllInventoryFromCardsAndOrders();

        return res.status(200).json({
            success: true,
            data: { batchTag, deletedCount: deleted.count }
        });
    } catch (error: any) {
        logger.error('Failed to delete admin batch:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la suppression du lot'
            }
        });
    }
};

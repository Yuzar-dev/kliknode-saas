import { Request, Response } from 'express';
import prisma from '../../config/database';
import { ApiResponse } from '../../types/express';
import logger from '../../utils/logger.util';
import {
    syncAllInventoryFromCardsAndOrders,
    setPhysicalCardsCountForSkuWarehouse
} from '../../services/stock-sync.service';

/**
 * GET /api/admin/inventory
 * Get all inventory items with pagination, search by SKU, and warehouse filter
 */
export const getAdminInventory = async (req: Request, res: Response<ApiResponse>) => {
    try {
        await syncAllInventoryFromCardsAndOrders();

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || '';
        const warehouse = (req.query.warehouse as string) || undefined;
        const skip = (page - 1) * limit;

        const where: any = {
            AND: [
                { sku: { contains: search, mode: 'insensitive' } },
                warehouse ? { warehouse: warehouse as any } : {}
            ]
        };

        const [inventory, total] = await Promise.all([
            prisma.inventory.findMany({
                where,
                orderBy: [{ warehouse: 'asc' }, { sku: 'asc' }],
                skip,
                take: limit
            }),
            prisma.inventory.count({ where })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                inventory,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin inventory:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération de l\'inventaire'
            }
        });
    }
};

/**
 * GET /api/admin/inventory/stats
 * Get inventory statistics (Total SKUs, Low Stock count, Total Value, Total Physical, Reserved, Available)
 */
export const getAdminInventoryStats = async (_req: Request, res: Response<ApiResponse>) => {
    try {
        await syncAllInventoryFromCardsAndOrders();

        const [totalSkus, lowStockItems, inventorySummary] = await Promise.all([
            prisma.inventory.count(),
            prisma.inventory.count({
                where: {
                    quantityAvailable: { lt: 10 }
                }
            }),
            prisma.inventory.aggregate({
                _sum: {
                    quantityPhysical: true,
                    quantityReserved: true,
                    quantityAvailable: true
                }
            })
        ]);

        const totalPhysical = inventorySummary._sum.quantityPhysical || 0;
        const totalReserved = inventorySummary._sum.quantityReserved || 0;
        const totalAvailable = inventorySummary._sum.quantityAvailable || 0;
        const totalValue = totalPhysical * 45;

        return res.status(200).json({
            success: true,
            data: {
                totalSkus,
                lowStockCount: lowStockItems,
                totalValue,
                totalPhysical,
                totalReserved,
                totalAvailable
            }
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin inventory stats:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération des statistiques d\'inventaire'
            }
        });
    }
};

/**
 * POST / PATCH /api/admin/inventory/adjust
 * Manually adjust physical stock quantities or update item SKU / warehouse
 * Automatically synchronizes `physical_cards` and `inventory`
 */
export const adjustStock = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { id, sku, warehouse, quantityPhysical } = req.body;
        const parsedQty = Number(quantityPhysical);

        if (!sku || !warehouse || quantityPhysical === undefined || isNaN(parsedQty) || parsedQty < 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'BAD_REQUEST',
                    message: 'SKU, Entrepôt et Quantité physique valide sont requis'
                }
            });
        }

        const cleanSku = String(sku).trim().toUpperCase();
        const targetWh = (warehouse === 'oujda' ? 'oujda' : 'paris') as 'paris' | 'oujda';

        if (id) {
            const currentItem = await prisma.inventory.findUnique({ where: { id } });
            if (currentItem) {
                const oldSku = currentItem.sku.trim().toUpperCase();
                const oldWh = currentItem.warehouse;

                // Si le SKU ou l'entrepôt a été modifié, migrer d'abord les cartes physiques associées
                if (oldSku !== cleanSku || oldWh !== targetWh) {
                    await prisma.physicalCard.updateMany({
                        where: {
                            sku: oldSku,
                            warehouse: oldWh
                        },
                        data: {
                            sku: cleanSku,
                            warehouse: targetWh
                        }
                    });
                }
            }
        }

        // Ajuste le nombre réel de PhysicalCard pour (cleanSku, targetWh) et synchronise Inventory
        await setPhysicalCardsCountForSkuWarehouse(cleanSku, targetWh, parsedQty);

        const updated = await prisma.inventory.findUnique({
            where: {
                sku_warehouse: { sku: cleanSku, warehouse: targetWh }
            }
        });

        return res.status(200).json({
            success: true,
            data: updated
        });
    } catch (error: any) {
        logger.error('Failed to adjust stock:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de l\'ajustement du stock'
            }
        });
    }
};

/**
 * POST /api/admin/inventory/transfer
 * Transfer stock between warehouses (e.g. Paris <-> Oujda)
 * Moves actual `PhysicalCard` items between warehouses and resyncs `Inventory`
 */
export const transferStock = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { sku, fromWarehouse, toWarehouse, quantity } = req.body;
        const qty = Number(quantity);

        if (!sku || !fromWarehouse || !toWarehouse || !qty || qty <= 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'BAD_REQUEST',
                    message: 'SKU, entrepôt source, entrepôt destination et quantité (> 0) sont requis'
                }
            });
        }

        if (fromWarehouse === toWarehouse) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'BAD_REQUEST',
                    message: 'L\'entrepôt de destination doit être différent de l\'entrepôt source'
                }
            });
        }

        await syncAllInventoryFromCardsAndOrders();

        const cleanSku = String(sku).trim().toUpperCase();
        const fromWh = (fromWarehouse === 'oujda' ? 'oujda' : 'paris') as 'paris' | 'oujda';
        const toWh = (toWarehouse === 'oujda' ? 'oujda' : 'paris') as 'paris' | 'oujda';

        const sourceItem = await prisma.inventory.findUnique({
            where: {
                sku_warehouse: { sku: cleanSku, warehouse: fromWh }
            }
        });

        if (!sourceItem || sourceItem.quantityAvailable < qty) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_STOCK',
                    message: `Stock disponible insuffisant dans l'entrepôt source (${sourceItem?.quantityAvailable || 0} disponible)`
                }
            });
        }

        // Sélectionner `qty` cartes physiques `in_stock` dans l'entrepôt source pour les transférer
        const cardsToMove = await prisma.physicalCard.findMany({
            where: {
                sku: cleanSku,
                warehouse: fromWh,
                status: 'in_stock'
            },
            orderBy: { createdAt: 'desc' },
            take: qty,
            select: { id: true }
        });

        if (cardsToMove.length < qty) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_STOCK',
                    message: `Seulement ${cardsToMove.length} carte(s) vierge(s) transférable(s) trouvée(s)`
                }
            });
        }

        await prisma.physicalCard.updateMany({
            where: {
                id: { in: cardsToMove.map(c => c.id) }
            },
            data: {
                warehouse: toWh,
                updatedAt: new Date()
            }
        });

        await syncAllInventoryFromCardsAndOrders();

        const [updatedSource, updatedDest] = await Promise.all([
            prisma.inventory.findUnique({
                where: { sku_warehouse: { sku: cleanSku, warehouse: fromWh } }
            }),
            prisma.inventory.findUnique({
                where: { sku_warehouse: { sku: cleanSku, warehouse: toWh } }
            })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                source: updatedSource,
                destination: updatedDest,
                transferredCount: cardsToMove.length,
                message: `${cardsToMove.length} carte(s) ${cleanSku} transférée(s) vers ${toWh === 'paris' ? 'Paris Sud' : 'Oujda Port'}`
            }
        });
    } catch (error: any) {
        logger.error('Failed to transfer stock:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors du transfert inter-entrepôts'
            }
        });
    }
};

/**
 * DELETE /api/admin/inventory/:id
 * Delete an inventory entry and its un-paired physical cards
 */
export const deleteInventoryItem = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);
        const item = await prisma.inventory.findUnique({ where: { id } });
        if (!item) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Ligne de stock introuvable' }
            });
        }

        await prisma.physicalCard.deleteMany({
            where: {
                sku: item.sku,
                warehouse: item.warehouse,
                pairedCardId: null
            }
        });

        await prisma.inventory.delete({ where: { id } }).catch(() => {});
        await syncAllInventoryFromCardsAndOrders();

        return res.status(200).json({
            success: true,
            data: { deleted: true }
        });
    } catch (error: any) {
        logger.error('Failed to delete inventory item:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la suppression de la ligne de stock'
            }
        });
    }
};

/**
 * POST /api/admin/inventory/reset
 * Purge complète de tout le stock (physical_cards, inventory, hardware_orders) pour repartir à zéro
 */
export const resetAllInventory = async (_req: Request, res: Response<ApiResponse>) => {
    try {
        const [deletedCards, deletedInventory, deletedOrders] = await prisma.$transaction([
            prisma.physicalCard.deleteMany({}),
            prisma.inventory.deleteMany({}),
            prisma.hardwareOrder.deleteMany({})
        ]);

        return res.status(200).json({
            success: true,
            data: {
                deletedCards: deletedCards.count,
                deletedInventory: deletedInventory.count,
                deletedOrders: deletedOrders.count,
                message: 'Tout le stock et les commandes hardware ont été remis à zéro.'
            }
        });
    } catch (error: any) {
        logger.error('Failed to reset all inventory:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la remise à zéro du stock'
            }
        });
    }
};

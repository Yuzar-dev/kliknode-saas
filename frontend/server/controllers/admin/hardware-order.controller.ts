import { Request, Response } from 'express';
import prisma from '../../config/database';
import { ApiResponse } from '../../types/express';
import logger from '../../utils/logger.util';
import { syncAllInventoryFromCardsAndOrders } from '../../services/stock-sync.service';

/**
 * GET /api/admin/hardware-orders
 * Get all hardware orders with pagination, search, and status filter
 */
export const getAdminHardwareOrders = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || '';
        const status = (req.query.status as string) || undefined;
        const skip = (page - 1) * limit;

        const where: any = {
            AND: [
                {
                    OR: [
                        { orderNumber: { contains: search, mode: 'insensitive' } },
                        { company: { name: { contains: search, mode: 'insensitive' } } }
                    ]
                },
                status ? { status: status as any } : {}
            ]
        };

        const [orders, total] = await Promise.all([
            prisma.hardwareOrder.findMany({
                where,
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                            adminEmail: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.hardwareOrder.count({ where })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                orders,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin hardware orders:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération des commandes hardware'
            }
        });
    }
};

/**
 * GET /api/admin/hardware-orders/stats
 * Get hardware order statistics (Pending, In Transit, Delivered this month + total cards per status)
 */
export const getAdminHardwareOrderStats = async (_req: Request, res: Response<ApiResponse>) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            pendingAgg,
            inTransitAgg,
            deliveredMonthAgg
        ] = await Promise.all([
            prisma.hardwareOrder.aggregate({
                where: { status: { in: ['pending', 'processing'] } },
                _count: { id: true },
                _sum: { quantity: true }
            }),
            prisma.hardwareOrder.aggregate({
                where: { status: 'shipped' },
                _count: { id: true },
                _sum: { quantity: true }
            }),
            prisma.hardwareOrder.aggregate({
                where: {
                    status: 'delivered',
                    OR: [
                        { deliveredAt: { gte: startOfMonth } },
                        { updatedAt: { gte: startOfMonth } }
                    ]
                },
                _count: { id: true },
                _sum: { quantity: true }
            })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                pending: pendingAgg._count.id || 0,
                pendingCards: pendingAgg._sum.quantity || 0,
                inTransit: inTransitAgg._count.id || 0,
                inTransitCards: inTransitAgg._sum.quantity || 0,
                deliveredMonth: deliveredMonthAgg._count.id || 0,
                deliveredMonthCards: deliveredMonthAgg._sum.quantity || 0
            }
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin hardware order stats:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération des statistiques de commandes'
            }
        });
    }
};

/**
 * PATCH /api/admin/hardware-orders/:id
 * Update hardware order status and tracking details + synchronize Inventory
 */
export const updateAdminHardwareOrder = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);
        const { status, trackingNumber, warehouse } = req.body;

        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
        if (warehouse !== undefined) updateData.warehouse = warehouse;

        if (status === 'shipped') {
            updateData.shippedAt = new Date();
        } else if (status === 'delivered') {
            updateData.deliveredAt = new Date();
        }

        const updated = await prisma.hardwareOrder.update({
            where: { id },
            data: updateData
        });

        await syncAllInventoryFromCardsAndOrders();

        return res.status(200).json({
            success: true,
            data: updated
        });
    } catch (error: any) {
        logger.error('Failed to update admin hardware order:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la mise à jour de la commande'
            }
        });
    }
};

/**
 * POST /api/admin/hardware-orders
 * Manually create a new hardware order + reserve stock in Inventory
 */
export const createAdminHardwareOrder = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { companyId, quantity, warehouse, shippingAddress } = req.body;

        if (!companyId || !quantity || !warehouse || !shippingAddress) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'BAD_REQUEST',
                    message: 'Tous les champs sont requis'
                }
            });
        }

        const orderCount = await prisma.hardwareOrder.count();
        const orderNumber = `ORD-${new Date().getFullYear()}-${(orderCount + 1).toString().padStart(3, '0')}-${Math.floor(100 + Math.random() * 900)}`;

        const order = await prisma.hardwareOrder.create({
            data: {
                companyId,
                orderNumber,
                quantity: parseInt(quantity),
                warehouse: warehouse as any,
                shippingAddress,
                status: 'pending'
            }
        });

        await syncAllInventoryFromCardsAndOrders();

        return res.status(201).json({
            success: true,
            data: order
        });
    } catch (error: any) {
        logger.error('Failed to create admin hardware order:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la création de la commande'
            }
        });
    }
};

/**
 * DELETE /api/admin/hardware-orders/:id
 * Delete a hardware order + release reserved stock in Inventory
 */
export const deleteAdminHardwareOrder = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);

        await prisma.hardwareOrder.delete({
            where: { id }
        });

        await syncAllInventoryFromCardsAndOrders();

        return res.status(200).json({
            success: true,
            data: { id, deleted: true }
        });
    } catch (error: any) {
        logger.error('Failed to delete admin hardware order:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la suppression de la commande'
            }
        });
    }
};

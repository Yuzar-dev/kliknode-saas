import { Request, Response } from 'express';
import prisma from '../../config/database';
import { ApiResponse } from '../../types/express';
import logger from '../../utils/logger.util';

/**
 * GET /api/admin/promo-codes
 * Get all promo codes with pagination and search
 */
export const getAdminPromoCodes = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || '';
        const skip = (page - 1) * limit;

        const where: any = {
            OR: [
                { code: { contains: search, mode: 'insensitive' } }
            ]
        };

        const [promoCodes, total] = await Promise.all([
            prisma.promoCode.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.promoCode.count({ where })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                promoCodes,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin promo codes:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération des codes promo'
            }
        });
    }
};

/**
 * POST /api/admin/promo-codes
 * Create a new promo code
 */
export const createAdminPromoCode = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { code, discountPercent, discountAmountEur, discountAmountMad, maxUses, validFrom, validUntil, isActive } = req.body;

        const promoCode = await prisma.promoCode.create({
            data: {
                code: code.toUpperCase(),
                discountPercent,
                discountAmountEur,
                discountAmountMad,
                maxUses,
                validFrom: new Date(validFrom),
                validUntil: new Date(validUntil),
                isActive: isActive ?? true
            }
        });

        return res.status(201).json({
            success: true,
            data: promoCode
        });
    } catch (error: any) {
        logger.error('Failed to create admin promo code:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la création du code promo'
            }
        });
    }
};

/**
 * PATCH /api/admin/promo-codes/:id
 * Update an existing promo code
 */
export const updateAdminPromoCode = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);
        const updates = { ...req.body };

        if (updates.validFrom) updates.validFrom = new Date(updates.validFrom);
        if (updates.validUntil) updates.validUntil = new Date(updates.validUntil);
        if (updates.code) updates.code = updates.code.toUpperCase();

        const promoCode = await prisma.promoCode.update({
            where: { id },
            data: updates
        });

        return res.status(200).json({
            success: true,
            data: promoCode
        });
    } catch (error: any) {
        logger.error('Failed to update admin promo code:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la mise à jour du code promo'
            }
        });
    }
};

/**
 * DELETE /api/admin/promo-codes/:id
 * Delete a promo code
 */
export const deleteAdminPromoCode = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);

        await prisma.promoCode.delete({
            where: { id }
        });

        return res.status(200).json({
            success: true,
            data: { message: 'Code promo supprimé avec succès' }
        });
    } catch (error: any) {
        logger.error('Failed to delete admin promo code:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la suppression du code promo'
            }
        });
    }
};

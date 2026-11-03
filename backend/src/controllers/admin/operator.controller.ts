import { Request, Response } from 'express';
import prisma, { syncUserToSupabaseAuth } from '../../config/database';
import { ApiResponse } from '../../types/express';
import logger from '../../utils/logger.util';
import bcrypt from 'bcryptjs';

/**
 * GET /api/admin/operators
 * List all users with role 'OPERATOR'
 */
export const getAdminOperators = async (_req: Request, res: Response<ApiResponse>) => {
    try {
        const operators = await prisma.user.findMany({
            where: {
                role: 'OPERATOR',
                deletedAt: null
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                warehouse: true as any,
                lastLoginAt: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            success: true,
            data: operators
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin operators:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération des opérateurs'
            }
        });
    }
};

/**
 * GET /api/admin/operators/stats
 * Get operator statistics
 */
export const getAdminOperatorStats = async (_req: Request, res: Response<ApiResponse>) => {
    try {
        const [totalCount, activeWarehouses] = await Promise.all([
            prisma.user.count({
                where: { role: 'OPERATOR', deletedAt: null }
            }),
            prisma.user.groupBy({
                by: ['warehouse' as any],
                where: {
                    role: 'OPERATOR',
                    isActive: true,
                    warehouse: { not: null } as any,
                    deletedAt: null
                },
                _count: { warehouse: true } as any
            })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                total: totalCount,
                activeWarehouses: activeWarehouses.length,
                // Placeholder for dynamic login stats if needed
                logins24h: 0
            }
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin operator stats:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération des statistiques'
            }
        });
    }
};

/**
 * POST /api/admin/operators
 * Create a new operator account
 */
export const createAdminOperator = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { email, password, firstName, lastName, warehouse } = req.body;

        if (!email || !password || !warehouse) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'BAD_REQUEST',
                    message: 'Email, mot de passe et entrepôt sont requis'
                }
            });
        }

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'USER_EXISTS',
                    message: 'Cet email est déjà utilisé'
                }
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                role: 'OPERATOR',
                warehouse: warehouse as any,
                isActive: true
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                warehouse: true as any,
                createdAt: true
            }
        });

        await syncUserToSupabaseAuth({
            id: newUser.id,
            email: newUser.email,
            passwordHash,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: 'OPERATOR',
        });

        return res.status(201).json({
            success: true,
            data: newUser
        });
    } catch (error: any) {
        logger.error('Failed to create admin operator:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la création du compte'
            }
        });
    }
};

/**
 * PATCH /api/admin/operators/:id/revoke
 * Deactivate or revoke access for an operator
 */
export const revokeAdminOperator = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);
        const { isActive } = req.body; // Can be used to toggle

        const updated = await prisma.user.update({
            where: { id },
            data: {
                isActive: isActive !== undefined ? isActive : false
            },
            select: {
                id: true,
                email: true,
                isActive: true
            }
        });

        return res.status(200).json({
            success: true,
            data: updated
        });
    } catch (error: any) {
        logger.error('Failed to revoke admin operator access:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la modification des accès'
            }
        });
    }
};

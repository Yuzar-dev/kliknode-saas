import { Request, Response } from 'express';
import prisma from '../../config/database';
import { ApiResponse } from '../../types/express';
import logger from '../../utils/logger.util';

/**
 * GET /api/admin/stats
 * Get high-level platform statistics for the Super Admin dashboard
 */
export const getAdminStats = async (_req: Request, res: Response<ApiResponse>) => {
    try {
        // Run aggregations in parallel
        const [totalUsers, activeCards, totalCompanies] = await Promise.all([
            prisma.user.count(),
            prisma.card.count({
                where: { deletedAt: null }
            }),
            prisma.company.count({
                where: { status: 'active', deletedAt: null }
            })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeCards,
                totalCompanies
            }
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin stats:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération des statistiques'
            }
        });
    }
};

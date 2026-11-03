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
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Run aggregations in parallel
        const [
            totalUsers, 
            activeCards, 
            totalCompanies,
            transactions,
            hardwareOrders,
            recentLogs
        ] = await Promise.all([
            prisma.user.count(),
            prisma.card.count({
                where: { deletedAt: null }
            }),
            prisma.company.count({
                where: { status: 'active', deletedAt: null }
            }),
            prisma.transaction.findMany({
                where: { 
                    status: 'succeeded',
                    createdAt: { gte: thirtyDaysAgo }
                },
                select: { amount: true, currency: true }
            }),
            prisma.hardwareOrder.count({
                where: { status: 'pending' }
            }),
            prisma.auditLog.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { firstName: true, lastName: true } } }
            })
        ]);

        // Calculate approximate MRR in EUR
        let mrrEur = 0;
        transactions.forEach(t => {
            const amount = Number(t.amount);
            if (t.currency === 'EUR') {
                mrrEur += amount;
            } else if (t.currency === 'MAD') {
                mrrEur += amount / 11; // Approx conversion rate
            }
        });

        // Format recent activities
        const recentActivities = recentLogs.map(log => {
            let icon = 'info';
            let iconBg = 'bg-slate-100 text-slate-600';
            
            if (log.action.includes('CREATE')) {
                icon = 'add_circle';
                iconBg = 'bg-blue-100 text-blue-600';
            } else if (log.action.includes('DELETE')) {
                icon = 'delete';
                iconBg = 'bg-rose-100 text-rose-600';
            } else if (log.action.includes('UPDATE')) {
                icon = 'edit';
                iconBg = 'bg-emerald-100 text-emerald-600';
            }

            return {
                icon,
                iconBg,
                title: log.action,
                description: `Par ${log.user?.firstName || ''} ${log.user?.lastName || ''}`,
                time: log.createdAt.toISOString()
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeCards,
                totalCompanies,
                mrrEur: Math.round(mrrEur),
                hardwareOrdersPending: hardwareOrders,
                recentActivities
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

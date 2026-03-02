import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Récupère les détails de l'abonnement de l'entreprise
 */
export const getSubscription = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        if (!companyId) {
            res.status(400).json({
                success: false,
                error: 'Company ID missing from user context'
            });
            return;
        }

        const subscription = await prisma.subscription.findUnique({
            where: { companyId },
            include: {
                plan: true
            }
        });

        if (!subscription) {
            res.status(404).json({
                success: false,
                error: 'Subscription not found for this company'
            });
            return;
        }

        res.json({
            success: true,
            data: subscription
        });
        return;

    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
        return;
    }
};

/**
 * Récupère l'historique des factures/transactions
 */
export const getInvoices = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        if (!companyId) {
            res.status(400).json({
                success: false,
                error: 'Company ID missing from user context'
            });
            return;
        }

        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where: { companyId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma.transaction.count({
                where: { companyId }
            }),
        ]);

        res.json({
            success: true,
            data: transactions,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            }
        });
        return;

    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
        return;
    }
};

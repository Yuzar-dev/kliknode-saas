import prisma from '../../config/database';
import { Request, Response } from 'express';
import { resolvePlanAudience } from '../admin/plan.controller';

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

        const [subscription, usedLicenses, allActivePlans, upgradeLogs] = await Promise.all([
            prisma.subscription.findUnique({
                where: { companyId },
                include: {
                    plan: true
                }
            }),
            prisma.user.count({
                where: { companyId, deletedAt: null, isActive: true }
            }),
            prisma.subscriptionPlan.findMany({
                where: { isActive: true },
                orderBy: { priceEur: 'asc' }
            }),
            prisma.auditLog.findMany({
                where: {
                    entityType: 'company',
                    entityId: companyId,
                    action: 'EMPLOYEE_UPGRADE_REQUEST',
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }).catch(() => []),
        ]);

        // Ne proposer dans l'interface Entreprise (B2B) que les plans B2B (ou le plan actuellement actif de l'entreprise)
        const plans = allActivePlans.filter(
            (p) => resolvePlanAudience(p) === 'B2B' || p.id === subscription?.planId
        );

        const upgradeRequests = upgradeLogs.map((log: any) => ({
            id: log.id,
            createdAt: log.createdAt,
            ...(log.changes && typeof log.changes === 'object' ? log.changes : {}),
        }));

        if (!subscription) {
            res.json({
                success: true,
                data: null,
                usedLicenses,
                plans,
                upgradeRequests,
            });
            return;
        }

        res.json({
            success: true,
            data: {
                ...subscription,
                usedLicenses
            },
            usedLicenses,
            plans,
            upgradeRequests,
        });
        return;

    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
        return;
    }
};


export const updateSubscription = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { planId, paymentMethod } = req.body;

        if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID missing' });
            return;
        }

        const existing = await prisma.subscription.findUnique({
            where: { companyId }
        });

        if (!existing) {
            if (!planId) {
                res.status(400).json({ success: false, error: 'Plan requis' });
                return;
            }
            const now = new Date();
            const nextMonth = new Date(now);
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            const created = await prisma.subscription.create({
                data: {
                    companyId,
                    planId,
                    status: 'active',
                    currentPeriodStart: now,
                    currentPeriodEnd: nextMonth,
                    paymentMethod: paymentMethod || 'stripe'
                },
                include: { plan: true }
            });

            const grantsPro = Boolean(
                created.plan &&
                Number(created.plan.priceEur) > 0 &&
                String(created.plan.slug || '').toLowerCase() !== 'free' &&
                String(created.plan.name || '').toLowerCase() !== 'free'
            );
            await prisma.user.updateMany({
                where: { companyId, role: 'USER' },
                data: { isPro: grantsPro },
            }).catch(() => {});

            if (grantsPro) {
                await prisma.auditLog.deleteMany({
                    where: { entityType: 'company', entityId: companyId, action: 'EMPLOYEE_UPGRADE_REQUEST' },
                }).catch(() => {});
            }

            res.json({
                success: true,
                data: created,
                message: 'Abonnement activé avec succès'
            });
            return;
        }

        const updated = await prisma.subscription.update({
            where: { companyId },
            data: {
                ...(planId ? { planId } : {}),
                ...(paymentMethod ? { paymentMethod } : {}),
            },
            include: { plan: true }
        });

        const grantsPro = Boolean(
            updated.plan &&
            Number(updated.plan.priceEur) > 0 &&
            String(updated.plan.slug || '').toLowerCase() !== 'free' &&
            String(updated.plan.name || '').toLowerCase() !== 'free'
        );
        await prisma.user.updateMany({
            where: { companyId, role: 'USER' },
            data: { isPro: grantsPro },
        }).catch(() => {});

        if (grantsPro) {
            await prisma.auditLog.deleteMany({
                where: { entityType: 'company', entityId: companyId, action: 'EMPLOYEE_UPGRADE_REQUEST' },
            }).catch(() => {});
        }

        res.json({
            success: true,
            data: updated,
            message: 'Abonnement mis à jour avec succès'
        });
        return;
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de l\'abonnement' });
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

import { Request, Response } from 'express';
import prisma from '../../config/database';
import { ApiResponse } from '../../types/express';
import logger from '../../utils/logger.util';

/**
 * Helper to infer or read targetAudience ('B2B' | 'B2C') from a SubscriptionPlan
 */
export const resolvePlanAudience = (plan: any): 'B2B' | 'B2C' => {
    const feat = (plan.features && typeof plan.features === 'object') ? (plan.features as any) : {};
    if (feat.targetAudience === 'B2C' || feat.targetAudience === 'B2B') {
        return feat.targetAudience;
    }
    if (
        plan.maxLicenses === 1 ||
        plan.slug === 'free' ||
        plan.slug?.toLowerCase().includes('b2c') ||
        plan.slug?.toLowerCase().includes('solo') ||
        plan.slug?.toLowerCase().includes('individuel')
    ) {
        return 'B2C';
    }
    return 'B2B';
};

/**
 * GET /api/admin/plans
 * Get all subscription plans (B2B & B2C), B2B company subscriptions, and B2C user subscriptions
 */
export const getAdminPlans = async (_req: Request, res: Response<ApiResponse>) => {
    try {
        let rawPlans = await prisma.subscriptionPlan.findMany({
            include: {
                _count: {
                    select: { subscriptions: true }
                }
            },
            orderBy: { priceEur: 'asc' }
        });

        // Auto-seed a default B2C PRO plan if none exists yet so B2C offers are immediately available
        const hasPaidB2C = rawPlans.some(p => resolvePlanAudience(p) === 'B2C' && Number(p.priceEur) > 0);
        if (!hasPaidB2C) {
            await prisma.subscriptionPlan.create({
                data: {
                    name: 'KlikNode PRO (Individuel)',
                    slug: 'pro-b2c',
                    priceEur: 9.99,
                    priceMad: 99,
                    billingPeriod: 'monthly',
                    maxLicenses: 1,
                    isActive: true,
                    features: {
                        targetAudience: 'B2C',
                        grantsPro: true,
                        lead_gen: true,
                        analytics: true,
                        wallet_pass: true,
                        custom_branding: true,
                        priority_support: true,
                        description: 'Débloque le CRM Prospect intelligent, les Analytics avancés et Apple/Google Wallet.'
                    }
                }
            });
            rawPlans = await prisma.subscriptionPlan.findMany({
                include: {
                    _count: {
                        select: { subscriptions: true }
                    }
                },
                orderBy: { priceEur: 'asc' }
            });
        }

        const [companies, b2cUsers] = await Promise.all([
            prisma.company.findMany({
                where: { deletedAt: null },
                include: {
                    subscription: {
                        include: { plan: true }
                    },
                    _count: {
                        select: { users: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.findMany({
                where: {
                    deletedAt: null,
                    role: { in: ['USER', 'EMPLOYEE'] }
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isPro: true,
                    isActive: true,
                    createdAt: true,
                    company: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const proUsersCount = b2cUsers.filter(u => u.isPro).length;
        const freeUsersCount = b2cUsers.filter(u => !u.isPro).length;

        const plans = rawPlans.map(plan => {
            const targetAudience = resolvePlanAudience(plan);
            const feat = (plan.features && typeof plan.features === 'object') ? (plan.features as any) : {};
            const isPaidB2C = targetAudience === 'B2C' && (Number(plan.priceEur) > 0 || feat.grantsPro === true);
            const subscriberCount = targetAudience === 'B2B'
                ? plan._count.subscriptions
                : (isPaidB2C ? proUsersCount : freeUsersCount);

            return {
                ...plan,
                targetAudience,
                subscriberCount,
                features: {
                    ...feat,
                    targetAudience,
                    grantsPro: targetAudience === 'B2C' ? isPaidB2C : true
                }
            };
        });

        // Calculate stats across B2B + B2C
        const activeB2BSubs = companies.filter(c => c.subscription && c.subscription.status === 'active');
        let totalRevenueEur = 0;
        activeB2BSubs.forEach(c => {
            if (c.subscription?.plan) {
                totalRevenueEur += Number(c.subscription.plan.priceEur);
            }
        });

        const defaultProB2CPlan = plans.find(p => p.targetAudience === 'B2C' && Number(p.priceEur) > 0);
        const b2cProPriceEur = defaultProB2CPlan ? Number(defaultProB2CPlan.priceEur) : 9.99;
        totalRevenueEur += proUsersCount * b2cProPriceEur;

        const totalSubscribers = activeB2BSubs.length + proUsersCount;
        const averageRevenueEur = totalSubscribers > 0 ? (totalRevenueEur / totalSubscribers) : 0;

        return res.status(200).json({
            success: true,
            data: {
                plans,
                companies: companies.map(c => ({
                    id: c.id,
                    name: c.name,
                    adminEmail: c.adminEmail,
                    status: c.status,
                    usersCount: c._count.users,
                    subscription: c.subscription ? {
                        id: c.subscription.id,
                        planId: c.subscription.planId,
                        planName: c.subscription.plan?.name || 'Inconnu',
                        priceEur: c.subscription.plan?.priceEur || 0,
                        maxLicenses: c.subscription.plan?.maxLicenses || 0,
                        status: c.subscription.status,
                        paymentMethod: c.subscription.paymentMethod,
                        currentPeriodEnd: c.subscription.currentPeriodEnd
                    } : null
                })),
                b2cUsers: b2cUsers.map(u => {
                    const activePlan = u.isPro
                        ? (defaultProB2CPlan || plans.find(p => p.targetAudience === 'B2C'))
                        : plans.find(p => p.targetAudience === 'B2C' && Number(p.priceEur) === 0);
                    return {
                        ...u,
                        planId: activePlan?.id || null,
                        planName: activePlan?.name || (u.isPro ? 'KlikNode PRO' : 'Standard Gratuit')
                    };
                }),
                stats: {
                    totalSubscribers,
                    b2bSubscribers: activeB2BSubs.length,
                    b2cProSubscribers: proUsersCount,
                    totalRevenueEur: totalRevenueEur.toFixed(2),
                    averageRevenueEur: averageRevenueEur.toFixed(2)
                }
            }
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin plans:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération des plans'
            }
        });
    }
};

/**
 * POST /api/admin/plans
 * Create a new subscription plan (B2B or B2C)
 */
export const createAdminPlan = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { name, slug, priceEur, priceMad, billingPeriod, maxLicenses, features, isActive, targetAudience } = req.body;

        const audience: 'B2B' | 'B2C' = targetAudience === 'B2C' || features?.targetAudience === 'B2C' ? 'B2C' : 'B2B';
        const numericEur = Number(priceEur) || 0;
        const numericMad = Number(priceMad) || 0;
        const licenses = audience === 'B2C' ? 1 : (parseInt(maxLicenses as any, 10) || 10);

        const mergedFeatures = {
            ...(features && typeof features === 'object' ? features : {}),
            targetAudience: audience,
            grantsPro: audience === 'B2C' ? (features?.grantsPro ?? numericEur > 0) : true
        };

        const plan = await prisma.subscriptionPlan.create({
            data: {
                name,
                slug: (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim(),
                priceEur: numericEur,
                priceMad: numericMad,
                billingPeriod: billingPeriod || 'monthly',
                maxLicenses: licenses,
                features: mergedFeatures,
                isActive: isActive ?? true
            }
        });

        return res.status(201).json({
            success: true,
            data: plan
        });
    } catch (error: any) {
        logger.error('Failed to create admin plan:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la création du plan'
            }
        });
    }
};

/**
 * PATCH /api/admin/plans/:id
 * Update an existing subscription plan
 */
export const updateAdminPlan = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);
        const { name, slug, priceEur, priceMad, billingPeriod, maxLicenses, features, isActive, targetAudience } = req.body;

        const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Plan introuvable' }
            });
        }

        const existingFeatures = (existing.features && typeof existing.features === 'object') ? (existing.features as any) : {};
        const audience: 'B2B' | 'B2C' =
            targetAudience ||
            features?.targetAudience ||
            existingFeatures.targetAudience ||
            resolvePlanAudience(existing);

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (slug !== undefined) updateData.slug = slug;
        if (priceEur !== undefined) updateData.priceEur = Number(priceEur);
        if (priceMad !== undefined) updateData.priceMad = Number(priceMad);
        if (billingPeriod !== undefined) updateData.billingPeriod = billingPeriod;
        if (maxLicenses !== undefined) updateData.maxLicenses = audience === 'B2C' ? 1 : (parseInt(maxLicenses as any, 10) || 1);
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);

        if (features !== undefined || targetAudience !== undefined) {
            const finalEur = priceEur !== undefined ? Number(priceEur) : Number(existing.priceEur);
            updateData.features = {
                ...existingFeatures,
                ...(features && typeof features === 'object' ? features : {}),
                targetAudience: audience,
                grantsPro: audience === 'B2C'
                    ? (features?.grantsPro !== undefined ? Boolean(features.grantsPro) : finalEur > 0)
                    : true
            };
        }

        const plan = await prisma.subscriptionPlan.update({
            where: { id },
            data: updateData
        });

        return res.status(200).json({
            success: true,
            data: plan
        });
    } catch (error: any) {
        logger.error('Failed to update admin plan:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la mise à jour du plan'
            }
        });
    }
};

/**
 * DELETE /api/admin/plans/:id
 * Deactivate or delete a subscription plan
 */
export const deleteAdminPlan = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);

        const subsCount = await prisma.subscription.count({
            where: { planId: id }
        });

        if (subsCount > 0) {
            const plan = await prisma.subscriptionPlan.update({
                where: { id },
                data: { isActive: false }
            });

            return res.status(200).json({
                success: true,
                data: { message: 'Plan désactivé avec succès car des abonnements y sont liés', plan }
            });
        }

        const plan = await prisma.subscriptionPlan.delete({
            where: { id }
        });

        return res.status(200).json({
            success: true,
            data: { message: 'Plan supprimé définitivement', plan }
        });
    } catch (error: any) {
        logger.error('Failed to deactivate admin plan:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la désactivation du plan'
            }
        });
    }
};

/**
 * POST /api/admin/plans/assign-company
 * Assign or update a B2B subscription plan for a company
 */
export const assignCompanyPlan = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { companyId, planId, status } = req.body;

        if (!companyId || !planId) {
            return res.status(400).json({
                success: false,
                error: { code: 'BAD_REQUEST', message: 'companyId et planId sont requis' }
            });
        }

        const existing = await prisma.subscription.findUnique({
            where: { companyId }
        });

        const now = new Date();
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        let subscription;
        if (existing) {
            subscription = await prisma.subscription.update({
                where: { companyId },
                data: {
                    planId,
                    status: (status as any) || existing.status || 'active'
                },
                include: { plan: true }
            });
        } else {
            subscription = await prisma.subscription.create({
                data: {
                    companyId,
                    planId,
                    status: (status as any) || 'active',
                    currentPeriodStart: now,
                    currentPeriodEnd: nextMonth,
                    paymentMethod: 'manual_transfer'
                },
                include: { plan: true }
            });
        }

        return res.status(200).json({
            success: true,
            data: subscription
        });
    } catch (error: any) {
        logger.error('Failed to assign company plan:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de l\'attribution du plan B2B' }
        });
    }
};

/**
 * POST /api/admin/plans/assign-user
 * Assign a B2C subscription plan (or toggle PRO status) for an individual user
 */
export const assignUserB2CPlan = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { userId, planId, isPro } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: { code: 'BAD_REQUEST', message: 'userId est requis' }
            });
        }

        let targetIsPro = Boolean(isPro);

        if (planId) {
            const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
            if (plan) {
                const feat = (plan.features && typeof plan.features === 'object') ? (plan.features as any) : {};
                targetIsPro = feat.grantsPro !== undefined ? Boolean(feat.grantsPro) : Number(plan.priceEur) > 0;
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isPro: targetIsPro },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isPro: true
            }
        });

        return res.status(200).json({
            success: true,
            data: updatedUser
        });
    } catch (error: any) {
        logger.error('Failed to assign user B2C plan:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la mise à jour de l\'abonnement B2C' }
        });
    }
};


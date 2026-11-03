import { Request, Response } from 'express';
import prisma from '../../config/database';
import { ApiResponse } from '../../types/express';
import logger from '../../utils/logger.util';

/**
 * GET /api/admin/transactions
 * Get list of all transactions with pagination and filters
 */
export const getAdminTransactions = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || '';
        const status = req.query.status as string;
        const sort = (req.query.sort as string) === 'asc' ? 'asc' : 'desc';
        const skip = (page - 1) * limit;

        const where: any = {
            OR: [
                { id: { contains: search, mode: 'insensitive' } },
                { company: { name: { contains: search, mode: 'insensitive' } } },
                { invoiceNumber: { contains: search, mode: 'insensitive' } }
            ]
        };

        if (status && status !== 'all') {
            where.status = status;
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    company: {
                        select: {
                            name: true,
                            subscription: {
                                include: {
                                    plan: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: sort },
                skip,
                take: limit
            }),
            prisma.transaction.count({ where })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                transactions,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin transactions:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération des transactions'
            }
        });
    }
};

/**
 * GET /api/admin/transactions/stats
 * Get transaction summary statistics
 */
export const getAdminTransactionStats = async (_req: Request, res: Response<ApiResponse>) => {
    try {
        // En production, on ferait des agrégations plus poussées
        const [totalRevenue, pendingCount, failedCount] = await Promise.all([
            prisma.transaction.aggregate({
                where: { status: 'succeeded' },
                _sum: { amount: true }
            }),
            prisma.transaction.count({
                where: { status: 'pending' }
            }),
            prisma.transaction.aggregate({
                where: { status: 'failed' },
                _sum: { amount: true },
                _count: true
            })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalRevenue: totalRevenue._sum.amount || 0,
                pendingCount,
                failedAmount: failedCount._sum.amount || 0,
                failedCount: failedCount._count || 0
            }
        });
    } catch (error: any) {
        logger.error('Failed to fetch transaction stats:', error);
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
 * POST /api/admin/transactions/invoice
 * Create a manual invoice (transaction) and optionally generate a Stripe Payment Link
 */
export const createManualInvoice = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { companyId, amount, currency, notes, paymentMethod } = req.body;

        if (!companyId || !amount || !currency) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Champs requis manquants (companyId, amount, currency)'
                }
            });
        }

        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Entreprise introuvable' }
            });
        }

        const invoiceNumber = `INV-M-${Date.now().toString().slice(-6)}`;
        const chosenMethod = paymentMethod === 'stripe' ? 'stripe' : 'manual_transfer';

        let paymentUrl: string | null = null;
        let stripeSessionId: string | null = null;

        if (chosenMethod === 'stripe') {
            const { createStripeCheckoutLink } = await import('../../services/stripe.service');
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            const checkout = await createStripeCheckoutLink({
                amount: parseFloat(amount),
                currency: currency as 'EUR' | 'MAD',
                customerEmail: company.adminEmail,
                title: `Facture KlikNode ${invoiceNumber} — ${company.name}`,
                description: notes || `Commande & Abonnement KlikNode Pro (${company.name})`,
                metadata: {
                    companyId: company.id,
                    invoiceNumber,
                },
                successUrl: `${frontendUrl}/company/billing?payment=success&invoice=${invoiceNumber}`,
                cancelUrl: `${frontendUrl}/company/billing?payment=cancelled`,
            });
            paymentUrl = checkout.url;
            stripeSessionId = checkout.sessionId;
        }

        const transaction = await prisma.transaction.create({
            data: {
                companyId,
                amount: parseFloat(amount),
                currency,
                status: 'pending',
                paymentMethod: chosenMethod as any,
                stripePaymentIntentId: stripeSessionId,
                invoicePdfUrl: paymentUrl,
                invoiceNumber,
                notes
            }
        });

        return res.status(201).json({
            success: true,
            data: {
                ...transaction,
                paymentUrl
            }
        });
    } catch (error: any) {
        logger.error('Failed to create manual invoice:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message || 'Erreur lors de la création de la facture'
            }
        });
    }
};

/**
 * GET /api/admin/transactions/stripe-config
 */
export const getAdminStripeConfig = async (_req: Request, res: Response<ApiResponse>) => {
    try {
        const { getStripeConfig } = await import('../../services/stripe.service');
        return res.status(200).json({
            success: true,
            data: getStripeConfig()
        });
    } catch (error: any) {
        logger.error('Get Stripe config error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la lecture de la configuration Stripe' }
        });
    }
};

/**
 * POST /api/admin/transactions/stripe-config
 */
export const saveAdminStripeConfig = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { secretKey, publishableKey, webhookSecret } = req.body;
        const { saveStripeConfig } = await import('../../services/stripe.service');
        const updated = saveStripeConfig({ secretKey, publishableKey, webhookSecret });
        return res.status(200).json({
            success: true,
            data: updated
        });
    } catch (error: any) {
        logger.error('Save Stripe config error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la sauvegarde des clés Stripe' }
        });
    }
};

/**
 * POST /api/admin/transactions/:id/payment-link
 * Génère ou régénère un lien de paiement Stripe Checkout pour une facture existante
 */
export const generateTransactionPaymentLink = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = req.params.id as string;
        const tx = await prisma.transaction.findUnique({
            where: { id },
            include: { company: true }
        });

        if (!tx) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Transaction introuvable' }
            });
        }

        const { createStripeCheckoutLink } = await import('../../services/stripe.service');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const checkout = await createStripeCheckoutLink({
            amount: Number(tx.amount),
            currency: tx.currency as 'EUR' | 'MAD',
            customerEmail: tx.company.adminEmail,
            title: `Facture KlikNode ${tx.invoiceNumber || tx.id.slice(0, 8)} — ${tx.company.name}`,
            description: tx.notes || `Règlement Facture KlikNode (${tx.company.name})`,
            metadata: {
                transactionId: tx.id,
                companyId: tx.companyId,
            },
            successUrl: `${frontendUrl}/company/billing?payment=success&tx=${tx.id}`,
            cancelUrl: `${frontendUrl}/company/billing?payment=cancelled`,
        });

        const updatedTx = await prisma.transaction.update({
            where: { id: tx.id },
            data: {
                paymentMethod: 'stripe',
                stripePaymentIntentId: checkout.sessionId,
                invoicePdfUrl: checkout.url,
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                paymentUrl: checkout.url,
                transaction: updatedTx
            }
        });
    } catch (error: any) {
        logger.error('Generate payment link error:', error);
        return res.status(400).json({
            success: false,
            error: {
                code: 'STRIPE_ERROR',
                message: error.message || 'Impossible de générer le lien Stripe'
            }
        });
    }
};

/**
 * PATCH /api/admin/transactions/:id/status
 * Permet au SuperAdmin de marquer une facture comme Payée (succeeded)
 */
export const updateTransactionStatus = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;

        if (!['succeeded', 'pending', 'failed', 'refunded'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_STATUS', message: 'Statut invalide' }
            });
        }

        const updated = await prisma.transaction.update({
            where: { id },
            data: {
                status: status as any,
                processedAt: status === 'succeeded' ? new Date() : undefined,
            }
        });

        return res.status(200).json({
            success: true,
            data: updated
        });
    } catch (error: any) {
        logger.error('Update transaction status error:', error);
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la mise à jour du statut' }
        });
    }
};

/**
 * POST /api/admin/transactions/:id/refund
 * Refund a transaction
 */
export const refundTransaction = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);

        const transaction = await prisma.transaction.findUnique({
            where: { id }
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Transaction introuvable'
                }
            });
        }

        if (transaction.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: 'Seules les transactions réussies peuvent être remboursées'
                }
            });
        }

        const updatedTx = await prisma.transaction.update({
            where: { id },
            data: { status: 'refunded' }
        });

        return res.status(200).json({
            success: true,
            data: { message: 'Transaction remboursée avec succès', transaction: updatedTx }
        });
    } catch (error: any) {
        logger.error('Failed to refund transaction:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors du remboursement'
            }
        });
    }
};

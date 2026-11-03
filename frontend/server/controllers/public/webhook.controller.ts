import { Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../../config/database';
import logger from '../../utils/logger.util';

// Initialiser Stripe avec la clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-00' as any,
});

/**
 * Gère les notifications de webhooks Stripe pour le Plan PRO (B2C)
 * POST /api/webhooks/stripe
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
        logger.error('Stripe webhook error: Missing stripe-signature header');
        return res.status(400).json({ success: false, error: 'Signature Stripe manquante.' });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        logger.error('Stripe webhook error: STRIPE_WEBHOOK_SECRET is not configured');
        return res.status(500).json({ success: false, error: 'Configuration webhook incorrecte.' });
    }

    let event: Stripe.Event;

    try {
        const rawBody = (req as any).rawBody;
        if (!rawBody) {
            throw new Error('Le corps brut (rawBody) de la requête est absent.');
        }
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
        logger.error(`Stripe signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    logger.info(`Stripe webhook event received: ${event.type}`);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                const customerEmail = session.customer_details?.email || session.customer_email;

                logger.info(`Processing checkout.session.completed for user ${userId || customerEmail}`);

                let user = null;

                if (userId) {
                    user = await prisma.user.findUnique({
                        where: { id: userId }
                    });
                }

                if (!user && customerEmail) {
                    user = await prisma.user.findUnique({
                        where: { email: customerEmail }
                    });
                }

                if (user) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { isPro: true }
                    });
                    logger.info(`User ${user.email} (ID: ${user.id}) successfully updated to isPro = true`);
                } else {
                    logger.error(`Stripe Webhook checkout.session.completed: User not found (ID: ${userId}, Email: ${customerEmail})`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                logger.info(`Processing customer.subscription.deleted for ${subscription.id}`);

                // Récupérer le client pour obtenir son adresse email
                const customerId = subscription.customer as string;
                let customerEmail: string | null = null;

                if (customerId) {
                    const customer = await stripe.customers.retrieve(customerId);
                    if (!customer.deleted) {
                        customerEmail = customer.email;
                    }
                }

                if (customerEmail) {
                    const user = await prisma.user.findUnique({
                        where: { email: customerEmail }
                    });

                    if (user) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { isPro: false }
                        });
                        logger.info(`User ${user.email} (ID: ${user.id}) successfully updated to isPro = false (subscription deleted)`);
                    } else {
                        logger.error(`Stripe Webhook customer.subscription.deleted: User not found with email ${customerEmail}`);
                    }
                } else {
                    logger.error(`Stripe Webhook customer.subscription.deleted: Could not resolve customer email for customer ID ${customerId}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const status = subscription.status;
                logger.info(`Processing customer.subscription.updated to status ${status}`);

                // Si l'abonnement est impayé, en retard ou annulé
                if (['unpaid', 'past_due', 'canceled', 'incomplete_expired'].includes(status)) {
                    const customerId = subscription.customer as string;
                    let customerEmail: string | null = null;

                    if (customerId) {
                        const customer = await stripe.customers.retrieve(customerId);
                        if (!customer.deleted) {
                            customerEmail = customer.email;
                        }
                    }

                    if (customerEmail) {
                        const user = await prisma.user.findUnique({
                            where: { email: customerEmail }
                        });

                        if (user) {
                            await prisma.user.update({
                                where: { id: user.id },
                                data: { isPro: false }
                            });
                            logger.info(`User ${user.email} (ID: ${user.id}) updated to isPro = false due to subscription status: ${status}`);
                        }
                    }
                }
                break;
            }

            default:
                logger.info(`Unhandled stripe webhook event type: ${event.type}`);
        }

        return res.json({ received: true });
    } catch (error: any) {
        logger.error(`Stripe webhook processing error: ${error.message}`);
        return res.status(500).json({ success: false, error: 'Erreur lors du traitement du webhook.' });
    }
};

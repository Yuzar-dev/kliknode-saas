import fs from 'fs';
import path from 'path';
import Stripe from 'stripe';
import prisma from '../config/database';
import logger from '../utils/logger.util';

export interface StripeConfigData {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    updatedAt: string;
}

const DATA_DIR = process.env.VERCEL ? '/tmp/kliknode-data' : path.join(process.cwd(), 'data');
const STRIPE_CONFIG_FILE = path.join(DATA_DIR, 'stripe-config.json');

let dbLoadedInMemory = false;

export async function ensureStripeConfigLoaded(): Promise<void> {
    if (dbLoadedInMemory && (process.env.STRIPE_SECRET_KEY || fs.existsSync(STRIPE_CONFIG_FILE))) {
        return;
    }
    try {
        const log = await prisma.auditLog.findFirst({
            where: { action: 'SYSTEM_STRIPE_CONFIG', entityType: 'system' },
            orderBy: { createdAt: 'desc' },
        });
        if (log?.changes && typeof log.changes === 'object') {
            const cfg = log.changes as Partial<StripeConfigData>;
            if (cfg.secretKey) process.env.STRIPE_SECRET_KEY = cfg.secretKey;
            if (cfg.publishableKey) process.env.STRIPE_PUBLISHABLE_KEY = cfg.publishableKey;
            if (cfg.webhookSecret) process.env.STRIPE_WEBHOOK_SECRET = cfg.webhookSecret;
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            fs.writeFileSync(STRIPE_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
        }
        dbLoadedInMemory = true;
    } catch {}
}

export function getStripeConfig(): {
    isConfigured: boolean;
    mode: 'live' | 'test' | 'unconfigured';
    publishableKey: string;
    maskedSecretKey: string;
    hasWebhookSecret: boolean;
} {
    let fileConfig: Partial<StripeConfigData> = {};
    try {
        if (fs.existsSync(STRIPE_CONFIG_FILE)) {
            fileConfig = JSON.parse(fs.readFileSync(STRIPE_CONFIG_FILE, 'utf8') || '{}');
        }
    } catch (err) {
        logger.error('Error reading stripe-config.json:', err);
    }

    const secretKey = (fileConfig.secretKey || process.env.STRIPE_SECRET_KEY || '').trim();
    const publishableKey = (fileConfig.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY || '').trim();
    const webhookSecret = (fileConfig.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '').trim();

    const isConfigured = secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_');
    const mode = secretKey.startsWith('sk_live_')
        ? 'live'
        : isConfigured
            ? 'test'
            : 'unconfigured';

    const maskedSecretKey = secretKey.length > 12
        ? `${secretKey.slice(0, 8)}••••••••${secretKey.slice(-4)}`
        : '';

    return {
        isConfigured,
        mode,
        publishableKey,
        maskedSecretKey,
        hasWebhookSecret: Boolean(webhookSecret),
    };
}

export async function saveStripeConfig(input: {
    secretKey?: string;
    publishableKey?: string;
    webhookSecret?: string;
    userId?: string;
}) {
    await ensureStripeConfigLoaded();

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let current: Partial<StripeConfigData> = {};
    if (fs.existsSync(STRIPE_CONFIG_FILE)) {
        try {
            current = JSON.parse(fs.readFileSync(STRIPE_CONFIG_FILE, 'utf8') || '{}');
        } catch {}
    }

    const updated: StripeConfigData = {
        secretKey: input.secretKey !== undefined && input.secretKey.trim() !== ''
            ? input.secretKey.trim()
            : (current.secretKey || process.env.STRIPE_SECRET_KEY || ''),
        publishableKey: input.publishableKey !== undefined
            ? input.publishableKey.trim()
            : (current.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY || ''),
        webhookSecret: input.webhookSecret !== undefined
            ? input.webhookSecret.trim()
            : (current.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || ''),
        updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(STRIPE_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf8');

    if (updated.secretKey) process.env.STRIPE_SECRET_KEY = updated.secretKey;
    if (updated.publishableKey) process.env.STRIPE_PUBLISHABLE_KEY = updated.publishableKey;
    if (updated.webhookSecret) process.env.STRIPE_WEBHOOK_SECRET = updated.webhookSecret;

    try {
        let actorId = input.userId;
        if (!actorId) {
            const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
            actorId = adminUser?.id;
        }
        if (actorId) {
            await prisma.auditLog.deleteMany({
                where: { action: 'SYSTEM_STRIPE_CONFIG', entityType: 'system' },
            }).catch(() => {});
            await prisma.auditLog.create({
                data: {
                    userId: actorId,
                    action: 'SYSTEM_STRIPE_CONFIG',
                    entityType: 'system',
                    entityId: 'stripe',
                    changes: updated as any,
                },
            }).catch(() => {});
        }
    } catch {}

    return getStripeConfig();
}

export function getStripeClient(): Stripe | null {
    let secretKey = process.env.STRIPE_SECRET_KEY || '';
    try {
        if (fs.existsSync(STRIPE_CONFIG_FILE)) {
            const parsed = JSON.parse(fs.readFileSync(STRIPE_CONFIG_FILE, 'utf8') || '{}');
            if (parsed.secretKey) secretKey = parsed.secretKey;
        }
    } catch {}

    secretKey = secretKey.trim();
    if (!secretKey || (!secretKey.startsWith('sk_') && !secretKey.startsWith('rk_'))) {
        return null;
    }

    return new Stripe(secretKey, {
        apiVersion: '2023-10-16' as any,
    });
}

/**
 * Crée une session Stripe Checkout (Paiement unique ou Abonnement récurrent avec essai gratuit 7j)
 */
export async function createStripeCheckoutLink(params: {
    amount: number;
    currency: 'EUR' | 'MAD';
    customerEmail?: string;
    title: string;
    description?: string;
    metadata?: Record<string, string>;
    successUrl: string;
    cancelUrl: string;
    recurringInterval?: 'month' | 'year';
    trialPeriodDays?: number;
}): Promise<{ url: string; sessionId: string }> {
    await ensureStripeConfigLoaded();
    const stripe = getStripeClient();
    if (!stripe) {
        throw new Error('Clé secrète Stripe (sk_test_... ou sk_live_...) non configurée. Cliquez sur "Configurer Clés Stripe" pour l\'ajouter.');
    }

    const unitAmount = Math.round(Number(params.amount) * 100);
    const currencyCode = params.currency.toLowerCase();
    const isSubscription = Boolean(params.recurringInterval);

    const session = await stripe.checkout.sessions.create({
        mode: isSubscription ? 'subscription' : 'payment',
        payment_method_types: ['card'],
        customer_email: params.customerEmail || undefined,
        line_items: [
            {
                price_data: {
                    currency: currencyCode,
                    unit_amount: unitAmount,
                    ...(isSubscription && params.recurringInterval
                        ? { recurring: { interval: params.recurringInterval } }
                        : {}),
                    product_data: {
                        name: params.title,
                        description: params.description || 'Commande & Abonnement KlikNode NFC',
                    },
                },
                quantity: 1,
            },
        ],
        ...(isSubscription && params.trialPeriodDays && params.trialPeriodDays > 0
            ? {
                subscription_data: {
                    trial_period_days: params.trialPeriodDays,
                    metadata: params.metadata || {},
                },
            }
            : {}),
        metadata: params.metadata || {},
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
    });

    if (!session.url) {
        throw new Error('Impossible de générer l\'URL de paiement Stripe.');
    }

    return {
        url: session.url,
        sessionId: session.id,
    };
}

export async function verifyStripeCheckoutSession(sessionId: string): Promise<{
    paidOrTrialActive: boolean;
    isTrial: boolean;
    trialEndsAt: string | null;
    subscriptionId: string | null;
    metadata: Record<string, string>;
}> {
    await ensureStripeConfigLoaded();
    const stripe = getStripeClient();
    if (!stripe) {
        throw new Error('Clé secrète Stripe non configurée.');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
    });

    const sub = session.subscription && typeof session.subscription === 'object'
        ? (session.subscription as Stripe.Subscription)
        : null;

    const paidOrTrialActive =
        session.status === 'complete' ||
        session.payment_status === 'paid' ||
        session.payment_status === 'no_payment_required';

    const isTrial = sub?.status === 'trialing';
    const trialEndsAt = sub?.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
    const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : (sub?.id || null);

    return {
        paidOrTrialActive,
        isTrial,
        trialEndsAt,
        subscriptionId,
        metadata: (session.metadata as Record<string, string>) || {},
    };
}

export async function checkStripeSubscriptionStatus(subscriptionId: string): Promise<{
    isActive: boolean;
    status: string;
    trialEndsAt: string | null;
} | null> {
    await ensureStripeConfigLoaded();
    const stripe = getStripeClient();
    if (!stripe || !subscriptionId) return null;
    try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        return {
            isActive: sub.status === 'active' || sub.status === 'trialing',
            status: sub.status,
            trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        };
    } catch {
        return null;
    }
}

import fs from 'fs';
import path from 'path';
import Stripe from 'stripe';
import logger from '../utils/logger.util';

export interface StripeConfigData {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    updatedAt: string;
}

const DATA_DIR = process.env.VERCEL ? '/tmp/kliknode-data' : path.join(process.cwd(), 'data');
const STRIPE_CONFIG_FILE = path.join(DATA_DIR, 'stripe-config.json');

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

export function saveStripeConfig(input: {
    secretKey?: string;
    publishableKey?: string;
    webhookSecret?: string;
}) {
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
 * Crée une session Stripe Checkout (Lien de paiement B2B ou B2C)
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
}): Promise<{ url: string; sessionId: string }> {
    const stripe = getStripeClient();
    if (!stripe) {
        throw new Error('Clé secrète Stripe (sk_test_... ou sk_live_...) non configurée. Cliquez sur "Configurer Clés Stripe" pour l\'ajouter.');
    }

    const unitAmount = Math.round(Number(params.amount) * 100);
    const currencyCode = params.currency.toLowerCase();

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: params.customerEmail || undefined,
        line_items: [
            {
                price_data: {
                    currency: currencyCode,
                    unit_amount: unitAmount,
                    product_data: {
                        name: params.title,
                        description: params.description || 'Commande & Abonnement KlikNode NFC',
                    },
                },
                quantity: 1,
            },
        ],
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

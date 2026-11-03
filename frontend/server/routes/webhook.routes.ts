import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/public/webhook.controller';

const router = Router();

/**
 * Route publique pour recevoir les webhooks Stripe
 * POST /api/webhooks/stripe
 */
router.post('/stripe', handleStripeWebhook);

export default router;

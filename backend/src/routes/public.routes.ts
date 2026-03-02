import { Router } from 'express';
import { getPublicCard, exchangeContact } from '../controllers/public/card.controller';
import { activateCard } from '../controllers/public/activation.controller';

const router = Router();

/**
 * Route pour récupérer une carte publique
 * GET /api/public/card/:slug
 */
router.get('/card/:slug', getPublicCard);

/**
 * Route pour l'échange de contact (Lead generation)
 * POST /api/public/card/:slug/exchange
 */
router.post('/card/:slug/exchange', exchangeContact);

/**
 * Route pour l'activation d'une carte par UID NFC
 * GET /api/public/activate/:uid
 */
router.get('/activate/:uid', activateCard);

export default router;


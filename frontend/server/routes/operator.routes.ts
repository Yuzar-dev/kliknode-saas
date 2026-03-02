import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireOperator } from '../middlewares/role.middleware';
import {
    encodeCard,
    pairCard,
    getCards,
    getStats,
    updateCardStatus,
} from '../controllers/operator/operator.controller';

const router = Router();

// Toutes les routes nécessitent auth + rôle opérateur
router.use(authMiddleware);
router.use(requireOperator);

router.post('/encode', encodeCard);
router.post('/pair', pairCard);
router.get('/cards', getCards);
router.get('/stats', getStats);
router.patch('/cards/:id/status', updateCardStatus);

export default router;

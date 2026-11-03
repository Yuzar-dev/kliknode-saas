import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireOperator } from '../middlewares/role.middleware';
import {
    encodeCard,
    encodeBatchCards,
    pairCard,
    getCards,
    getStats,
    updateCardStatus,
    deleteCard,
    assignBatchToCompany,
    getOperatorCompanies,
} from '../controllers/operator/operator.controller';

const router = Router();

// Toutes les routes nécessitent auth + rôle opérateur (ou admin)
router.use(authMiddleware);
router.use(requireOperator);

router.post('/encode', encodeCard);
router.post('/encode-batch', encodeBatchCards);
router.post('/pair', pairCard);
router.get('/cards', getCards);
router.get('/stats', getStats);
router.get('/companies', getOperatorCompanies);
router.patch('/cards/:id/status', updateCardStatus);
router.delete('/cards/:id', deleteCard);
router.post('/assign-batch', assignBatchToCompany);

export default router;

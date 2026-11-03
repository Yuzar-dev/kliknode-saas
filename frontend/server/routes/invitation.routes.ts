import { Router } from 'express';
import { verifyInvitation, acceptInvitation } from '../controllers/invitation.controller';

const router = Router();

// Routes publiques (sans authentification puisque l'utilisateur n'est pas encore connecté)
router.get('/verify/:token', verifyInvitation);
router.post('/accept/:token', acceptInvitation);

export default router;

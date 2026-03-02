import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
    getMyCard,
    updateMyCard,
    uploadAvatar,
    getSocialLinks,
    addSocialLink,
    updateSocialLink,
    deleteSocialLink,
    reorderSocialLinks,
    getAnalytics,
    getLeads,
    changePassword,
} from '../controllers/user/user.controller';

const router = Router();

// Toutes les routes nécessitent authentification
router.use(authMiddleware);

// Card
router.get('/card', getMyCard);
router.put('/card', updateMyCard);
router.post('/card/avatar', uploadAvatar);

// Social Links
router.get('/social-links', getSocialLinks);
router.post('/social-links', addSocialLink);
router.put('/social-links/reorder', reorderSocialLinks); // avant :id pour éviter le conflit
router.put('/social-links/:id', updateSocialLink);
router.delete('/social-links/:id', deleteSocialLink);

// Analytics
router.get('/analytics', getAnalytics);

// Leads (contacts reçus)
router.get('/leads', getLeads);

// Sécurité / Paramètres
router.post('/change-password', changePassword);

export default router;

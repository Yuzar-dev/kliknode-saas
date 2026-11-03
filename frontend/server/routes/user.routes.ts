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
    updateUserLead,
    deleteUserLead,
    getUserCrmConfig,
    saveUserCrmConfig,
    syncUserLeadsToCrm,
    changePassword,
    getB2CPlans,
    subscribeB2CPlan,
    upgradeSimulate,
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

// Leads (contacts reçus) & CRM
router.get('/leads', getLeads);
router.put('/leads/:id', updateUserLead);
router.delete('/leads/:id', deleteUserLead);
router.get('/crm-config', getUserCrmConfig);
router.post('/crm-config', saveUserCrmConfig);
router.post('/crm-sync', syncUserLeadsToCrm);

// Sécurité / Paramètres
router.post('/change-password', changePassword);

// Abonnements B2C (Plans & Souscription)
router.get('/plans', getB2CPlans);
router.post('/subscribe', subscribeB2CPlan);

// Simulation de passage au statut PRO pour les tests en local
router.post('/upgrade-simulate', upgradeSimulate);

export default router;


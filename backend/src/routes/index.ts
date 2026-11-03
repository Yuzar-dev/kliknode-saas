import { Router } from 'express';
import { ensureCleanDatabase } from '../config/database';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import publicRoutes from './public.routes';
import operatorRoutes from './operator.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import invitationRoutes from './invitation.routes';

const router = Router();

router.get('/health', async (_req, res) => {
    await ensureCleanDatabase();
    res.status(200).json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Montage de toutes les routes
 */
router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/public', publicRoutes);
router.use('/operator', operatorRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/invitations', invitationRoutes);

export default router;


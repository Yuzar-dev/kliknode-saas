import { Router } from 'express';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import publicRoutes from './public.routes';
import operatorRoutes from './operator.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';

const router = Router();

/**
 * Montage de toutes les routes
 */
router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/public', publicRoutes);
router.use('/operator', operatorRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);

export default router;


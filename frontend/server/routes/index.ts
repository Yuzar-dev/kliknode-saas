import { Router } from 'express';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import publicRoutes from './public.routes';
import operatorRoutes from './operator.routes';
import userRoutes from './user.routes';

const router = Router();

/**
 * Montage de toutes les routes
 */
router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/public', publicRoutes);
router.use('/operator', operatorRoutes);
router.use('/user', userRoutes);

export default router;


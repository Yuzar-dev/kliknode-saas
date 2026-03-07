import { Router } from 'express';
import { getAdminStats } from '../controllers/admin/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireSuperAdmin } from '../middlewares/role.middleware';

const router = Router();

// Protect all admin routes
router.use(authMiddleware);
router.use(requireSuperAdmin);

// Dashboard routes
router.get('/stats', getAdminStats);

export default router;

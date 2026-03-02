import { Router } from 'express';
import { getCompanyDashboardStats } from '../controllers/company/dashboard.controller';
import { getEmployees } from '../controllers/company/employees.controller';
import { getDepartments } from '../controllers/company/departments.controller';
import { getBranding, updateBranding } from '../controllers/company/branding.controller';
import { getLeads } from '../controllers/company/leads.controller';
import { getSubscription, getInvoices } from '../controllers/company/billing.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireCompanyAdmin } from '../middlewares/role.middleware';

const router = Router();

// Protect all company routes
router.use(authMiddleware);
router.use(requireCompanyAdmin);

// Imported at top
router.get('/dashboard', getCompanyDashboardStats);
router.get('/employees', getEmployees);
router.get('/departments', getDepartments);
router.get('/branding', getBranding);
router.patch('/branding', updateBranding);
router.get('/leads', getLeads);
router.get('/billing/subscription', getSubscription);
router.get('/billing/invoices', getInvoices);

export default router;

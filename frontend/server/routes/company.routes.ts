import { Router } from 'express';
import { getCompanyDashboardStats, createHardwareOrder } from '../controllers/company/dashboard.controller';
import {
    getEmployees,
    createEmployee,
    updateEmployee,
    toggleEmployeeStatus,
    resetEmployeePassword,
    importEmployeesCsv
} from '../controllers/company/employees.controller';
import {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} from '../controllers/company/departments.controller';
import { getBranding, updateBranding } from '../controllers/company/branding.controller';
import { getLeads, updateLead, deleteLead, getCompanyCrmConfig, saveCompanyCrmConfig, syncCompanyLeadsToCrm } from '../controllers/company/leads.controller';
import { getSubscription, updateSubscription, getInvoices } from '../controllers/company/billing.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireCompanyAdmin } from '../middlewares/role.middleware';

const router = Router();

// Protect all company routes
router.use(authMiddleware);
router.use(requireCompanyAdmin);

// Dashboard & Hardware Orders
router.get('/dashboard', getCompanyDashboardStats);
router.post('/hardware-orders', createHardwareOrder);

// Employees
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.post('/employees/import', importEmployeesCsv);
router.put('/employees/:id', updateEmployee);
router.patch('/employees/:id/toggle-status', toggleEmployeeStatus);
router.post('/employees/:id/reset-password', resetEmployeePassword);

// Departments / Groups
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Branding
router.get('/branding', getBranding);
router.patch('/branding', updateBranding);

// Leads / Contacts
router.get('/leads/crm-config', getCompanyCrmConfig);
router.post('/leads/crm-config', saveCompanyCrmConfig);
router.post('/leads/crm-sync', syncCompanyLeadsToCrm);
router.get('/leads', getLeads);
router.patch('/leads/:id', updateLead);
router.delete('/leads/:id', deleteLead);

// Billing & Subscription
router.get('/billing/subscription', getSubscription);
router.patch('/billing/subscription', updateSubscription);
router.get('/billing/invoices', getInvoices);

export default router;

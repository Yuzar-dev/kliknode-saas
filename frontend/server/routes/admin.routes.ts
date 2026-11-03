import { Router } from 'express';
import { getAdminStats } from '../controllers/admin/dashboard.controller';
import { getAdminCompanies, getAdminCompanyDetail, createAdminCompany, impersonateCompanyAdmin, toggleCompanyStatus, resendCompanyInvitation, deleteAdminCompany } from '../controllers/admin/company.controller';
import { getAdminOperators, getAdminOperatorStats, createAdminOperator, revokeAdminOperator } from '../controllers/admin/operator.controller';
import { getAdminInventory, getAdminInventoryStats, adjustStock, transferStock, deleteInventoryItem, resetAllInventory } from '../controllers/admin/inventory.controller';
import { getAdminHardwareOrders, getAdminHardwareOrderStats, createAdminHardwareOrder, updateAdminHardwareOrder, deleteAdminHardwareOrder } from '../controllers/admin/hardware-order.controller';
import { getAdminTransactions, getAdminTransactionStats, createManualInvoice, refundTransaction, getAdminStripeConfig, saveAdminStripeConfig, generateTransactionPaymentLink, updateTransactionStatus } from '../controllers/admin/transaction.controller';
import { getAdminPlans, createAdminPlan, updateAdminPlan, deleteAdminPlan, assignCompanyPlan, assignUserB2CPlan } from '../controllers/admin/plan.controller';
import { getAdminPromoCodes, createAdminPromoCode, updateAdminPromoCode, deleteAdminPromoCode } from '../controllers/admin/promo.controller';
import { getAdminBatches, createAdminBatch, exportBatchCsv, deleteAdminBatch } from '../controllers/admin/batch.controller';
import { getAdminAuditLogs, getAdminAuditLogDetails } from '../controllers/admin/audit.controller';

import { authMiddleware } from '../middlewares/auth.middleware';
import { requireSuperAdmin } from '../middlewares/role.middleware';

const router = Router();

// Protect all admin routes
router.use(authMiddleware);
router.use(requireSuperAdmin);

// Dashboard routes
router.get('/stats', getAdminStats);

// Companies
router.get('/companies', getAdminCompanies);
router.post('/companies', createAdminCompany);
router.get('/companies/:id', getAdminCompanyDetail);
router.post('/companies/:id/impersonate', impersonateCompanyAdmin);
router.patch('/companies/:id/status', toggleCompanyStatus);
router.post('/companies/:id/resend-invitation', resendCompanyInvitation);
router.delete('/companies/:id', deleteAdminCompany);

// Operators
router.get('/operators', getAdminOperators);
router.get('/operators/stats', getAdminOperatorStats);
router.post('/operators', createAdminOperator);
router.patch('/operators/:id/revoke', revokeAdminOperator);

// Inventory
router.get('/inventory', getAdminInventory);
router.get('/inventory/stats', getAdminInventoryStats);
router.post('/inventory/adjust', adjustStock);
router.patch('/inventory/adjust', adjustStock);
router.post('/inventory/transfer', transferStock);
router.post('/inventory/reset', resetAllInventory);
router.delete('/inventory/:id', deleteInventoryItem);

// Hardware Orders
router.get('/hardware-orders', getAdminHardwareOrders);
router.get('/hardware-orders/stats', getAdminHardwareOrderStats);
router.post('/hardware-orders', createAdminHardwareOrder);
router.patch('/hardware-orders/:id', updateAdminHardwareOrder);
router.delete('/hardware-orders/:id', deleteAdminHardwareOrder);

// Transactions & Stripe Payment Links
router.get('/transactions', getAdminTransactions);
router.get('/transactions/stats', getAdminTransactionStats);
router.get('/transactions/stripe-config', getAdminStripeConfig);
router.post('/transactions/stripe-config', saveAdminStripeConfig);
router.post('/transactions/invoice', createManualInvoice);
router.post('/transactions/:id/payment-link', generateTransactionPaymentLink);
router.patch('/transactions/:id/status', updateTransactionStatus);
router.post('/transactions/:id/refund', refundTransaction);

// Plans (B2B & B2C)
router.get('/plans', getAdminPlans);
router.post('/plans', createAdminPlan);
router.patch('/plans/:id', updateAdminPlan);
router.delete('/plans/:id', deleteAdminPlan);
router.post('/plans/assign-company', assignCompanyPlan);
router.post('/plans/assign-user', assignUserB2CPlan);

// Promo Codes
router.get('/promo-codes', getAdminPromoCodes);
router.post('/promo-codes', createAdminPromoCode);
router.patch('/promo-codes/:id', updateAdminPromoCode);
router.delete('/promo-codes/:id', deleteAdminPromoCode);

// Batches
router.get('/batches', getAdminBatches);
router.post('/batches', createAdminBatch);
router.get('/batches/:batchTag/export', exportBatchCsv);
router.delete('/batches/:batchTag', deleteAdminBatch);

// Audit Logs
router.get('/audit-logs', getAdminAuditLogs);
router.get('/audit-logs/:id', getAdminAuditLogDetails);

export default router;


import express from 'express';
import {
  getInstallments,
  getInstallmentById,
  createInstallment,
  updateInstallment,
  deleteInstallment,
  getSummaryStats,
  getOverdueInstallments,
  getVasooliList,
  getDueToday,
  rolloverInstallment,
  getInstallmentLedger,
  getInstallmentStats,
} from '../controllers/installment.controller.js';

import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Custom routes must go before /:id to prevent them being parsed as an ID
router.get('/stats', authorizeRoles('owner', 'manager'), getInstallmentStats);
router.get('/stats/summary', getSummaryStats);
router.get('/overdue', getOverdueInstallments);
router.get('/vasooli', getVasooliList);
router.get('/due-today', getDueToday);

// Rollback-safe transactional rollover (only owner/manager)
router.post('/rollover', authorizeRoles('owner', 'manager'), rolloverInstallment);

router.route('/')
  .get(getInstallments)
  .post(authorizeRoles('owner', 'manager'), createInstallment);

router.get('/:id/ledger', getInstallmentLedger);

router.route('/:id')
  .get(getInstallmentById)
  .put(authorizeRoles('owner', 'manager'), updateInstallment)
  .delete(authorizeRoles('owner'), deleteInstallment);

export default router;

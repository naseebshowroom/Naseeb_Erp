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
} from '../controllers/installment.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Custom routes must go before /:id to prevent them being parsed as an ID
router.get('/stats/summary', getSummaryStats);
router.get('/overdue', getOverdueInstallments);
router.get('/vasooli', getVasooliList);
router.get('/due-today', getDueToday);
router.post('/rollover', rolloverInstallment);

router.route('/')
  .get(getInstallments)
  .post(createInstallment);

router.get('/:id/ledger', getInstallmentLedger);

router.route('/:id')
  .get(getInstallmentById)
  .put(updateInstallment)
  .delete(authorize('owner', 'manager'), deleteInstallment);

export default router;

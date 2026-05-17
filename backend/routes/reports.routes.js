import express from 'express';
import {
  getFinancialSummary,
  getMonthlyReport,
  getCategoryBreakdown,
  getOverdueReport,
  getDistributorPayables,
  exportReport,
} from '../controllers/reports.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/financial',    getFinancialSummary);
router.get('/monthly',      getMonthlyReport);
router.get('/category',     getCategoryBreakdown);
router.get('/overdue',      getOverdueReport);
router.get('/distributors', getDistributorPayables);
router.get('/export',       exportReport);

export default router;

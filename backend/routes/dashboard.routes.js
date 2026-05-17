import express from 'express';
import {
  getDashboardStats,
  getStockOverview,
  getRecentActivity,
  getPaymentCalendar
} from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/stock-overview', getStockOverview);
router.get('/activity/recent', getRecentActivity);
router.get('/payments/calendar', getPaymentCalendar);

export default router;

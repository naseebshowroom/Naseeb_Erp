import express from 'express';
import authRoutes from './auth.routes.js';
import customerRoutes from './customer.routes.js';
import installmentRoutes from './installment.routes.js';
import paymentRoutes from './payment.routes.js';
import settingsRoutes from './settings.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/installments', installmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/settings', settingsRoutes);

export default router;

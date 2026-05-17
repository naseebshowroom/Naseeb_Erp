import express from 'express';
import authRoutes from './auth.routes.js';
import customerRoutes from './customer.routes.js';
import installmentRoutes from './installment.routes.js';
import paymentRoutes from './payment.routes.js';
import settingsRoutes from './settings.routes.js';
import inventoryRoutes from './inventory.routes.js';
import distributorRoutes from './distributor.routes.js';
import reportsRoutes from './reports.routes.js';
import agreementRoutes from './agreement.routes.js';
import pdfRoutes from './pdf.routes.js';
import workerRoutes from './worker.routes.js';
import collectionRoutes from './collection.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import globalRoutes from './global.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/installments', installmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/settings', settingsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/distributors', distributorRoutes);
router.use('/reports', reportsRoutes);
router.use('/agreements', agreementRoutes);
router.use('/pdf', pdfRoutes);
router.use('/workers', workerRoutes);
router.use('/collections', collectionRoutes);
router.use('/dashboard', dashboardRoutes);

router.use('/', globalRoutes);

export default router;

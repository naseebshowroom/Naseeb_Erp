import express from 'express';
import {
  getDistributors,
  getDistributorStats,
  getDistributorById,
  createDistributor,
  updateDistributor,
  deleteDistributor,
  recordSupply,
  recordPayment,
  addSuppliedItem,
  updateSuppliedItemStatus,
  deleteSuppliedItem,
  getDistributorStockReport,
} from '../controllers/distributor.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats',          getDistributorStats);
router.route('/')
  .get(getDistributors)
  .post(authorizeRoles('owner'), createDistributor);

router.route('/:id')
  .get(getDistributorById)
  .put(authorizeRoles('owner'), updateDistributor)
  .delete(authorizeRoles('owner'), deleteDistributor);

router.get('/:id/ledger', getDistributorById);

router.post('/:id/supply',                          authorizeRoles('owner'), recordSupply);
router.post('/:id/payment',                         authorizeRoles('owner'), recordPayment);

// Supplied items (granular per-unit)
router.post('/:id/items',                           authorizeRoles('owner'), addSuppliedItem);
router.patch('/:id/items/:itemId/status',           authorizeRoles('owner'), updateSuppliedItemStatus);
router.delete('/:id/items/:itemId',                 authorizeRoles('owner'), deleteSuppliedItem);

// Stock report
router.get('/:id/stock-report',                     getDistributorStockReport);

export default router;

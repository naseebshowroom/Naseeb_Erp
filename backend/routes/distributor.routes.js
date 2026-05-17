import express from 'express';
import {
  getDistributors,
  getDistributorStats,
  getDistributorById,
  createDistributor,
  updateDistributor,
  recordSupply,
  recordPayment,
  addSuppliedItem,
  updateSuppliedItemStatus,
  deleteSuppliedItem,
} from '../controllers/distributor.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats',          getDistributorStats);
router.route('/')
  .get(getDistributors)
  .post(createDistributor);

router.route('/:id')
  .get(getDistributorById)
  .put(updateDistributor);

router.get('/:id/ledger', getDistributorById);

router.post('/:id/supply',                          recordSupply);
router.post('/:id/payment',                         recordPayment);

// Supplied items (granular per-unit)
router.post('/:id/items',                           addSuppliedItem);
router.patch('/:id/items/:itemId/status',           updateSuppliedItemStatus);
router.delete('/:id/items/:itemId',                 deleteSuppliedItem);

export default router;

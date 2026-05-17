import express from 'express';
import {
  getDistributors,
  getDistributorStats,
  getDistributorById,
  createDistributor,
  updateDistributor,
  recordSupply,
  recordPayment,
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

router.post('/:id/supply',   recordSupply);
router.post('/:id/payment',  recordPayment);

export default router;

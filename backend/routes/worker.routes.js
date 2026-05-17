import express from 'express';
import {
  getWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
  getWorkerCollectionReport
} from '../controllers/worker.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getWorkers)
  .post(createWorker);

// Collection report must come before /:id to avoid ID collision
router.get('/:workerId/collection-report', getWorkerCollectionReport);

router.route('/:id')
  .put(updateWorker)
  .delete(deleteWorker);

export default router;

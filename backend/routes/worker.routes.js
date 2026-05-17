import express from 'express';
import {
  getWorkers,
  createWorker,
  updateWorker,
  deleteWorker
} from '../controllers/worker.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getWorkers)
  .post(createWorker);

router.route('/:id')
  .put(updateWorker)
  .delete(deleteWorker);

export default router;

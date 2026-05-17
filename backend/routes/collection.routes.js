import express from 'express';
import {
  getTodaysCollections,
  updateCollectionStatus,
  assignCollection
} from '../controllers/collection.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/today', getTodaysCollections);
router.post('/', assignCollection);
router.patch('/:id/status', updateCollectionStatus);

export default router;

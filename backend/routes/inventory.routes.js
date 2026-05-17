import express from 'express';
import { getInventory, addInventory, getInventoryStats, getInventoryAlerts } from '../controllers/inventory.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getInventoryStats);
router.get('/alerts', getInventoryAlerts);
router.route('/')
  .get(getInventory)
  .post(addInventory);

export default router;

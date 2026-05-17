import express from 'express';
import { globalSearch, getNotifications, markNotificationRead } from '../controllers/global.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/search', globalSearch);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

export default router;

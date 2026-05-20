import express from 'express';
import { globalSearch, getNotifications, markNotificationRead, getPublicStock } from '../controllers/global.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ── PUBLIC (no auth required) ─────────────────────────────────
router.get('/public-stock', getPublicStock);

// ── PROTECTED ─────────────────────────────────────────────────
router.use(protect);

router.get('/search', globalSearch);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

export default router;

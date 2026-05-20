import express from 'express';
import {
  getAssets,
  getAssetById,
  searchAsset,
  createAsset,
  issueAsset,
  markAssetReturned,
  markAssetResold,
  reissueAsset,
  getAssetHistory,
  // ── Infinite chain additions ──────────────
  markResoldToNextParty,
  markReturnedToOwner,
  getAssetAlerts,
  getAssetByChassis,
} from '../controllers/asset.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

// ── Specific named routes BEFORE /:id to avoid Express ID-matching ──────────
router.get('/alerts',                 getAssetAlerts);
router.get('/search',                 searchAsset);
router.get('/by-chassis/:chassisNumber', getAssetByChassis);

// ── Collection routes ───────────────────────────────────────────────────────
router.route('/')
  .get(getAssets)
  .post(createAsset);

// ── Single asset routes ─────────────────────────────────────────────────────
router.route('/:id')
  .get(getAssetById);

router.get('/:id/history',           getAssetHistory);

// Existing lifecycle routes (kept for backward compat)
router.patch('/:id/issue',           issueAsset);
router.patch('/:id/return',          markAssetReturned);   // original — kept
router.patch('/:id/resold',          markAssetResold);     // original — kept
router.patch('/:id/reissue',         reissueAsset);

// ── New infinite chain routes ───────────────────────────────────────────────
router.patch('/:id/resold-next',     markResoldToNextParty);  // any party #
router.patch('/:id/returned',        markReturnedToOwner);    // enriched return

export default router;

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
  getAssetHistory
} from '../controllers/asset.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

// Specific routes before /:id
router.get('/search', searchAsset);

router.route('/')
  .get(getAssets)
  .post(createAsset);

router.route('/:id')
  .get(getAssetById);

router.get('/:id/history',    getAssetHistory);
router.patch('/:id/issue',    issueAsset);
router.patch('/:id/return',   markAssetReturned);
router.patch('/:id/resold',   markAssetResold);
router.patch('/:id/reissue',  reissueAsset);

export default router;

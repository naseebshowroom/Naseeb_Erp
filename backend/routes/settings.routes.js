import express from 'express';
import { body, validationResult } from 'express-validator';
import { getSettings, updateSettings, uploadLogo } from '../controllers/settings.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const settingsRules = [
  body('shopName').optional().notEmpty().withMessage('Shop name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
];

router.route('/')
  .get(protect, getSettings)
  .put(
    protect,
    authorize('owner'),
    settingsRules,
    validateRequest,
    updateSettings
  );

router.post('/logo', protect, authorize('owner'), upload.single('logo'), uploadLogo);

export default router;

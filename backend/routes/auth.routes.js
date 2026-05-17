import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  login,
  refresh,
  logout,
  getMe,
  changePassword,
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  updateProfile,
  uploadProfilePhoto
} from '../controllers/auth.controller.js';
import upload from '../middleware/upload.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validateRequest, login);

router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/profile/photo', protect, upload.single('photo'), uploadProfilePhoto);

router.put('/change-password', [
  protect,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], validateRequest, changePassword);

// Worker / user management routes
router.post('/register',    protect, authorize('owner', 'manager'), createUser);
router.get('/users',        protect, authorize('owner', 'manager'), getUsers);
router.put('/users/:id',    protect, authorize('owner', 'manager'), updateUser);
router.delete('/users/:id', protect, authorize('owner'),            deleteUser);

export default router;

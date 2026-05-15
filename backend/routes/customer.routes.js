import express from 'express';
import { body, param, validationResult } from 'express-validator';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerSummary
} from '../controllers/customer.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// Validation Middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const customerValidationRules = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('fatherName').notEmpty().withMessage('Father name is required'),
  body('cnic').matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/).withMessage('Valid CNIC format required: 00000-0000000-0'),
  body('phone').matches(/^03[0-9]{2}-[0-9]{7}$/).withMessage('Valid Phone format required: 0300-0000000'),
  body('address').notEmpty().withMessage('Address is required'),
  body('city').notEmpty().withMessage('City is required')
];

// Configure multer fields for specific photo uploads
const uploadFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'cnicFront', maxCount: 1 },
  { name: 'cnicBack', maxCount: 1 }
]);

// Apply protect middleware to all routes
router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(uploadFields, customerValidationRules, validateRequest, createCustomer);

router.route('/:id')
  .get(
    param('id').isMongoId().withMessage('Invalid customer ID'),
    validateRequest,
    getCustomerById
  )
  .put(
    param('id').isMongoId().withMessage('Invalid customer ID'),
    uploadFields,
    validateRequest, // Partial validation could be applied here
    updateCustomer
  )
  .delete(
    authorize('owner', 'manager'),
    param('id').isMongoId().withMessage('Invalid customer ID'),
    validateRequest,
    deleteCustomer
  );

router.route('/:id/summary')
  .get(
    param('id').isMongoId().withMessage('Invalid customer ID'),
    validateRequest,
    getCustomerSummary
  );

export default router;

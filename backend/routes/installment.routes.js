import express from 'express';
import { body, param, validationResult } from 'express-validator';
import {
  getInstallments,
  getInstallmentById,
  createInstallment,
  updateInstallment,
  deleteInstallment,
  getSummaryStats,
  getOverdueInstallments
} from '../controllers/installment.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Validation Middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const installmentValidationRules = [
  body('customer').isMongoId().withMessage('Valid customer ID is required'),
  body('category').isIn(['mobile', 'ac', 'lcd', 'washing_machine', 'fridge', 'motorcycle', 'car', 'other']).withMessage('Invalid category'),
  body('purchasePrice').isNumeric().withMessage('Purchase price is required'),
  body('installmentPrice').isNumeric().withMessage('Installment sale price is required'),
  body('advanceAmount').isNumeric().withMessage('Advance amount is required'),
  body('totalInstallments').isInt({ min: 1 }).withMessage('Total installments must be at least 1'),
  body('scheduleType').isIn(['daily', 'weekly', '5day', '10day', 'monthly']).withMessage('Invalid schedule type'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
];

// Apply protect middleware to all routes
router.use(protect);

// Custom routes must go before /:id to prevent "stats" being parsed as an ID
router.get('/stats/summary', getSummaryStats);
router.get('/overdue', getOverdueInstallments);

router.route('/')
  .get(getInstallments)
  .post(installmentValidationRules, validateRequest, createInstallment);

router.route('/:id')
  .get(
    param('id').isMongoId().withMessage('Invalid installment ID'),
    validateRequest,
    getInstallmentById
  )
  .put(
    param('id').isMongoId().withMessage('Invalid installment ID'),
    validateRequest,
    updateInstallment
  )
  .delete(
    authorize('owner', 'manager'),
    param('id').isMongoId().withMessage('Invalid installment ID'),
    validateRequest,
    deleteInstallment
  );

export default router;

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import {
  recordPayment,
  getPayments,
  getCollectedToday,
  getReceiptData,
  deletePayment,
  getDailySummary
} from '../controllers/payment.controller.js';
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

const paymentRules = [
  body('installment').isMongoId().withMessage('Valid installment ID is required'),
  body('customer').isMongoId().withMessage('Valid customer ID is required'),
  body('amount').isNumeric().withMessage('Amount is required'),
  body('scheduleEntryId').optional().isMongoId().withMessage('Invalid schedule ID'),
];

router.use(protect);

router.get('/collected-today', getCollectedToday);
router.get('/summary/daily', getSummaryDaily);

// Workaround for undefined getSummaryDaily until we declare it inline for alias
function getSummaryDaily(req, res) {
  return getDailySummary(req, res);
}

router.route('/')
  .get(getPayments)
  .post(paymentRules, validateRequest, recordPayment);

router.route('/receipt/:id')
  .get(
    param('id').isMongoId().withMessage('Invalid payment ID'),
    validateRequest,
    getReceiptData
  );

router.route('/:id')
  .delete(
    authorize('owner'), // Only owner can delete/reverse money logs
    param('id').isMongoId().withMessage('Invalid payment ID'),
    validateRequest,
    deletePayment
  );

export default router;

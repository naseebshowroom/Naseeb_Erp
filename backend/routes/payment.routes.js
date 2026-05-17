import express from 'express';
import { body, param, validationResult } from 'express-validator';
import {
  recordPayment,
  getPayments,
  getCollectedToday,
  getReceiptData,
  deletePayment,
  getDailySummary,
  getMonthlySummary,
  updateScheduleStatus,
  bulkPaySchedule,
} from '../controllers/payment.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

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
router.get('/summary/monthly', getMonthlySummary);

function getSummaryDaily(req, res) {
  return getDailySummary(req, res);
}

// Schedule-specific routes — must come before /:id
router.patch('/schedule/:scheduleId/status', updateScheduleStatus);
router.post('/schedule/bulk-pay', bulkPaySchedule);

router.route('/')
  .get(getPayments)
  .post(recordPayment);

router.route('/receipt/:id')
  .get(
    param('id').isMongoId().withMessage('Invalid payment ID'),
    validateRequest,
    getReceiptData
  );

router.route('/:id')
  .delete(
    authorize('owner'),
    param('id').isMongoId().withMessage('Invalid payment ID'),
    validateRequest,
    deletePayment
  );

export default router;

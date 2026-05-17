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
  bulkPayment,
} from '../controllers/payment.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

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
router.get('/summary/daily', getDailySummary);
router.get('/summary/monthly', getMonthlySummary);

// Workers can mark payments
router.patch('/schedule/:scheduleId/status', updateScheduleStatus);

// Bulk payment distributed via FIFO
router.post('/bulk-payment', bulkPayment);

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
    authorizeRoles('owner'),
    param('id').isMongoId().withMessage('Invalid payment ID'),
    validateRequest,
    deletePayment
  );

export default router;

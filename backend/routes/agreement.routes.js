import express from 'express';
import { 
  getAgreements, 
  getAgreementRecordsByInstallment, 
  markAsPrinted,
  getNextAgreementNumber,
  createAgreement
} from '../controllers/agreement.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getAgreements);
router.post('/', createAgreement);
router.get('/next-number', getNextAgreementNumber);
router.get('/installment/:installmentId', getAgreementRecordsByInstallment);
router.post('/mark-printed', markAsPrinted);

export default router;

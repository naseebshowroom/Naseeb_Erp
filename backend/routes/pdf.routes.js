import express from 'express';
import generatePDF from '../utils/generatePDF.js';
import {
  electronicsAgreementHTML,
  motorcycleAgreementHTML,
  carAgreementHTML,
  saleReceiptHTML,
} from '../utils/documentTemplates.js';
import Installment from '../models/Installment.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ─── Schedule type → days mapping ────────────────────────────────────────────
const SCHEDULE_DAYS = {
  daily:    1,
  weekly:   7,
  '5-day':  5,
  '10-day': 10,
  monthly:  30,
};

// ─── Shared data builder from a populated installment doc ────────────────────
const buildData = (installment) => {
  const customer    = installment.customer || {};
  const guarantors  = customer.guarantors  || [];

  // Guarantor schema has: fullName, cnic, phone, address, type (no fatherName)
  const mapGuarantor = (g) => g ? {
    fullName:   g.fullName  || '',
    fatherName: '',          // not stored — leave blank on agreement
    phone:      g.phone     || '',
  } : {};

  return {
    // Customer
    customerName:        customer.fullName        || '',
    fatherName:          customer.fatherName       || '',
    cnic:                customer.cnic             || '',
    phone:               customer.phone            || '',
    address:             customer.address          || '',

    // Agreement meta
    accountNumber: installment._id.toString().slice(-6).toUpperCase(),
    date: new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }),

    // Financial — perInstallmentAmount always rounded
    installmentPrice:    installment.installmentPrice,
    advanceAmount:       installment.advanceAmount,
    remainingAmount:     installment.remainingAmount,
    perInstallmentAmount: Math.round(installment.perInstallmentAmount),
    totalInstallments:   installment.totalInstallments,
    scheduleDay:         SCHEDULE_DAYS[installment.scheduleType] ?? 30,

    // Product
    itemName:            `${installment.brand || ''} ${installment.model || ''}`.trim(),
    brand:               installment.brand            || '',
    model:               installment.model            || '',
    color:               installment.color            || '',
    engineNumber:        installment.engineNumber     || '—',
    chassisNumber:       installment.chassisNumber    || '—',
    registrationNumber:  installment.registrationNumber || '—',
    year:                installment.year             || '',

    // Motorcycle aliases
    bikeCompany: installment.brand  || '',
    bikeModel:   installment.model  || '',
    bikeColor:   installment.color  || '',

    // Car aliases
    carMake:  installment.brand  || '',
    carModel: installment.model  || '',
    carYear:  installment.year   || '',
    carColor: installment.color  || '',

    // Guarantors
    guarantor1: mapGuarantor(guarantors[0]),
    guarantor2: mapGuarantor(guarantors[1]),
  };
};

// ─── Helper: send PDF buffer as download ─────────────────────────────────────
const sendPDF = (res, pdfBuffer, filename) => {
  res.set({
    'Content-Type':        'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length':      pdfBuffer.length,
  });
  res.send(pdfBuffer);
};

// ─── Fetch installment (populated) ───────────────────────────────────────────
const fetchInstallment = async (installmentId) => {
  // guarantors are embedded subdocuments on customer — no nested populate needed
  const inst = await Installment.findById(installmentId).populate('customer');
  return inst;
};

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/pdf/electronics-agreement
// ═════════════════════════════════════════════════════════════════════════════
router.post('/electronics-agreement', protect, async (req, res) => {
  try {
    const { installmentId } = req.body;
    if (!installmentId) return res.status(400).json({ message: 'installmentId required' });

    const installment = await fetchInstallment(installmentId);
    if (!installment) return res.status(404).json({ message: 'Installment not found' });

    const data = buildData(installment);
    const html = electronicsAgreementHTML(data);
    const pdf  = await generatePDF(html);

    sendPDF(res, pdf, `Electronics-Agreement-${data.customerName}-${Date.now()}.pdf`);
  } catch (err) {
    console.error('[PDF route] electronics-agreement:', err.message);
    res.status(500).json({ message: 'PDF generation failed', error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/pdf/motorcycle-agreement
// ═════════════════════════════════════════════════════════════════════════════
router.post('/motorcycle-agreement', protect, async (req, res) => {
  try {
    const { installmentId } = req.body;
    if (!installmentId) return res.status(400).json({ message: 'installmentId required' });

    const installment = await fetchInstallment(installmentId);
    if (!installment) return res.status(404).json({ message: 'Installment not found' });

    const data = buildData(installment);
    const html = motorcycleAgreementHTML(data);
    const pdf  = await generatePDF(html);

    sendPDF(res, pdf, `Motorcycle-Agreement-${data.customerName}-${Date.now()}.pdf`);
  } catch (err) {
    console.error('[PDF route] motorcycle-agreement:', err.message);
    res.status(500).json({ message: 'PDF generation failed', error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/pdf/car-agreement
// ═════════════════════════════════════════════════════════════════════════════
router.post('/car-agreement', protect, async (req, res) => {
  try {
    const { installmentId } = req.body;
    if (!installmentId) return res.status(400).json({ message: 'installmentId required' });

    const installment = await fetchInstallment(installmentId);
    if (!installment) return res.status(404).json({ message: 'Installment not found' });

    const data = buildData(installment);
    const html = carAgreementHTML(data);
    const pdf  = await generatePDF(html);

    sendPDF(res, pdf, `Car-Agreement-${data.customerName}-${Date.now()}.pdf`);
  } catch (err) {
    console.error('[PDF route] car-agreement:', err.message);
    res.status(500).json({ message: 'PDF generation failed', error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/pdf/sale-receipt
// ═════════════════════════════════════════════════════════════════════════════
router.post('/sale-receipt', protect, async (req, res) => {
  try {
    const { installmentId } = req.body;
    if (!installmentId) return res.status(400).json({ message: 'installmentId required' });

    const installment = await fetchInstallment(installmentId);
    if (!installment) return res.status(404).json({ message: 'Installment not found' });

    const customer = installment.customer || {};
    const cashPrice       = Math.round(installment.installmentPrice || 0);
    const registrationFee = Math.round(installment.registrationFee  || 0);
    const totalAmount     = cashPrice + registrationFee;

    const data = {
      customerName:    customer.fullName    || '',
      fatherName:      customer.fatherName  || '',
      cnicNumber:      customer.cnic        || '',
      address:         customer.address     || '',
      careOf:          customer.careOf      || '',
      mobile:          customer.phone       || '',
      serialNumber:    installment._id.toString().slice(-8).toUpperCase(),
      date:            new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }),
      cashPrice,
      registrationFee,
      totalAmount,
      bikeCompany:     installment.brand          || '',
      bikeModel:       installment.model          || '',
      bikeColor:       installment.color          || '',
      engineNumber:    installment.engineNumber   || '',
      chassisNumber:   installment.chassisNumber  || '',
      receivedCash:    Math.round(installment.advanceAmount   || 0),
      pendingCash:     Math.round(installment.remainingAmount || 0),
      totalRupees:     cashPrice,
    };

    const html = saleReceiptHTML(data);
    const pdf  = await generatePDF(html);

    sendPDF(res, pdf, `Sale-Receipt-${data.customerName}-${Date.now()}.pdf`);
  } catch (err) {
    console.error('[PDF route] sale-receipt:', err.message);
    res.status(500).json({ message: 'PDF generation failed', error: err.message });
  }
});

export default router;

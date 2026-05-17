import express from 'express';
import generatePDF from '../utils/generatePDF.js';
import {
  electronicsAgreementHTML,
  motorcycleAgreementHTML,
  carAgreementHTML,
  saleReceiptHTML,
  cashSaleReceiptHTML,
  customerStatementHTML,
  distributorLetterHTML,
} from '../utils/documentTemplates.js';
import Installment from '../models/Installment.js';
import Distributor from '../models/Distributor.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

const SCHEDULE_DAYS = { daily:1, weekly:7, '5-day':5, '10-day':10, monthly:30 };

const buildData = (installment) => {
  const customer   = installment.customer || {};
  const guarantors = customer.guarantors  || [];
  const mapG = (g) => g ? { fullName: g.fullName||'', fatherName:'', phone: g.phone||'' } : {};
  return {
    customerName:        customer.fullName        || '',
    fatherName:          customer.fatherName       || '',
    cnic:                customer.cnic             || '',
    phone:               customer.phone            || '',
    address:             customer.address          || '',
    khataNumber:         installment.khataNumber   || '',
    investorName:        installment.investorName  || '',
    accountNumber: installment._id.toString().slice(-6).toUpperCase(),
    date: new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }),
    installmentPrice:    installment.installmentPrice,
    advanceAmount:       installment.advanceAmount || 0,
    remainingAmount:     installment.remainingAmount,
    perInstallmentAmount: Math.round(installment.perInstallmentAmount || 0),
    totalInstallments:   installment.totalInstallments || '—',
    scheduleDay:         SCHEDULE_DAYS[installment.scheduleType] ?? 30,
    itemName:            `${installment.brand || ''} ${installment.model || ''}`.trim(),
    brand:               installment.brand            || '',
    model:               installment.model            || '',
    color:               installment.color            || '',
    engineNumber:        installment.engineNumber     || '—',
    chassisNumber:       installment.chassisNumber    || '—',
    registrationNumber:  installment.registrationNumber || '—',
    year:                installment.year             || '',
    bikeCompany: installment.brand  || '',
    bikeModel:   installment.model  || '',
    bikeColor:   installment.color  || '',
    carMake:  installment.brand  || '',
    carModel: installment.model  || '',
    carYear:  installment.year   || '',
    carColor: installment.color  || '',
    guarantor1: mapG(guarantors[0]),
    guarantor2: mapG(guarantors[1]),
  };
};

const sendPDF = (res, buf, filename) => {
  res.set({
    'Content-Type':        'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length':      buf.length,
  });
  res.send(buf);
};

const fetchInstallment = (id) =>
  Installment.findById(id).populate('customer').populate('paymentSchedule.collectedBy', 'name');

// ─── Electronics Agreement ───────────────────────────────────────────────────
router.post('/electronics-agreement', protect, async (req, res) => {
  try {
    const { installmentId } = req.body;
    if (!installmentId) return res.status(400).json({ message: 'installmentId required' });
    const inst = await fetchInstallment(installmentId);
    if (!inst) return res.status(404).json({ message: 'Not found' });
    const pdf = await generatePDF(electronicsAgreementHTML(buildData(inst)));
    sendPDF(res, pdf, `Electronics-Agreement-${inst.customer?.fullName}-${Date.now()}.pdf`);
  } catch (err) { res.status(500).json({ message: 'PDF failed', error: err.message }); }
});

// ─── Motorcycle Agreement ─────────────────────────────────────────────────────
router.post('/motorcycle-agreement', protect, async (req, res) => {
  try {
    const { installmentId } = req.body;
    if (!installmentId) return res.status(400).json({ message: 'installmentId required' });
    const inst = await fetchInstallment(installmentId);
    if (!inst) return res.status(404).json({ message: 'Not found' });
    const pdf = await generatePDF(motorcycleAgreementHTML(buildData(inst)));
    sendPDF(res, pdf, `Motorcycle-Agreement-${inst.customer?.fullName}-${Date.now()}.pdf`);
  } catch (err) { res.status(500).json({ message: 'PDF failed', error: err.message }); }
});

// ─── Car Agreement ────────────────────────────────────────────────────────────
router.post('/car-agreement', protect, async (req, res) => {
  try {
    const { installmentId } = req.body;
    if (!installmentId) return res.status(400).json({ message: 'installmentId required' });
    const inst = await fetchInstallment(installmentId);
    if (!inst) return res.status(404).json({ message: 'Not found' });
    const pdf = await generatePDF(carAgreementHTML(buildData(inst)));
    sendPDF(res, pdf, `Car-Agreement-${inst.customer?.fullName}-${Date.now()}.pdf`);
  } catch (err) { res.status(500).json({ message: 'PDF failed', error: err.message }); }
});

// ─── Sale Receipt (legacy / cash sale) ───────────────────────────────────────
router.post('/sale-receipt', protect, async (req, res) => {
  try {
    const { installmentId } = req.body;
    if (!installmentId) return res.status(400).json({ message: 'installmentId required' });
    const inst = await fetchInstallment(installmentId);
    if (!inst) return res.status(404).json({ message: 'Not found' });
    const customer = inst.customer || {};
    const cashPrice = Math.round(inst.installmentPrice || 0);
    const registrationFee = Math.round(inst.registrationFee || 0);
    const data = {
      customerName: customer.fullName || '', fatherName: customer.fatherName || '',
      cnicNumber: customer.cnic || '', address: customer.address || '',
      mobile: customer.phone || '',
      serialNumber: inst._id.toString().slice(-8).toUpperCase(),
      date: new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }),
      cashPrice, registrationFee, totalAmount: cashPrice + registrationFee,
      bikeCompany: inst.brand || '', bikeModel: inst.model || '', bikeColor: inst.color || '',
      engineNumber: inst.engineNumber || '', chassisNumber: inst.chassisNumber || '',
      receivedCash: Math.round(inst.advanceAmount || 0),
      pendingCash: Math.round(inst.remainingAmount || 0),
      totalRupees: cashPrice,
    };
    const pdf = await generatePDF(saleReceiptHTML(data));
    sendPDF(res, pdf, `Sale-Receipt-${customer.fullName}-${Date.now()}.pdf`);
  } catch (err) { res.status(500).json({ message: 'PDF failed', error: err.message }); }
});

// ─── Cash Sale Receipt ────────────────────────────────────────────────────────
router.post('/cash-sale-receipt', protect, async (req, res) => {
  try {
    const { installmentId, isOwnerCopy = false } = req.body;
    if (!installmentId) return res.status(400).json({ message: 'installmentId required' });
    const inst = await fetchInstallment(installmentId);
    if (!inst) return res.status(404).json({ message: 'Not found' });
    const customer = inst.customer || {};
    const data = {
      ...buildData(inst),
      cnic: customer.cnic || '',
      phone: customer.phone || '',
      serialNumber: inst._id.toString().slice(-8).toUpperCase(),
      registrationFee: inst.registrationFee || 0,
      isOwnerCopy,
    };
    const pdf = await generatePDF(cashSaleReceiptHTML(data));
    sendPDF(res, pdf, `Cash-Sale-${customer.fullName}-${Date.now()}.pdf`);
  } catch (err) { res.status(500).json({ message: 'PDF failed', error: err.message }); }
});

// ─── Customer Statement / Khata ───────────────────────────────────────────────
router.post('/customer-statement', protect, async (req, res) => {
  try {
    const { installmentId } = req.body;
    if (!installmentId) return res.status(400).json({ message: 'installmentId required' });
    const inst = await fetchInstallment(installmentId);
    if (!inst) return res.status(404).json({ message: 'Not found' });

    const customer = inst.customer || {};
    const schedule = [...(inst.paymentSchedule || [])].sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
    );
    const perQ = inst.perInstallmentAmount || 0;
    const totalPaid   = schedule.filter(s=>s.status==='paid').reduce((sum,s)=>sum+(s.paidAmount||perQ),0);
    const totalMissed = schedule.filter(s=>s.status==='missed').reduce((sum,_)=>sum+perQ,0);
    const totalPending= schedule.filter(s=>s.status==='pending').reduce((sum,_)=>sum+perQ,0);

    const data = {
      customerName: customer.fullName || '', fatherName: customer.fatherName || '',
      cnic: customer.cnic || '', phone: customer.phone || '', address: customer.address || '',
      khataNumber: inst.khataNumber || '',
      date: new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
      brand: inst.brand||'', model: inst.model||'', color: inst.color||'',
      engineNumber: inst.engineNumber||'', chassisNumber: inst.chassisNumber||'',
      installmentPrice: inst.installmentPrice, advanceAmount: inst.advanceAmount||0,
      perInstallmentAmount: perQ, scheduleType: inst.scheduleType||'',
      investorName: inst.investorName||'',
      schedule,
      summary: { totalPaid, totalMissed, totalPending, arrears: totalMissed },
    };
    const pdf = await generatePDF(customerStatementHTML(data));
    sendPDF(res, pdf, `Statement-${customer.fullName}-${Date.now()}.pdf`);
  } catch (err) { res.status(500).json({ message: 'PDF failed', error: err.message }); }
});

// ─── Distributor Letter (Return / Purchase) ───────────────────────────────────
router.post('/distributor-letter', protect, async (req, res) => {
  try {
    const { distributorId, itemId, letterType = 'purchase' } = req.body;
    const distributor = await Distributor.findById(distributorId);
    if (!distributor) return res.status(404).json({ message: 'Distributor not found' });

    const item = distributor.suppliedItems.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found in distributor record' });

    const data = {
      distributorName: distributor.name,
      distributorAddress: distributor.address || '',
      brand: item.brand || item.make || '',
      model: item.model || '',
      color: item.color || '',
      engineNumber: item.engineNumber || '',
      chassisNumber: item.chassisNumber || '',
      dateSupplied: item.dateSupplied,
      unitPrice: item.unitPrice || 0,
      date: new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
      letterType,
      ownerName: 'Naseeb',
    };
    const pdf = await generatePDF(distributorLetterHTML(data));
    sendPDF(res, pdf, `Distributor-${letterType}-${distributor.name}-${Date.now()}.pdf`);
  } catch (err) { res.status(500).json({ message: 'PDF failed', error: err.message }); }
});

export default router;

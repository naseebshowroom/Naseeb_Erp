import Distributor from '../models/Distributor.js';
import DistributorOutstanding from '../models/DistributorOutstanding.js';

// ─── GET ALL ─────────────────────────────────────────────────
export const getDistributors = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { phone:       { $regex: search, $options: 'i' } },
      ];
    }

    const distributors = await Distributor.find(query).sort({ createdAt: -1 }).lean();

    // For each distributor, attach their current outstanding balance
    const enriched = await Promise.all(distributors.map(async (d) => {
      const outstanding = await DistributorOutstanding.aggregate([
        { $match: { distributor: d._id } },
        { $group: { _id: null, totalBalance: { $sum: '$balance' }, totalSupplied: { $sum: '$totalAmount' }, totalPaid: { $sum: '$amountPaid' } } }
      ]);
      const fin = outstanding[0] || { totalBalance: 0, totalSupplied: 0, totalPaid: 0 };
      return {
        ...d,
        balance:        fin.totalBalance,
        totalSupplied:  fin.totalSupplied,
        totalPaid:      fin.totalPaid,
      };
    }));

    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─── GET STATS (for summary cards) ──────────────────────────
export const getDistributorStats = async (req, res) => {
  try {
    const totalDistributors = await Distributor.countDocuments();
    const balanceSummary = await DistributorOutstanding.aggregate([
      { $group: { _id: null, totalOwed: { $sum: '$balance' }, totalSupplied: { $sum: '$totalAmount' } } }
    ]);
    const { totalOwed = 0, totalSupplied = 0 } = balanceSummary[0] || {};
    res.status(200).json({ success: true, data: { totalDistributors, totalOwed, totalSupplied } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─── GET ONE ─────────────────────────────────────────────────
export const getDistributorById = async (req, res) => {
  try {
    const distributor = await Distributor.findById(req.params.id).lean();
    if (!distributor) return res.status(404).json({ success: false, message: 'Distributor not found' });

    const outstandings = await DistributorOutstanding.find({ distributor: req.params.id }).sort({ createdAt: -1 }).lean();

    const totals = outstandings.reduce((acc, o) => ({
      totalSupplied: acc.totalSupplied + o.totalAmount,
      totalPaid:     acc.totalPaid     + o.amountPaid,
      balance:       acc.balance       + o.balance,
    }), { totalSupplied: 0, totalPaid: 0, balance: 0 });

    // Flatten all payment log entries from every invoice into one list
    const paymentHistory = outstandings
      .flatMap(o => (o.payments || []).map(p => ({
        amount:      p.amount,
        paymentDate: p.paymentDate,
        notes:       p.notes,
        recordedAt:  p.recordedAt,
      })))
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    res.status(200).json({
      success: true,
      data: {
        ...distributor,
        financials:     totals,
        supplyHistory:  outstandings,
        paymentHistory,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─── CREATE ──────────────────────────────────────────────────
export const createDistributor = async (req, res) => {
  try {
    const { name, companyName, phone, address, cnic, notes } = req.body;
    if (!name || !companyName || !phone) {
      return res.status(400).json({ success: false, message: 'Name, company, and phone are required.' });
    }
    const distributor = await Distributor.create({ name, companyName, phone, address, cnic, notes });
    res.status(201).json({ success: true, data: distributor });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error creating distributor', error: error.message });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────
export const updateDistributor = async (req, res) => {
  try {
    const distributor = await Distributor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!distributor) return res.status(404).json({ success: false, message: 'Distributor not found' });
    res.status(200).json({ success: true, data: distributor });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating distributor', error: error.message });
  }
};

// ─── RECORD A SUPPLY / INVOICE ───────────────────────────────
export const recordSupply = async (req, res) => {
  try {
    const { items } = req.body; // [{ description, quantity, unitPrice }]
    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Items are required.' });
    }
    const processedItems = items.map(i => ({
      description: i.description,
      quantity:    Number(i.quantity),
      unitPrice:   Number(i.unitPrice),
      totalPrice:  Number(i.quantity) * Number(i.unitPrice),
    }));
    const record = await DistributorOutstanding.create({ distributor: req.params.id, items: processedItems });
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error recording supply', error: error.message });
  }
};

// ─── RECORD A PAYMENT TO DISTRIBUTOR ────────────────────────
export const recordPayment = async (req, res) => {
  try {
    const { amount, outstandingId, paymentDate, notes } = req.body;
    const paidAmount = Number(amount);
    if (!paidAmount || paidAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
    }

    let record;
    if (outstandingId) {
      record = await DistributorOutstanding.findById(outstandingId);
    } else {
      // Pay against the oldest unpaid invoice
      record = await DistributorOutstanding.findOne({
        distributor: req.params.id,
        status: { $in: ['pending', 'partial'] }
      }).sort({ createdAt: 1 });
    }

    if (!record) return res.status(404).json({ success: false, message: 'No outstanding invoice found.' });

    // Accumulate amountPaid
    record.amountPaid = Math.min(record.totalAmount, record.amountPaid + paidAmount);

    // Push to payment log
    record.payments.push({
      amount:      paidAmount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes:       notes || '',
      recordedAt:  new Date(),
    });

    await record.save();

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error recording payment', error: error.message });
  }
};
// ─── ADD A SUPPLIED ITEM (individual unit) ───────────────────
export const addSuppliedItem = async (req, res) => {
  try {
    const distributor = await Distributor.findById(req.params.id);
    if (!distributor) return res.status(404).json({ success: false, message: 'Distributor not found' });

    const { brand, make, model, chassisNumber, engineNumber, color, dateSupplied, quantity, unitPrice } = req.body;
    if (!model || !unitPrice) {
      return res.status(400).json({ success: false, message: 'model and unitPrice are required' });
    }

    distributor.suppliedItems.push({
      brand, make, model, chassisNumber, engineNumber, color,
      dateSupplied: dateSupplied ? new Date(dateSupplied) : new Date(),
      quantity: Number(quantity) || 1,
      unitPrice: Number(unitPrice),
      status: 'In-Stock',
    });

    await distributor.save();
    res.status(201).json({ success: true, data: distributor });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error adding item', error: error.message });
  }
};

// ─── UPDATE SUPPLIED ITEM STATUS ─────────────────────────────
export const updateSuppliedItemStatus = async (req, res) => {
  try {
    const distributor = await Distributor.findById(req.params.id);
    if (!distributor) return res.status(404).json({ success: false, message: 'Distributor not found' });

    const item = distributor.suppliedItems.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const { status, assignedToInstallment } = req.body;
    if (status) item.status = status;
    if (assignedToInstallment) item.assignedToInstallment = assignedToInstallment;

    await distributor.save();
    res.status(200).json({ success: true, data: distributor });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating item', error: error.message });
  }
};

// ─── DELETE SUPPLIED ITEM ─────────────────────────────────────
export const deleteSuppliedItem = async (req, res) => {
  try {
    const distributor = await Distributor.findById(req.params.id);
    if (!distributor) return res.status(404).json({ success: false, message: 'Distributor not found' });

    distributor.suppliedItems.pull({ _id: req.params.itemId });
    await distributor.save();
    res.status(200).json({ success: true, message: 'Item removed' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error deleting item', error: error.message });
  }
};

// ─── DELETE DISTRIBUTOR ──────────────────────────────────────────
export const deleteDistributor = async (req, res) => {
  try {
    const distributor = await Distributor.findByIdAndDelete(req.params.id);
    if (!distributor) return res.status(404).json({ success: false, message: 'Distributor not found' });
    res.status(200).json({ success: true, message: 'Distributor deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error deleting distributor', error: error.message });
  }
};

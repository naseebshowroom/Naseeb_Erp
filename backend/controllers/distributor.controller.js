import Distributor from '../models/Distributor.js';
import DistributorOutstanding from '../models/DistributorOutstanding.js';
import Inventory from '../models/Inventory.js';

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
        {
          $addFields: {
            liveBalance: { $max: [{ $subtract: ['$totalAmount', '$amountPaid'] }, 0] },
          },
        },
        {
          $group: {
            _id: null,
            totalBalance:  { $sum: '$liveBalance' },
            totalSupplied: { $sum: '$totalAmount' },
            totalPaid:     { $sum: '$amountPaid' },
          },
        },
      ]);
      const fin = outstanding[0] || { totalBalance: 0, totalSupplied: 0, totalPaid: 0 };
      return {
        ...d,
        balance:       fin.totalBalance,
        totalSupplied: fin.totalSupplied,
        totalPaid:     fin.totalPaid,
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

    // Get all valid distributor IDs to avoid orphaned outstanding records
    // (records from deleted/replaced distributors that inflate the totals)
    const validDistributorIds = await Distributor.distinct('_id');

    // Only aggregate outstanding records linked to currently existing distributors
    const balanceSummary = await DistributorOutstanding.aggregate([
      {
        $match: { distributor: { $in: validDistributorIds } },
      },
      {
        $addFields: {
          liveBalance: { $max: [{ $subtract: ['$totalAmount', '$amountPaid'] }, 0] },
        },
      },
      {
        $group: {
          _id: null,
          totalOwed:     { $sum: '$liveBalance' },
          totalSupplied: { $sum: '$totalAmount' },
        },
      },
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

// ─── CREATE ────────────────────────────────────────
export const createDistributor = async (req, res) => {
  try {
    const { name, companyName, phone, address, cnic, notes, category } = req.body;

    // BUG 6 FIX: Validate all required fields including category.
    // Old code only checked name/companyName/phone — missing category caused
    // a Mongoose ValidationError (silent 400 with no useful message to the UI).
    const VALID_CATEGORIES = ['motorcycle', 'electronics', 'car', 'other'];
    if (!name || !companyName || !phone) {
      return res.status(400).json({ success: false, message: 'Naam, company aur phone zaroori hain.' });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Category chunna zaroori hai (motorcycle, electronics, car, ya other).' });
    }

    const distributor = await Distributor.create({ name, companyName, phone, address, cnic, notes, category });
    res.status(201).json({ success: true, data: distributor });
  } catch (error) {
    // BUG 6 FIX: Handle duplicate-key error (E11000) with a clear message.
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Is phone number ka distributor pehle se maujood hai.' });
    }
    // Surface the real Mongoose validation message so the frontend toast shows it
    console.error('Create distributor error:', error);
    res.status(400).json({ success: false, message: error.message || 'Distributor banana nahi ho saka.' });
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

    // Cascade-delete all outstanding invoice records for this distributor.
    // Without this, orphaned records stay in the DB and inflate the summary card totals.
    await DistributorOutstanding.deleteMany({ distributor: req.params.id });

    res.status(200).json({ success: true, message: 'Distributor deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error deleting distributor', error: error.message });
  }
};
// ─── DISTRIBUTOR STOCK REPORT ────────────────────────────────
// Returns per-status breakdown of all inventory items linked to this distributor
export const getDistributorStockReport = async (req, res) => {
  try {
    const { id } = req.params;

    const stockItems = await Inventory.find({ distributor: id })
      .select('company model category color status purchaseType purchasePrice engineNo chassisNo serialNo createdAt')
      .lean();

    const stats = {
      totalItemsBought:   stockItems.length,
      availableInShop:    stockItems.filter(i => i.status === 'available').length,
      soldOnCash:         stockItems.filter(i => i.status === 'sold_cash').length,
      onInstallment:      stockItems.filter(i => i.status === 'on_installment').length,
      activeInMarket:     stockItems.filter(i => i.status === 'market_installment').length,
      returnedItems:      stockItems.filter(i => i.status === 'returned_to_supplier').length,
      cashPurchases:      stockItems.filter(i => i.purchaseType === 'cash').length,
      creditPurchases:    stockItems.filter(i => i.purchaseType === 'credit').length,
      totalPurchaseValue: stockItems.reduce((sum, i) => sum + (i.purchasePrice || 0), 0),
    };

    res.status(200).json({ success: true, stats, items: stockItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

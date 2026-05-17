import Installment from '../models/Installment.js';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import DistributorOutstanding from '../models/DistributorOutstanding.js';
import Distributor from '../models/Distributor.js';

// ─── Helper ───────────────────────────────────────────────────
const monthName = (m) =>
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];

// ─── GET FULL FINANCIAL SUMMARY ──────────────────────────────
// @route GET /api/reports/financial
export const getFinancialSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));

    // Total investment (sum of purchasePrice across all non-deleted installments)
    const investAgg = await Installment.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$purchasePrice' } } }
    ]);
    const investment = investAgg[0]?.total || 0;

    // Total installment sale value (saleValue = installmentPrice)
    const saleAgg = await Installment.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$installmentPrice' } } }
    ]);
    const saleValue = saleAgg[0]?.total || 0;

    // Total recovered (sum of all monthly payments + all advance amounts)
    const payFilter = {};
    if (from || to) payFilter.paymentDate = dateFilter;
    const recoveredAgg = await Payment.aggregate([
      ...(Object.keys(payFilter).length ? [{ $match: payFilter }] : []),
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyPaid = recoveredAgg[0]?.total || 0;

    const advanceAgg = await Installment.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$advanceAmount' } } }
    ]);
    const advancePaid = advanceAgg[0]?.total || 0;

    const recovered = monthlyPaid + advancePaid;

    // Outstanding = total remaining across active installments
    const outstandingAgg = await Installment.aggregate([
      { $match: { isDeleted: false, status: { $ne: 'completed' } } },
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
    ]);
    const outstanding = outstandingAgg[0]?.total || 0;

    // Total counts
    const totalInstallments = await Installment.countDocuments({ isDeleted: false });
    const activeInstallments = await Installment.countDocuments({ isDeleted: false, status: 'active' });
    const completedInstallments = await Installment.countDocuments({ isDeleted: false, status: 'completed' });
    const overdueInstallments = await Installment.countDocuments({ isDeleted: false, status: { $in: ['active', 'near_completion'] } });

    res.status(200).json({
      success: true,
      data: {
        investment,
        saleValue,
        recovered,
        outstanding,
        netProfit: saleValue - investment,
        counts: { total: totalInstallments, active: activeInstallments, completed: completedInstallments, overdue: overdueInstallments }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─── GET MONTHLY COLLECTION DATA ─────────────────────────────
// @route GET /api/reports/monthly
export const getMonthlyReport = async (req, res) => {
  try {
    const months = 6;
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1;
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59, 999);

      const collectedAgg = await Payment.aggregate([
        { $match: { paymentDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      // Expected = count of schedule entries due that month
      const dueAgg = await Installment.aggregate([
        { $match: { isDeleted: false } },
        { $unwind: '$paymentSchedule' },
        { $match: { 'paymentSchedule.dueDate': { $gte: start, $lte: end } } },
        { $group: { _id: null, totalAmount: { $sum: '$perInstallmentAmount' }, count: { $sum: 1 } } }
      ]);

      const collected = collectedAgg[0]?.total || 0;
      const due       = dueAgg[0]?.totalAmount  || 0;
      const rate      = due > 0 ? Math.round((collected / due) * 100) : 0;

      result.push({ name: `${monthName(month)} ${year}`, collected, due, rate });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─── GET CATEGORY BREAKDOWN ──────────────────────────────────
// @route GET /api/reports/category
export const getCategoryBreakdown = async (req, res) => {
  try {
    const agg = await Installment.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$category',
          count:       { $sum: 1 },
          investment:  { $sum: '$purchasePrice' },
          saleValue:   { $sum: '$installmentPrice' },
          recovered:   { $sum: { $add: ['$totalPaid', '$advanceAmount'] } },
          outstanding: { $sum: '$remainingAmount' },
        }
      },
      { $sort: { count: -1 } }
    ]);

    const total = agg.reduce((s, c) => s + c.count, 0) || 1;
    const data  = agg.map(c => ({
      name:        c._id,
      value:       Math.round((c.count / total) * 100),
      count:       c.count,
      investment:  c.investment,
      saleValue:   c.saleValue,
      recovered:   c.recovered,
      outstanding: c.outstanding,
      profit:      c.saleValue - c.investment,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─── GET OVERDUE ACCOUNTS ────────────────────────────────────
// @route GET /api/reports/overdue
export const getOverdueReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const overdue = await Installment.aggregate([
      { $match: { isDeleted: false, status: { $ne: 'completed' } } },
      { $unwind: '$paymentSchedule' },
      {
        $match: {
          'paymentSchedule.status':  'pending',
          'paymentSchedule.dueDate': { $lt: today }
        }
      },
      {
        $group: {
          _id: '$_id',
          customer:             { $first: '$customer' },
          category:             { $first: '$category' },
          brand:                { $first: '$brand' },
          model:                { $first: '$model' },
          perInstallmentAmount: { $first: '$perInstallmentAmount' },
          overdueCount:         { $sum: 1 },
          oldestDue:            { $min: '$paymentSchedule.dueDate' },
        }
      },
      {
        $addFields: {
          overdueAmount: { $multiply: ['$overdueCount', '$perInstallmentAmount'] },
          daysLate: {
            $floor: {
              $divide: [
                { $subtract: [today, '$oldestDue'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      { $sort: { daysLate: -1 } },
      { $limit: 50 }
    ]);

    await Customer.populate(overdue, { path: 'customer', select: 'fullName cnic phone' });

    res.status(200).json({ success: true, count: overdue.length, data: overdue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─── GET DISTRIBUTOR PAYABLES ─────────────────────────────────
// @route GET /api/reports/distributors
export const getDistributorPayables = async (req, res) => {
  try {
    const dist = await Distributor.find({});
    const enriched = await Promise.all(dist.map(async (d) => {
      const agg = await DistributorOutstanding.aggregate([
        { $match: { distributor: d._id } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, paid: { $sum: '$amountPaid' }, balance: { $sum: '$balance' } } }
      ]);
      const fin = agg[0] || { total: 0, paid: 0, balance: 0 };
      return { _id: d._id, name: d.name, companyName: d.companyName, ...fin };
    }));

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─── EXPORT REPORTS ─────────────────────────────────────────────
// @route GET /api/reports/export
export const exportReport = async (req, res) => {
  try {
    const { format } = req.query; // 'csv' or 'pdf'
    
    // Simplistic export handling for now
    if (format === 'csv') {
      const data = "Date,Amount\n2026-05-01,5000\n2026-05-02,7000";
      res.header('Content-Type', 'text/csv');
      res.attachment('report.csv');
      return res.send(data);
    } else if (format === 'pdf') {
      res.header('Content-Type', 'application/pdf');
      res.attachment('report.pdf');
      return res.send(Buffer.from([])); // Empty buffer placeholder
    }
    
    res.status(400).json({ success: false, message: 'Invalid format' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


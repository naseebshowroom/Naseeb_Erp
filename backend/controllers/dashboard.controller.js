import Installment from '../models/Installment.js';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const activeInstallmentsCount = await Installment.countDocuments({ status: 'active' });
    
    // Total outstanding across all active installments
    const activeInstallments = await Installment.find({ status: 'active' });
    const totalOutstanding = activeInstallments.reduce((acc, curr) => acc + (curr.remainingAmount || 0), 0);

    // Collected today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const todaysPayments = await Payment.find({
      paymentDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'completed'
    });
    const collectedToday = todaysPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Overdue accounts (simplified: active installments where nextPaymentDate is before today)
    const overdueCount = await Installment.countDocuments({
      status: 'active',
      nextPaymentDate: { $lt: startOfDay }
    });

    res.json({
      success: true,
      data: {
        totalOutstanding,
        collectedToday,
        overdueCount,
        activeInstallments: activeInstallmentsCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get dashboard stock overview
// @route   GET /api/dashboard/stock-overview
// @access  Private
export const getStockOverview = async (req, res) => {
  try {
    const categories = ['electronics', 'motorcycle', 'car'];
    const overview = await Promise.all(categories.map(async (category) => {
      const active = await Installment.countDocuments({ category, status: 'active' });
      const completed = await Installment.countDocuments({ category, status: 'completed' });
      return { category, active, completed, total: active + completed };
    }));

    res.json({ success: true, data: overview });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get recent activity (latest payments)
// @route   GET /api/activity/recent
// @access  Private
export const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const recentPayments = await Payment.find({ status: 'completed' })
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(limit)
      .populate('customer', 'fullName phone')
      .populate('installment', 'brand model category');
      
    res.json({ success: true, data: recentPayments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get payments calendar for a specific month
// @route   GET /api/payments/calendar?month=X&year=Y
// @access  Private
export const getPaymentCalendar = async (req, res) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    if (isNaN(month) || isNaN(year)) {
      return res.status(400).json({ success: false, message: 'Valid month (1-12) and year required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const payments = await Payment.find({
      paymentDate: { $gte: startDate, $lte: endDate },
      status: 'completed'
    });

    // Group by day
    const days = {};
    payments.forEach(payment => {
      const day = new Date(payment.paymentDate).getDate();
      if (!days[day]) {
        days[day] = { day, totalAmount: 0, count: 0, status: 'paid' }; // simplified status
      }
      days[day].totalAmount += payment.amount;
      days[day].count += 1;
    });

    res.json({ success: true, data: Object.values(days) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


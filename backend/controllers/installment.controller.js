import Installment from '../models/Installment.js';
import Customer from '../models/Customer.js';
import { generatePaymentSchedule } from '../utils/schedule.js';

// @desc    Get all installments
// @route   GET /api/installments
// @access  Private
export const getInstallments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = {};
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    // Populate customer to allow searching by customer name (handled in frontend usually, or needs aggregation for backend search)
    const total = await Installment.countDocuments(query);
    const installments = await Installment.find(query)
      .populate('customer', 'fullName cnic phone')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: installments.length,
      total,
      pagination: { page, limit, pages: Math.ceil(total / limit) },
      data: installments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get single installment
// @route   GET /api/installments/:id
// @access  Private
export const getInstallmentById = async (req, res) => {
  try {
    const installment = await Installment.findById(req.params.id)
      .populate('customer')
      .populate('distributor', 'name company');

    if (!installment) {
      return res.status(404).json({ success: false, message: 'Installment not found' });
    }

    res.status(200).json({ success: true, data: installment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Create new installment
// @route   POST /api/installments
// @access  Private
export const createInstallment = async (req, res) => {
  try {
    const {
      customer, category, totalInstallments, scheduleType, startDate, 
      advanceAmount, installmentPrice // Need to destructure these to ensure schedule generates correctly
    } = req.body;

    // 1. Verify customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // 2. Generate Payment Schedule
    const paymentSchedule = generatePaymentSchedule(startDate, totalInstallments, scheduleType);

    // 3. Create Installment record
    const installmentData = {
      ...req.body,
      paymentSchedule,
      createdBy: req.user.id
    };

    const installment = await Installment.create(installmentData);

    // TODO: Update Distributor stock here if applicable

    // 4. Update Customer record (just an architectural consideration, normally we'd just query installments where customer=id)

    res.status(201).json({ success: true, data: installment });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Validation Error', error: error.message });
  }
};

// @desc    Update installment (non-financial)
// @route   PUT /api/installments/:id
// @access  Private
export const updateInstallment = async (req, res) => {
  try {
    // Prevent updating critical financial/schedule fields directly through this endpoint
    const { purchasePrice, installmentPrice, advanceAmount, totalInstallments, paymentSchedule, ...updateData } = req.body;

    const installment = await Installment.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!installment) {
      return res.status(404).json({ success: false, message: 'Installment not found' });
    }

    res.status(200).json({ success: true, data: installment });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Validation Error', error: error.message });
  }
};

// @desc    Soft delete installment
// @route   DELETE /api/installments/:id
// @access  Private (Owner/Manager only)
export const deleteInstallment = async (req, res) => {
  try {
    const installment = await Installment.findById(req.params.id);

    if (!installment) {
      return res.status(404).json({ success: false, message: 'Installment not found' });
    }

    installment.isDeleted = true;
    await installment.save();

    res.status(200).json({ success: true, message: 'Installment successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get dashboard summary stats
// @route   GET /api/installments/stats/summary
// @access  Private
export const getSummaryStats = async (req, res) => {
  try {
    // Aggregation for performance
    const stats = await Installment.aggregate([
      { $match: { isDeleted: false } },
      { 
        $group: {
          _id: null,
          totalActive: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          totalCompleted: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          totalNearCompletion: { $sum: { $cond: [{ $eq: ["$status", "near_completion"] }, 1, 0] } },
          totalExpectedRevenue: { $sum: "$installmentPrice" },
          totalCollected: { $sum: { $add: ["$advanceAmount", "$totalPaid"] } },
          totalOutstanding: { $sum: { $subtract: ["$remainingAmount", "$totalPaid"] } },
          totalProfitExpected: { $sum: "$profitMargin" }
        }
      }
    ]);

    // Format if no records
    const result = stats[0] || {
      totalActive: 0, totalCompleted: 0, totalNearCompletion: 0,
      totalExpectedRevenue: 0, totalCollected: 0, totalOutstanding: 0, totalProfitExpected: 0
    };

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all overdue installments
// @route   GET /api/installments/overdue
// @access  Private
export const getOverdueInstallments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueInstallments = await Installment.aggregate([
      { $match: { isDeleted: false, status: { $ne: 'completed' } } },
      // Unwind schedule to check individual dates
      { $unwind: "$paymentSchedule" },
      // Match pending schedules that are past today
      { 
        $match: { 
          "paymentSchedule.status": "pending",
          "paymentSchedule.dueDate": { $lt: today }
        } 
      },
      // Calculate days overdue
      {
        $addFields: {
          daysOverdue: {
            $floor: {
              $divide: [
                { $subtract: [today, "$paymentSchedule.dueDate"] },
                1000 * 60 * 60 * 24 // ms to days
              ]
            }
          }
        }
      },
      { $sort: { daysOverdue: -1 } }, // Worst offenders first
      // Group back or return as flat list. Returning flat list of overdue schedules with parent info:
      {
        $project: {
          customer: 1,
          category: 1,
          brand: 1,
          model: 1,
          perInstallmentAmount: 1,
          paymentSchedule: 1,
          daysOverdue: 1
        }
      }
    ]);

    // Populate customer details (aggregation doesn't populate automatically)
    await Customer.populate(overdueInstallments, { path: 'customer', select: 'fullName cnic phone' });

    res.status(200).json({ success: true, count: overdueInstallments.length, data: overdueInstallments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get consolidated Vasooli (Due) list
// @route   GET /api/installments/vasooli
// @access  Private
export const getVasooliList = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));

    const installments = await Installment.aggregate([
      { $match: { isDeleted: false, status: { $ne: 'completed' } } },
      {
        $addFields: {
          pastAndTodaySchedules: {
            $filter: {
              input: "$paymentSchedule",
              as: "slot",
              cond: { $lte: ["$$slot.dueDate", endOfToday] }
            }
          },
          todaySchedules: {
            $filter: {
              input: "$paymentSchedule",
              as: "slot",
              cond: {
                $and: [
                  { $gte: ["$$slot.dueDate", startOfToday] },
                  { $lte: ["$$slot.dueDate", endOfToday] }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          expectedUpToToday: { $multiply: [{ $size: "$pastAndTodaySchedules" }, "$perInstallmentAmount"] },
          isDueToday: { $gt: [{ $size: "$todaySchedules" }, 0] }
        }
      },
      {
        $addFields: {
          cumulativeDue: { $subtract: ["$expectedUpToToday", "$totalPaid"] }
        }
      },
      // Keep only those who owe money
      { $match: { cumulativeDue: { $gt: 0 } } },
      {
        $project: {
          customer: 1, category: 1, brand: 1, model: 1,
          perInstallmentAmount: 1, remainingAmount: 1, totalPaid: 1,
          cumulativeDue: 1, isDueToday: 1,
          daysOverdue: {
            $floor: {
              $divide: [
                "$cumulativeDue",
                "$perInstallmentAmount"
              ]
            }
          }
        }
      },
      { $sort: { cumulativeDue: -1 } }
    ]);

    await Customer.populate(installments, { path: 'customer', select: 'fullName cnic phone' });

    res.status(200).json({ success: true, count: installments.length, data: installments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * Status Auto-Update Helper (To be called from Payment controller later)
 * When a payment is made, this recalculates totals and updates status.
 */
export const updateInstallmentStatusAfterPayment = async (installmentId) => {
  const installment = await Installment.findById(installmentId);
  if (!installment) return;

  const paidCount = installment.paymentSchedule.filter(p => p.status === 'paid').length;
  const missedCount = installment.paymentSchedule.filter(p => p.status === 'missed').length;
  const remainingCount = installment.totalInstallments - paidCount;

  installment.installmentsPaid = paidCount;
  
  if (remainingCount === 0) {
    installment.status = 'completed';
  } else if (remainingCount <= 3) {
    installment.status = 'near_completion';
  } else {
    installment.status = 'active'; // Default
  }

  await installment.save();
};

import Installment from '../models/Installment.js';
import Customer from '../models/Customer.js';
import Asset from '../models/Asset.js';
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
    if (req.query.customer) {
      query.customer = req.query.customer;
    }

    const total = await Installment.countDocuments(query);
    const installments = await Installment.find(query)
      .populate('customer', 'fullName cnic phone khataNumber')
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
      .populate('distributor', 'name companyName')
      .populate('assetId')
      .populate('paymentSchedule.collectedBy', 'name');

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
    let { customer, distributor, ...rest } = req.body;

    // If customer is an object (inline creation from wizard), create or find customer
    if (customer && typeof customer === 'object' && !customer._id) {
      // Try to find by CNIC only if provided
      let existingCustomer = null;
      if (customer.cnic) {
        existingCustomer = await Customer.findOne({ cnic: customer.cnic });
      }
      if (existingCustomer) {
        customer = existingCustomer._id;
      } else {
        const newCustomer = await Customer.create({
          fullName:    customer.fullName,
          fatherName:  customer.fatherName,
          ...(customer.cnic ? { cnic: customer.cnic } : {}),
          phone:       customer.phone,
          city:        customer.city,
          address:     customer.address,
          khataNumber: customer.khataNumber,
          guarantors:  [],
          createdBy:   req.user.id,
        });
        customer = newCustomer._id;
      }
    }

    // Verify customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: 'Gahak nahi mila' });
    }

    const isValidObjectId = (v) => v && /^[a-f\d]{24}$/i.test(String(v));

    // Generate Payment Schedule only if NOT a cash sale and totalInstallments is provided
    let paymentSchedule = [];
    const { totalInstallments, scheduleType, startDate, isCashSale } = rest;
    if (!isCashSale && totalInstallments && scheduleType && startDate) {
      paymentSchedule = generatePaymentSchedule(startDate, totalInstallments, scheduleType);
    }

    const installmentData = {
      ...rest,
      customer,
      paymentSchedule,
      createdBy: req.user.id,
      ...(isValidObjectId(distributor) ? { distributor } : {}),
    };

    const installment = await Installment.create(installmentData);

    // Auto-link to Asset if chassisNumber or engineNumber provided (and not cash sale)
    if (!isCashSale && (rest.chassisNumber || rest.engineNumber) && rest.assetId) {
      // assetId was passed explicitly (user chose existing asset from wizard)
      await Asset.findByIdAndUpdate(rest.assetId, {
        $push: {
          linkedInstallments: installment._id,
          history: {
            event: installment.assetId ? 're-issued' : 'sold-installment',
            date: new Date(),
            installmentId: installment._id,
            customerId: customer,
            recordedBy: req.user.id
          }
        },
        currentStatus: 'on-installment',
        'currentHolder.holderType': 'customer',
        'currentHolder.customerId': customer
      });
    }

    res.status(201).json({ success: true, data: installment });
  } catch (error) {
    console.error('[createInstallment]', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(' | '), error: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate entry detected', error: error.message });
    }
    res.status(400).json({ success: false, message: 'Validation Error', error: error.message });
  }
};

// @desc    Update installment (non-financial)
// @route   PUT /api/installments/:id
// @access  Private
export const updateInstallment = async (req, res) => {
  try {
    const { paymentSchedule, ...updateData } = req.body;

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
    const stats = await Installment.aggregate([
      { $match: { isDeleted: false } },
      { 
        $group: {
          _id: null,
          totalActive: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalCompleted: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalNearCompletion: { $sum: { $cond: [{ $eq: ['$status', 'near_completion'] }, 1, 0] } },
          totalExpectedRevenue: { $sum: '$installmentPrice' },
          totalCollected: { $sum: { $add: ['$advanceAmount', '$totalPaid'] } },
          totalOutstanding: { $sum: '$remainingAmount' },
          totalProfitExpected: { $sum: '$profitMargin' }
        }
      }
    ]);

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
      { $match: { isDeleted: false, status: { $nin: ['completed', 'closed-rollover'] } } },
      { $unwind: '$paymentSchedule' },
      { 
        $match: { 
          'paymentSchedule.status': 'pending',
          'paymentSchedule.dueDate': { $lt: today }
        } 
      },
      {
        $addFields: {
          daysOverdue: {
            $floor: {
              $divide: [
                { $subtract: [today, '$paymentSchedule.dueDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      { $sort: { daysOverdue: -1 } },
      {
        $project: {
          customer: 1, category: 1, brand: 1, model: 1, khataNumber: 1,
          perInstallmentAmount: 1, paymentSchedule: 1, daysOverdue: 1
        }
      }
    ]);

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
      { $match: { isDeleted: false, status: { $nin: ['completed', 'closed-rollover'] }, isCashSale: { $ne: true } } },
      {
        $addFields: {
          pastAndTodaySchedules: {
            $filter: {
              input: '$paymentSchedule',
              as: 'slot',
              cond: { $lte: ['$$slot.dueDate', endOfToday] }
            }
          },
          todaySchedules: {
            $filter: {
              input: '$paymentSchedule',
              as: 'slot',
              cond: {
                $and: [
                  { $gte: ['$$slot.dueDate', startOfToday] },
                  { $lte: ['$$slot.dueDate', endOfToday] }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          expectedUpToToday: { $round: [{ $multiply: [{ $size: '$pastAndTodaySchedules' }, '$perInstallmentAmount'] }, 0] },
          isDueToday: { $gt: [{ $size: '$todaySchedules' }, 0] }
        }
      },
      {
        $addFields: {
          cumulativeDue: { $round: [{ $subtract: ['$expectedUpToToday', '$totalPaid'] }, 0] }
        }
      },
      { $match: { cumulativeDue: { $gt: 0 } } },
      {
        $project: {
          customer: 1, category: 1, brand: 1, model: 1, khataNumber: 1,
          perInstallmentAmount: 1, remainingAmount: 1, totalPaid: 1,
          cumulativeDue: 1, isDueToday: 1, paymentSchedule: 1, scheduleType: 1, investorName: 1,
          daysOverdue: {
            $floor: { $divide: ['$cumulativeDue', '$perInstallmentAmount'] }
          }
        }
      },
      { $sort: { cumulativeDue: -1 } }
    ]);

    await Customer.populate(installments, { path: 'customer', select: 'fullName cnic phone khataNumber' });
    res.status(200).json({ success: true, count: installments.length, data: installments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get installments due today (for Vasooli dashboard)
// @route   GET /api/installments/due-today?type=daily|weekly|monthly
// @access  Private
export const getDueToday = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const { type } = req.query;

    // For weekly: show entire week. For monthly: show this month.
    let dateMatch = { $gte: startOfToday, $lte: endOfToday };
    if (type === 'weekly') {
      const weekEnd = new Date(startOfToday);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      dateMatch = { $gte: startOfToday, $lte: weekEnd };
    } else if (type === 'monthly') {
      const monthEnd = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, 0, 23, 59, 59, 999);
      dateMatch = { $gte: startOfToday, $lte: monthEnd };
    }

    const scheduleTypeFilter = type
      ? {
          daily:   ['daily'],
          weekly:  ['weekly'],
          monthly: ['monthly', '5-day', '10-day']
        }[type] || null
      : null;

    const matchQuery = {
      isDeleted: false,
      isCashSale: { $ne: true },
      status: { $nin: ['completed', 'closed-rollover'] },
    };
    if (scheduleTypeFilter) matchQuery.scheduleType = { $in: scheduleTypeFilter };

    const results = await Installment.aggregate([
      { $match: matchQuery },
      { $unwind: '$paymentSchedule' },
      {
        $match: {
          'paymentSchedule.dueDate': dateMatch,
          'paymentSchedule.status': 'pending'
        }
      },
      {
        $project: {
          customer: 1, brand: 1, model: 1, category: 1, khataNumber: 1,
          perInstallmentAmount: 1, scheduleType: 1, investorName: 1,
          scheduleEntry: '$paymentSchedule'
        }
      }
    ]);

    await Customer.populate(results, { path: 'customer', select: 'fullName phone khataNumber' });

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Rollover — close old installment and link to new one
// @route   POST /api/installments/rollover
// @access  Private
export const rolloverInstallment = async (req, res) => {
  try {
    const { oldInstallmentId, newInstallmentData } = req.body;

    const oldInstallment = await Installment.findById(oldInstallmentId);
    if (!oldInstallment) {
      return res.status(404).json({ success: false, message: 'Old installment not found' });
    }

    // Close the old installment
    oldInstallment.status = 'closed-rollover';
    await oldInstallment.save();

    // Create the new installment with link to old
    let { customer, distributor, ...rest } = newInstallmentData;
    const isValidObjectId = (v) => v && /^[a-f\d]{24}$/i.test(String(v));

    let paymentSchedule = [];
    const { totalInstallments, scheduleType, startDate, isCashSale } = rest;
    if (!isCashSale && totalInstallments && scheduleType && startDate) {
      paymentSchedule = generatePaymentSchedule(startDate, totalInstallments, scheduleType);
    }

    const newInstallment = await Installment.create({
      ...rest,
      customer: customer._id || customer,
      previousInstallmentId: oldInstallmentId,
      paymentSchedule,
      createdBy: req.user.id,
      ...(isValidObjectId(distributor) ? { distributor } : {}),
    });

    res.status(201).json({
      success: true,
      message: 'Rollover complete. Old installment closed, new one created.',
      data: { oldInstallmentId, newInstallment }
    });
  } catch (error) {
    console.error('[rolloverInstallment]', error);
    res.status(400).json({ success: false, message: 'Rollover failed', error: error.message });
  }
};

// @desc    Get full ledger (paymentSchedule) for an installment
// @route   GET /api/installments/:id/ledger
// @access  Private
export const getInstallmentLedger = async (req, res) => {
  try {
    const installment = await Installment.findById(req.params.id)
      .populate('customer', 'fullName phone khataNumber')
      .populate('paymentSchedule.collectedBy', 'name');

    if (!installment) {
      return res.status(404).json({ success: false, message: 'Installment not found' });
    }

    const schedule = [...(installment.paymentSchedule || [])].sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
    );

    const totalPaid    = schedule.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.paidAmount || installment.perInstallmentAmount || 0), 0);
    const totalMissed  = schedule.filter(s => s.status === 'missed').reduce((sum, s) => sum + (installment.perInstallmentAmount || 0), 0);
    const totalPending = schedule.filter(s => s.status === 'pending').reduce((sum, s) => sum + (installment.perInstallmentAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        installment: {
          _id: installment._id,
          customer: installment.customer,
          khataNumber: installment.khataNumber,
          brand: installment.brand,
          model: installment.model,
          category: installment.category,
          perInstallmentAmount: installment.perInstallmentAmount,
          installmentPrice: installment.installmentPrice,
          advanceAmount: installment.advanceAmount,
          remainingAmount: installment.remainingAmount,
          totalPaid: installment.totalPaid,
          investorName: installment.investorName,
          scheduleType: installment.scheduleType,
          status: installment.status,
          isCashSale: installment.isCashSale,
        },
        schedule,
        summary: { totalPaid, totalMissed, totalPending, arrears: totalMissed }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Status auto-update helper
export const updateInstallmentStatusAfterPayment = async (installmentId) => {
  const installment = await Installment.findById(installmentId);
  if (!installment) return;

  const paidCount = installment.paymentSchedule.filter(p => p.status === 'paid').length;
  installment.installmentsPaid = paidCount;
  
  const totalCount = installment.totalInstallments;
  if (totalCount) {
    const remainingCount = totalCount - paidCount;
    if (remainingCount <= 0) {
      installment.status = 'completed';
    } else if (remainingCount <= 3) {
      installment.status = 'near_completion';
    } else {
      installment.status = 'active';
    }
  }

  await installment.save();
};

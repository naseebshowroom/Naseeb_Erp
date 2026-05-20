import Installment from '../models/Installment.js';
import Customer from '../models/Customer.js';
import Asset from '../models/Asset.js';
import Payment from '../models/Payment.js';
import mongoose from 'mongoose';
import { generatePaymentSchedule } from '../utils/schedule.js';

// @desc    Get all installments
// @route   GET /api/installments
// @access  Private
export const getInstallments = async (req, res) => {
  try {
    const {
      customerId,
      customer,
      status,
      category,
      limit = 10,
      page = 1,
    } = req.query;

    const query = { isDeleted: { $ne: true } };
    
    // Support both customerId and customer query params
    const resolvedCustomerId = customerId || customer;
    if (resolvedCustomerId) query.customer = resolvedCustomerId;
    
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;

    const total = await Installment.countDocuments(query);
    
    const installments = await Installment.find(query)
      .populate('customer', 'fullName phone cnic khataNumber')
      .select(`
        khataNumber category brand model color
        customCategory installmentPrice
        advanceAmount remainingAmount totalPaid
        perInstallmentAmount scheduleType
        totalInstallments installmentsPaid
        isCashSale status investorName
        engineNumber chassisNumber
        createdAt
      `)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    // Build display label for each installment (used in dropdowns)
    const installmentsWithLabel = installments.map(inst => {
      const productName = inst.customCategory
        || [inst.brand, inst.model].filter(Boolean).join(' ')
        || inst.category;
      
      const categoryLabel = {
        motorcycle: 'Motorcycle',
        car: 'Car',
        mobile: 'Mobile',
        ac: 'AC',
        lcd: 'LCD/TV',
        fridge: 'Fridge',
        washing_machine: 'Washing Machine',
        other: 'Other',
      }[inst.category] || inst.category;

      return {
        ...inst,
        displayLabel: `${productName} (${categoryLabel}) — Khata: ${inst.khataNumber} — Baqaya: Rs. ${Math.round(inst.remainingAmount || 0).toLocaleString('en-PK')}`,
        productName,
        categoryLabel,
      };
    });

    res.status(200).json({
      success: true,
      data: installmentsWithLabel,
      total,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
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
  const isReplicaSet = mongoose.connection?.client?.topology?.description?.type === 'ReplicaSetWithPrimary' || 
                       mongoose.connection?.client?.topology?.description?.type === 'Sharded';
  const session = isReplicaSet ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    let { customer, distributor, ...rest } = req.body;

    // If customer is an object (inline creation from wizard), create or find customer
    if (customer && typeof customer === 'object' && !customer._id) {
      // Try to find by CNIC only if provided
      let existingCustomer = null;
      if (customer.cnic) {
        existingCustomer = await Customer.findOne({ cnic: customer.cnic }).session(session);
      }
      if (existingCustomer) {
        customer = existingCustomer._id;
      } else {
        const newCustomers = await Customer.create([{
          fullName:    customer.fullName,
          fatherName:  customer.fatherName,
          ...(customer.cnic ? { cnic: customer.cnic } : {}),
          phone:       customer.phone,
          city:        customer.city,
          address:     customer.address,
          khataNumber: customer.khataNumber,
          guarantors:  customer.guarantors || [],
          createdBy:   req.user.id,
        }], { session });
        customer = newCustomers[0]._id;
      }
    }

    // Verify customer exists
    const customerExists = await Customer.findById(customer).session(session);
    if (!customerExists) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(404).json({ success: false, message: 'Gahak nahi mila' });
    }

    const isValidObjectId = (v) => v && /^[a-f\d]{24}$/i.test(String(v));

    // Generate Payment Schedule dynamically based on remaining balance and perInstallmentAmount
    let paymentSchedule = [];
    const { scheduleType, startDate, isCashSale, perInstallmentAmount, installmentPrice, advanceAmount } = rest;
    if (!isCashSale && perInstallmentAmount && scheduleType && startDate) {
      const price = Number(installmentPrice) || 0;
      const advance = Number(advanceAmount) || 0;
      const remainingAmount = price - advance;
      paymentSchedule = generatePaymentSchedule(startDate, remainingAmount, perInstallmentAmount, scheduleType);
    }

    const installmentData = {
      ...rest,
      customer,
      paymentSchedule,
      totalInstallments: paymentSchedule.length,
      createdBy: req.user.id,
      ...(isValidObjectId(distributor) ? { distributor } : {}),
    };

    const installments = await Installment.create([installmentData], { session });
    const installment = installments[0];

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
      }, { session });
    }

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }
    res.status(201).json({ success: true, data: installment });

  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
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
    const { paymentSchedule, customer, ...updateData } = req.body;

    const currentInst = await Installment.findById(req.params.id);
    if (!currentInst) {
      return res.status(404).json({ success: false, message: 'Installment not found' });
    }

    const merged = {
      isCashSale:           updateData.isCashSale !== undefined ? updateData.isCashSale : currentInst.isCashSale,
      installmentPrice:     updateData.installmentPrice !== undefined ? Number(updateData.installmentPrice) : currentInst.installmentPrice,
      advanceAmount:        updateData.advanceAmount !== undefined ? Number(updateData.advanceAmount) : currentInst.advanceAmount,
      perInstallmentAmount: updateData.perInstallmentAmount !== undefined ? Number(updateData.perInstallmentAmount) : currentInst.perInstallmentAmount,
      scheduleType:         updateData.scheduleType !== undefined ? updateData.scheduleType : currentInst.scheduleType,
      startDate:            updateData.startDate !== undefined ? updateData.startDate : currentInst.startDate,
    };

    if (!merged.isCashSale && merged.perInstallmentAmount && merged.scheduleType && merged.startDate) {
      const price = Number(merged.installmentPrice) || 0;
      const advance = Number(merged.advanceAmount) || 0;
      const remainingAmount = price - advance;
      
      updateData.paymentSchedule = generatePaymentSchedule(merged.startDate, remainingAmount, merged.perInstallmentAmount, merged.scheduleType);
      updateData.totalInstallments = updateData.paymentSchedule.length;
      updateData.remainingAmount = remainingAmount;
    }

    // 1. Update installment details
    const installment = await Installment.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!installment) {
      return res.status(404).json({ success: false, message: 'Installment not found' });
    }

    // 2. Update customer details if provided
    if (customer && typeof customer === 'object') {
      const customerId = installment.customer;
      if (customerId) {
        await Customer.findByIdAndUpdate(customerId, {
          fullName:    customer.fullName,
          fatherName:  customer.fatherName,
          ...(customer.cnic ? { cnic: customer.cnic } : {}),
          phone:       customer.phone,
          city:        customer.city,
          address:     customer.address,
          khataNumber: customer.khataNumber,
          guarantors:  customer.guarantors || [],
        }, { runValidators: true });
      }
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
              input: { $ifNull: ['$paymentSchedule', []] },
              as: 'slot',
              cond: { $lte: ['$$slot.dueDate', endOfToday] }
            }
          },
          todaySchedules: {
            $filter: {
              input: { $ifNull: ['$paymentSchedule', []] },
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
          expectedUpToToday: {
            $round: [
              {
                $multiply: [
                  { $size: { $ifNull: ['$pastAndTodaySchedules', []] } },
                  { $ifNull: ['$perInstallmentAmount', 0] }
                ]
              },
              0
            ]
          },
          isDueToday: { $gt: [{ $size: { $ifNull: ['$todaySchedules', []] } }, 0] }
        }
      },
      {
        $addFields: {
          cumulativeDue: {
            $round: [
              { $subtract: [{ $ifNull: ['$expectedUpToToday', 0] }, { $ifNull: ['$totalPaid', 0] }] },
              0
            ]
          }
        }
      },
      { $match: { cumulativeDue: { $gt: 0 } } },
      {
        $project: {
          customer: 1, category: 1, brand: 1, model: 1, khataNumber: 1,
          perInstallmentAmount: 1, remainingAmount: 1, totalPaid: 1,
          cumulativeDue: 1, isDueToday: 1, paymentSchedule: 1, scheduleType: 1, investorName: 1,
          daysOverdue: {
            $cond: {
              if: { $gt: [{ $ifNull: ['$perInstallmentAmount', 0] }, 0] },
              then: { $floor: { $divide: ['$cumulativeDue', { $ifNull: ['$perInstallmentAmount', 1] }] } },
              else: 0
            }
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
          customCategory: 1, customItemName: 1, color: 1,
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
  const isReplicaSet = mongoose.connection?.client?.topology?.description?.type === 'ReplicaSetWithPrimary' || 
                       mongoose.connection?.client?.topology?.description?.type === 'Sharded';
  const session = isReplicaSet ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const { oldInstallmentId, newInstallmentData } = req.body;

    const oldInstallment = await Installment.findById(oldInstallmentId).session(session);
    if (!oldInstallment) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(404).json({ success: false, message: 'Old installment not found' });
    }

    // Close the old installment
    oldInstallment.status = 'closed-rollover';
    await oldInstallment.save({ session });

    // Create the new installment with link to old
    let { customer, distributor, ...rest } = newInstallmentData;
    const isValidObjectId = (v) => v && /^[a-f\d]{24}$/i.test(String(v));

    let paymentSchedule = [];
    const { scheduleType, startDate, isCashSale, perInstallmentAmount, installmentPrice, advanceAmount } = rest;
    if (!isCashSale && perInstallmentAmount && scheduleType && startDate) {
      const price = Number(installmentPrice) || 0;
      const advance = Number(advanceAmount) || 0;
      const remainingAmount = price - advance;
      paymentSchedule = generatePaymentSchedule(startDate, remainingAmount, perInstallmentAmount, scheduleType);
    }

    const newInstallments = await Installment.create([{
      ...rest,
      customer: customer._id || customer,
      previousInstallmentId: oldInstallmentId,
      paymentSchedule,
      totalInstallments: paymentSchedule.length,
      createdBy: req.user.id,
      ...(isValidObjectId(distributor) ? { distributor } : {}),
    }], { session });

    const newInstallment = newInstallments[0];

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    res.status(201).json({
      success: true,
      message: 'Rollover complete. Old installment closed, new one created.',
      data: { oldInstallmentId, newInstallment }
    });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
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
      .populate('paymentSchedule.collectedBy', 'name fullName');

    if (!installment) {
      return res.status(404).json({ success: false, message: 'Installment not found' });
    }

    // Fetch ALL Payment documents for this installment (for split payment sub-rows)
    const Payment = (await import('../models/Payment.js')).default;
    const allPayments = await Payment.find({ installment: installment._id })
      .populate('collectedBy', 'name fullName')
      .sort({ paidDate: 1 })
      .lean();

    // Build a map: scheduleEntryId (string) -> array of Payment docs
    const paymentsBySlot = {};
    for (const pmt of allPayments) {
      const key = String(pmt.scheduleEntryId);
      if (!paymentsBySlot[key]) paymentsBySlot[key] = [];
      paymentsBySlot[key].push(pmt);
    }

    // Sort schedule chronologically
    const schedule = [...(installment.paymentSchedule || [])].sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
    );

    // Enrich each schedule slot with its individual payment sub-rows
    const enrichedSchedule = schedule.map(slot => {
      const slotPayments = paymentsBySlot[String(slot._id)] || [];
      const isSplit = slotPayments.length > 1;
      const totalCollectedForSlot = slotPayments.reduce((s, p) => s + (p.amount || 0), 0);
      const progressPercent = slot.expectedAmount > 0
        ? Math.min(100, Math.round((totalCollectedForSlot / slot.expectedAmount) * 100))
        : 0;

      return {
        ...slot.toObject(),
        payments: slotPayments,
        isSplit,
        totalCollectedForSlot,
        progressPercent,
        paymentCount: slotPayments.length,
        paymentId: slotPayments[slotPayments.length - 1]?._id,
        receiptNumber: slotPayments[slotPayments.length - 1]?.receiptNumber,
      };
    });

    // Summary stats
    const totalActuallyPaid = schedule.reduce((s, e) => s + (e.paidAmount || 0), 0);
    const totalMissedAmount = schedule.filter(s => s.status === 'missed').reduce((sum, s) => sum + (s.shortfallAmount || s.expectedAmount || 0), 0);
    const totalArrears      = schedule.reduce((s, e) => s + (e.shortfallAmount || 0), 0);
    const totalPending      = schedule.filter(s => s.status === 'pending').reduce((sum, s) => sum + (installment.perInstallmentAmount || 0), 0);

    // Chronological payment history view (all individual payment docs)
    const paymentHistory = [...allPayments].sort((a, b) => new Date(a.paidDate) - new Date(b.paidDate));

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
          customCategory: installment.customCategory,
          customItemName: installment.customItemName,
          color: installment.color,
          perInstallmentAmount: installment.perInstallmentAmount,
          installmentPrice: installment.installmentPrice,
          advanceAmount: installment.advanceAmount,
          remainingAmount: installment.remainingAmount,
          totalPaid: installment.totalPaid,
          totalArrears: installment.totalArrears,
          investorName: installment.investorName,
          scheduleType: installment.scheduleType,
          status: installment.status,
          isCashSale: installment.isCashSale,
          assetId: installment.assetId,
        },
        schedule: enrichedSchedule,
        paymentHistory,
        summary: {
          totalPaid: totalActuallyPaid,
          totalMissed: totalMissedAmount,
          totalArrears,
          totalPending,
          arrears: totalArrears,
        }
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

// @desc    Get dashboard metrics & chart data (expected vs collected)
// @route   GET /api/installments/stats
// @access  Private (Owner/Manager)
export const getInstallmentStats = async (req, res) => {
  try {
    // Status breakdown for pie chart
    const statusBreakdown = await Installment.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { 
        $group: { 
          _id: '$status', 
          count: { $sum: 1 },
          totalValue: { $sum: '$installmentPrice' }
        } 
      }
    ]);

    // Monthly recovery for bar chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRecovery = await Payment.aggregate([
      { 
        $match: { 
          paidDate: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          totalCollected: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Expected per month from active installments
    const monthlyExpected = await Installment.aggregate([
      { $match: { status: 'active', isDeleted: { $ne: true } } },
      { $unwind: '$paymentSchedule' },
      {
        $match: {
          'paymentSchedule.dueDate': { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentSchedule.dueDate' },
            month: { $month: '$paymentSchedule.dueDate' }
          },
          totalExpected: { 
            $sum: '$paymentSchedule.expectedAmount' 
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format month names for chart labels
    const monthNames = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec'
    ];

    // Format chart data — merge expected vs collected by month
    const chartData = monthlyRecovery.map(item => ({
      month: monthNames[item._id.month - 1],
      year: item._id.year,
      collected: item.totalCollected,
      expected: monthlyExpected.find(
        e => e._id.month === item._id.month && 
             e._id.year === item._id.year
      )?.totalExpected || 0,
    }));

    // If chartData is empty, populate with empty bounds so dashboard renders
    if (chartData.length === 0) {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        chartData.push({
          month: monthNames[d.getMonth()],
          year: d.getFullYear(),
          collected: 0,
          expected: 0
        });
      }
    }

    // statusStats: rename _id -> status for readability (frontend uses item._id)
    const statusStats = statusBreakdown;

    res.json({
      success: true,
      data: {
        statusStats,
        monthlyRecovery: chartData,
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

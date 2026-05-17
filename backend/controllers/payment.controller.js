import Payment from '../models/Payment.js';
import Installment from '../models/Installment.js';
import mongoose from 'mongoose';

// Helper for start and end of day dates
const getDayBounds = (dateString) => {
  const date = dateString ? new Date(dateString) : new Date();
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  return { startOfDay, endOfDay };
};

// @desc    Record a payment
// @route   POST /api/payments
// @access  Private
export const recordPayment = async (req, res) => {
  try {
    const { installment, customer, amount, scheduleEntryId, paymentDate, notes, receivedBy, collectorName, paymentMode } = req.body;

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) throw new Error('Valid amount required');

    // 1. Verify installment exists
    const instRecord = await Installment.findById(installment);
    if (!instRecord) throw new Error('Installment not found');

    // 2. Create Payment record
    const payment = await Payment.create({
      installment,
      customer: customer || instRecord.customer,
      amount: amountNum,
      paymentMode: paymentMode || 'cash',
      scheduleEntryId,
      paymentDate: paymentDate || new Date(),
      notes,
      collectorName,
      receivedBy: receivedBy || req.user.id,
      createdBy: req.user.id
    });

    // 3. Update financial totals
    instRecord.totalPaid += amountNum;

    // 4. Mark slots as paid sequentially
    let amountLeft = amountNum;
    let newlyPaidCount = 0;

    // If a specific slot was targeted, start with that one
    if (scheduleEntryId) {
      const targetSlot = instRecord.paymentSchedule.id(scheduleEntryId);
      if (targetSlot && targetSlot.status === 'pending') {
        targetSlot.status = 'paid';
        targetSlot.paidDate = paymentDate || new Date();
        const slotAmount = Math.min(amountLeft, instRecord.perInstallmentAmount);
        targetSlot.paidAmount = slotAmount;
        amountLeft -= slotAmount;
        newlyPaidCount++;
      }
    }

    // If there's still money left (bulk payment), mark subsequent pending slots
    if (amountLeft >= instRecord.perInstallmentAmount * 0.8) { // Allow some tolerance
      for (let slot of instRecord.paymentSchedule) {
        if (amountLeft < instRecord.perInstallmentAmount * 0.8) break;
        if (slot.status === 'pending') {
          slot.status = 'paid';
          slot.paidDate = paymentDate || new Date();
          const slotAmount = Math.min(amountLeft, instRecord.perInstallmentAmount);
          slot.paidAmount = slotAmount;
          amountLeft -= slotAmount;
          newlyPaidCount++;
        }
      }
    }

    // If no specific slot was marked but money was paid, we still count it as at least 1 installment if it covers most of it
    if (newlyPaidCount === 0 && amountNum > 0) {
      newlyPaidCount = Math.floor(amountNum / instRecord.perInstallmentAmount) || 1;
    }

    instRecord.installmentsPaid += newlyPaidCount;

    // Update status based on remaining installments
    const remainingCount = instRecord.totalInstallments - instRecord.installmentsPaid;
    if (instRecord.remainingAmount <= 0 || remainingCount <= 0) {
      instRecord.status = 'completed';
    } else if (remainingCount <= 3) {
      instRecord.status = 'near_completion';
    }

    await instRecord.save();

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error('[recordPayment]', error.message);
    res.status(400).json({ success: false, message: error.message || 'Payment failed', error: error.message });
  }
};


// @desc    Get payments (list with filters)
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res) => {
  try {
    const query = {};
    
    if (req.query.customer) query.customer = req.query.customer;
    if (req.query.installment) query.installment = req.query.installment;
    if (req.query.worker) query.receivedBy = req.query.worker;

    if (req.query.startDate && req.query.endDate) {
      query.paymentDate = { 
        $gte: new Date(req.query.startDate), 
        $lte: new Date(req.query.endDate) 
      };
    }

    const payments = await Payment.find(query)
      .populate('customer', 'fullName cnic phone')
      .populate('receivedBy', 'name role')
      .populate({
        path: 'installment',
        select: 'category brand model'
      })
      .sort({ paymentDate: -1 });

    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get collected today
// @route   GET /api/payments/collected-today
// @access  Private
export const getCollectedToday = async (req, res) => {
  try {
    const { startOfDay, endOfDay } = getDayBounds();

    const payments = await Payment.find({
      paymentDate: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('customer', 'fullName cnic phone')
      .populate('installment', 'brand model category')
      .populate('receivedBy', 'name role')
      .sort({ paymentDate: -1 });

    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get single receipt
// @route   GET /api/payments/receipt/:id
// @access  Private
export const getReceiptData = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'fullName cnic phone address city')
      .populate('installment', 'brand model category serialNumber engineNumber remainingAmount totalPaid status');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete/Reverse Payment
// @route   DELETE /api/payments/:id
// @access  Private (Owner only)
export const deletePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findById(req.params.id).session(session);
    if (!payment) throw new Error('Payment not found');

    const instRecord = await Installment.findById(payment.installment).session(session);
    
    // Reverse schedule entry
    if (payment.scheduleEntryId && instRecord) {
      const scheduleSlot = instRecord.paymentSchedule.id(payment.scheduleEntryId);
      if (scheduleSlot) {
        scheduleSlot.status = 'pending';
        scheduleSlot.paidDate = undefined;
        scheduleSlot.paidAmount = undefined;
      }
    }

    // Reverse financial sums
    if (instRecord) {
      instRecord.totalPaid -= payment.amount;
      instRecord.installmentsPaid -= 1;
      instRecord.remainingAmount += payment.amount;
      
      // Reset status logic loosely
      if (instRecord.remainingAmount > 0) {
        const remainingCount = instRecord.totalInstallments - instRecord.installmentsPaid;
        instRecord.status = remainingCount <= 3 ? 'near_completion' : 'active';
      }

      await instRecord.save({ session });
    }

    await Payment.deleteOne({ _id: payment._id }).session(session);
    
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Payment successfully reversed' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: 'Failed to reverse payment', error: error.message });
  }
};

// @desc    Get Daily Summary (Dashboard view)
// @route   GET /api/payments/summary/daily
// @access  Private
export const getDailySummary = async (req, res) => {
  try {
    const { startOfDay, endOfDay } = getDayBounds(req.query.date);

    // 1. Collections made today
    const collections = await Payment.aggregate([
      { $match: { paymentDate: { $gte: startOfDay, $lte: endOfDay } } },
      { 
        $group: { 
          _id: null, 
          totalAmount: { $sum: '$amount' }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    // 2. Collections grouped by worker
    const byWorker = await Payment.aggregate([
      { $match: { paymentDate: { $gte: startOfDay, $lte: endOfDay } } },
      { 
        $group: { 
          _id: '$receivedBy', 
          amount: { $sum: '$amount' }, 
          count: { $sum: 1 } 
        } 
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'workerInfo'
        }
      },
      { $unwind: '$workerInfo' },
      { $project: { workerName: '$workerInfo.name', amount: 1, count: 1 } }
    ]);

    // 3. Due vs Missed Logic
    // Find all installments where a schedule dueDate falls within today
    const todaySchedule = await Installment.aggregate([
      { $match: { isDeleted: false, status: { $ne: 'completed' } } },
      { $unwind: '$paymentSchedule' },
      { 
        $match: { 
          'paymentSchedule.dueDate': { $gte: startOfDay, $lte: endOfDay }
        } 
      },
      {
        $group: {
          _id: '$paymentSchedule.status',
          count: { $sum: 1 }
        }
      }
    ]);

    let totalDue = 0;
    let totalMissed = 0;

    todaySchedule.forEach(item => {
      totalDue += item.count;
      if (item._id === 'pending') totalMissed += item.count; // If endOfDay passed, it's missed
    });

    res.status(200).json({
      success: true,
      data: {
        totalDue, // Everything due on this day
        totalCollectedCount: collections[0]?.count || 0,
        totalCollectedAmount: collections[0]?.totalAmount || 0,
        totalMissedPending: totalMissed,
        collectionsByWorker: byWorker
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get Monthly Summary (for Chart)
// @route   GET /api/payments/summary/monthly
// @access  Private
export const getMonthlySummary = async (req, res) => {
  try {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);

    const paymentsAgg = await Payment.aggregate([
      { $match: { paymentDate: { $gte: date } } },
      {
        $group: {
          _id: { 
            year: { $year: "$paymentDate" }, 
            month: { $month: "$paymentDate" } 
          },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    const advancesAgg = await Installment.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: date } } },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" } 
          },
          totalAmount: { $sum: "$advanceAmount" }
        }
      }
    ]);

    // Merge both sources
    const monthlyMap = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Add payments
    paymentsAgg.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      monthlyMap[key] = { year: item._id.year, month: item._id.month, total: item.totalAmount };
    });

    // Add advances
    advancesAgg.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      if (monthlyMap[key]) {
        monthlyMap[key].total += item.totalAmount;
      } else {
        monthlyMap[key] = { year: item._id.year, month: item._id.month, total: item.totalAmount };
      }
    });

    const formattedData = Object.values(monthlyMap)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .map(item => ({
        name: `${months[item.month - 1]}`,
        amount: item.total
      }));

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

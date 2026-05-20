import Payment from '../models/Payment.js';
import Installment from '../models/Installment.js';
import CollectionAssignment from '../models/CollectionAssignment.js';
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
  const isReplicaSet = mongoose.connection?.client?.topology?.description?.type === 'ReplicaSetWithPrimary' || 
                       mongoose.connection?.client?.topology?.description?.type === 'Sharded';
  const session = isReplicaSet ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const installmentId = req.body.installmentId || req.body.installment;
    const scheduleEntryId = req.body.scheduleEntryId;
    const paidAmount = req.body.paidAmount !== undefined ? req.body.paidAmount : req.body.amount;
    const collectedBy = req.body.collectedBy || req.body.receivedBy || req.user?._id || req.user?.id;
    const paidDate = req.body.paidDate || req.body.paymentDate || new Date();
    const notes = req.body.notes || req.body.note;
    const paymentMode = req.body.paymentMode || 'cash';

    // 1. Fetch Installment
    const installment = await Installment
      .findById(installmentId)
      .session(session);

    if (!installment) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'Installment/Khata account nahi mila!' 
      });
    }

    // 2. Locate the specific schedule entry
    let scheduleEntry;
    if (scheduleEntryId) {
      scheduleEntry = installment.paymentSchedule.id(scheduleEntryId);
    } else {
      // Automatically find the oldest unpaid (missed, pending, or partially_paid) schedule entry
      const unpaidEntries = installment.paymentSchedule
        .filter(e => e.status === 'missed' || e.status === 'pending' || e.status === 'partially_paid')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      
      if (unpaidEntries.length > 0) {
        scheduleEntry = unpaidEntries[0];
      }
    }

    if (!scheduleEntry) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'Is product ki tamam qistein pehle se ada ho chuki hain!' 
      });
    }

    // 3. Determine actual paid amount vs expected
    //    CRITICAL: paidAmount on the slot is CUMULATIVE (sum of all split payments).
    //    We must ADD to the existing paidAmount, not overwrite it.
    const expected = scheduleEntry.expectedAmount;
    const newPayment = Number(paidAmount) || 0;
    const previouslyPaid = scheduleEntry.paidAmount || 0;          // already on the slot
    const cumulativePaid = previouslyPaid + newPayment;             // total after this payment

    let paymentStatus = 'pending';
    let shortfall = 0;

    if (cumulativePaid >= expected) {
      paymentStatus = 'paid';
      shortfall = 0;
    } else if (cumulativePaid > 0 && cumulativePaid < expected) {
      paymentStatus = 'partially_paid';
      shortfall = expected - cumulativePaid;
    } else {
      paymentStatus = 'missed';
      shortfall = expected;
    }

    // 4. Update schedule entry fields (paidAmount = CUMULATIVE total)
    scheduleEntry.status = paymentStatus;
    scheduleEntry.paidAmount = cumulativePaid;                      // ✅ accumulate, not overwrite
    scheduleEntry.shortfallAmount = shortfall;
    scheduleEntry.collectedBy = collectedBy || req.user?._id || req.user?.id;
    scheduleEntry.paidDate = paidDate || new Date();
    if (notes) scheduleEntry.note = notes;

    // Also use the new payment amount (not cumulative) for the Payment audit doc below
    const actualPaid = newPayment;

    // 5. Recalculate Installment totals
    const totalPaid = installment.paymentSchedule
      .reduce((sum, entry) => sum + (entry.paidAmount || 0), 0);

    const totalArrears = installment.paymentSchedule
      .reduce((sum, entry) => sum + (entry.shortfallAmount || 0), 0);

    installment.totalPaid = totalPaid;
    installment.remainingAmount = Math.max(
      0, 
      installment.installmentPrice - (installment.advanceAmount || 0) - totalPaid
    );
    installment.totalArrears = totalArrears;

    // Recalculate installmentsPaid count
    const paidCount = installment.paymentSchedule
      .filter(e => e.status === 'paid').length;
    installment.installmentsPaid = paidCount;

    // Adjust overall installment status
    if (installment.remainingAmount <= 0) {
      installment.status = 'completed';
    } else if (
      installment.paymentSchedule.filter(
        e => e.status === 'pending'
      ).length <= 3
    ) {
      installment.status = 'near_completion';
    } else {
      installment.status = 'active';
    }

    await installment.save({ session });

    // 6. Generate Automated Receipt Number
    // Year-count pattern (e.g. 2026-0001)
    const currentYear = new Date().getFullYear();
    const count = await Payment.countDocuments({
      receiptNumber: new RegExp(`^${currentYear}-`)
    }).session(session);
    
    const sequentialNum = String(count + 1).padStart(4, '0');
    const receiptNumber = `${currentYear}-${sequentialNum}`;

    // 7. Create Payment document (Audit Log)
    // Populate snapshot schema with actual details
    const customer = await mongoose.model('Customer')
      .findById(installment.customer)
      .session(session);

    // Determine if this is a split/partial payment for an existing slot
    // A split payment occurs when:
    // (a) This payment is itself partial (partially_paid), OR
    // (b) The slot already had a prior partial payment (we're completing it)
    const existingPaymentsOnSlot = await Payment.countDocuments({
      scheduleEntryId: scheduleEntry._id
    }).session(session);
    const isPartOfSplit = paymentStatus === 'partially_paid' || existingPaymentsOnSlot > 0;
    const splitGroup = isPartOfSplit ? `${installment._id}_${scheduleEntry._id}` : undefined;

    const payment = new Payment({
      installment: installment._id,
      customer: installment.customer,
      scheduleEntryId: scheduleEntry._id,
      amount: actualPaid,
      paymentMode: paymentMode || 'cash',
      collectedBy: collectedBy || req.user?._id || req.user?.id,
      paidDate: paidDate || new Date(),
      receiptNumber,
      notes,

      // Split payment tracking
      relatedDueDate: scheduleEntry.dueDate,
      isPartOfSplitPayment: isPartOfSplit,
      splitPaymentGroup: splitGroup,
      
      // Snapshot fields for fast reporting
      customerName: customer?.fullName || '—',
      customerPhone: customer?.phone || '—',
      itemDescription: (installment.category === 'other' ? (installment.customItemName || installment.customCategory) : `${installment.brand} ${installment.model}`).trim(),
      category: installment.category,
      khataNumber: installment.khataNumber || '—',
      totalPrice: String(installment.installmentPrice || 0),
      remainingAfterPayment: installment.remainingAmount,
      dueDate: scheduleEntry.dueDate,
    });

    await payment.save({ session });

    // 8. Auto-complete collection assignment for this worker today if exists
    const assignmentStart = new Date(paidDate);
    assignmentStart.setHours(0, 0, 0, 0);
    const assignmentEnd = new Date(paidDate);
    assignmentEnd.setHours(23, 59, 59, 999);

    await CollectionAssignment.findOneAndUpdate(
      {
        worker: collectedBy,
        installment: installmentId,
        date: { $gte: assignmentStart, $lte: assignmentEnd },
        status: 'pending'
      },
      {
        status: 'collected',
        amountCollected: actualPaid,
        notes: notes || 'Collected via payment endpoint'
      },
      { session }
    );

    if (session) await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: `Adaigi successfully darj ho gayi! Receipt No: ${receiptNumber}`,
      payment,
      scheduleEntry,
      installmentUpdate: {
        totalPaid: installment.totalPaid,
        remainingAmount: installment.remainingAmount,
        totalArrears: installment.totalArrears,
        status: installment.status,
      }
    });

  } catch (error) {
    if (session) await session.abortTransaction();
    console.error('[recordPayment Error]', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment process failed',
      error: error.message 
    });
  } finally {
    if (session) session.endSession();
  }
};


// @desc    Get payments (list with filters)
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 1000; // Increase default limit for full history listing
    const startIndex = (page - 1) * limit;

    const query = {};
    
    if (req.query.customer) query.customer = req.query.customer;
    if (req.query.installmentId || req.query.installment) {
      query.installment = req.query.installmentId || req.query.installment;
    }
    if (req.query.collectedBy || req.query.worker) {
      query.collectedBy = req.query.collectedBy || req.query.worker;
    }

    if (req.query.date) {
      const dateVal = req.query.date === 'today' ? new Date() : new Date(req.query.date);
      const startOfDay = new Date(dateVal.setHours(0, 0, 0, 0));
      const endOfDay = new Date(dateVal.setHours(23, 59, 59, 999));
      query.paidDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (req.query.startDate && req.query.endDate) {
      query.paidDate = { 
        $gte: new Date(req.query.startDate), 
        $lte: new Date(req.query.endDate) 
      };
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('customer', 'fullName cnic phone')
      .populate('collectedBy', 'fullName name role')
      .populate({
        path: 'installment',
        select: 'category brand model khataNumber installmentPrice remainingAmount totalPaid status'
      })
      .sort({ paidDate: -1 })
      .skip(startIndex)
      .limit(limit)
      .lean();

    res.status(200).json({ 
      success: true, 
      count: payments.length, 
      total,
      pagination: { page, limit, pages: Math.ceil(total / limit) },
      data: payments 
    });
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
      paidDate: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('customer', 'fullName cnic phone')
      .populate('installment', 'brand model category')
      .populate('collectedBy', 'fullName name role')
      .sort({ paidDate: -1 });

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
  const isReplicaSet = mongoose.connection?.client?.topology?.description?.type === 'ReplicaSetWithPrimary' || 
                       mongoose.connection?.client?.topology?.description?.type === 'Sharded';
  const session = isReplicaSet ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

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
    
    if (session) await session.commitTransaction();
    if (session) session.endSession();

    res.status(200).json({ success: true, message: 'Payment successfully reversed' });
  } catch (error) {
    if (session) await session.abortTransaction();
    if (session) session.endSession();
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
      { $match: { paidDate: { $gte: startOfDay, $lte: endOfDay } } },
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
      { $match: { paidDate: { $gte: startOfDay, $lte: endOfDay } } },
      { 
        $group: { 
          _id: '$collectedBy', 
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
      { $match: { paidDate: { $gte: date } } },
      {
        $group: {
          _id: { 
            year: { $year: "$paidDate" }, 
            month: { $month: "$paidDate" } 
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

// @desc    Update a specific schedule entry status (paid / missed / partially_paid)
// @route   PATCH /api/payments/schedule/:scheduleId/status
// @access  Private
export const updateScheduleStatus = async (req, res) => {
  const isReplicaSet = mongoose.connection?.client?.topology?.description?.type === 'ReplicaSetWithPrimary' || 
                       mongoose.connection?.client?.topology?.description?.type === 'Sharded';
  const session = isReplicaSet ? await mongoose.startSession() : null;
  if (session) session.startTransaction();
  
  try {
    const { scheduleId } = req.params;
    const { 
      status,        // 'paid' | 'missed' | 'partially_paid'
      paidAmount,    // actual amount received
      collectedBy,
      paidDate,
      note
    } = req.body;

    // Find installment containing this schedule entry
    const installment = await Installment.findOne({
      'paymentSchedule._id': scheduleId
    }).session(session);

    if (!installment) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'Schedule entry not found' 
      });
    }

    // Find the specific schedule entry
    const scheduleEntry = installment.paymentSchedule.id(scheduleId);
    const expectedAmount = scheduleEntry.expectedAmount;
    const newPayment = Number(paidAmount) || 0;
    // CUMULATIVE: add to previously paid amount on the slot (not overwrite)
    const previouslyPaid = scheduleEntry.paidAmount || 0;
    const cumulativePaid = previouslyPaid + newPayment;
    const actualPaid = newPayment; // used for the Payment audit doc

    // Determine real status based on cumulative amounts
    let realStatus = status;
    let shortfall = 0;

    if (status === 'paid' || status === 'partially_paid') {
      if (cumulativePaid >= expectedAmount) {
        realStatus = 'paid';
        shortfall = 0;
      } else if (cumulativePaid > 0 && cumulativePaid < expectedAmount) {
        realStatus = 'partially_paid';
        shortfall = expectedAmount - cumulativePaid;
        // Add note about shortfall
        scheduleEntry.note = note || 
          `Partial payment. Baqaya: Rs. ${shortfall}`;
      } else {
        realStatus = 'missed';
        shortfall = expectedAmount;
      }
    }

    // Update the schedule entry (paidAmount = CUMULATIVE total)
    scheduleEntry.status = realStatus;
    scheduleEntry.paidAmount = cumulativePaid;   // ✅ accumulate, not overwrite
    scheduleEntry.shortfallAmount = shortfall;
    scheduleEntry.paidDate = paidDate || new Date();
    scheduleEntry.collectedBy = collectedBy;
    if (note) scheduleEntry.note = note;

    // Recalculate installment totals
    const allPaid = installment.paymentSchedule.reduce(
      (sum, entry) => sum + (entry.paidAmount || 0), 0
    );
    installment.totalPaid = allPaid;
    installment.remainingAmount = 
      installment.installmentPrice - (installment.advanceAmount || 0) - allPaid;

    // Calculate total baqaya (arrears)
    const totalArrears = installment.paymentSchedule.reduce(
      (sum, entry) => sum + (entry.shortfallAmount || 0), 0
    );
    installment.totalArrears = totalArrears;

    // Check if fully paid
    if (installment.remainingAmount <= 0) {
      installment.status = 'completed';
    } else if (
      installment.paymentSchedule.filter(
        e => e.status === 'pending'
      ).length <= 3
    ) {
      installment.status = 'near_completion';
    }

    await installment.save({ session });

    // Fetch customer details for snapshot
    const customer = await mongoose.model('Customer')
      .findById(installment.customer)
      .session(session);

    // Generate Automated Receipt Number
    const currentYear = new Date().getFullYear();
    const count = await Payment.countDocuments({
      receiptNumber: new RegExp(`^${currentYear}-`)
    }).session(session);
    
    const sequentialNum = String(count + 1).padStart(4, '0');
    const receiptNumber = `${currentYear}-${sequentialNum}`;

    // Determine split payment fields
    const existingSlotPayments = await Payment.countDocuments({
      scheduleEntryId: scheduleId
    }).session(session);
    const isPartOfSplit = realStatus === 'partially_paid' || existingSlotPayments > 0;
    const splitGroup = isPartOfSplit ? `${installment._id}_${scheduleId}` : undefined;

    // Create Payment record
    const payment = new Payment({
      installment: installment._id,
      customer: installment.customer,
      scheduleEntryId: scheduleId,
      amount: actualPaid,
      expectedAmount: expectedAmount,
      shortfall: shortfall,
      status: realStatus,
      collectedBy: collectedBy || req.user?._id || req.user?.id,
      paymentDate: paidDate || new Date(),
      paidDate: paidDate || new Date(),
      receiptNumber,
      notes: note,

      // Split payment tracking
      relatedDueDate: scheduleEntry.dueDate,
      isPartOfSplitPayment: isPartOfSplit,
      splitPaymentGroup: splitGroup,

      // Snapshot fields for fast reporting
      customerName: customer?.fullName || '—',
      customerPhone: customer?.phone || '—',
      itemDescription: (installment.category === 'other' ? (installment.customItemName || installment.customCategory) : `${installment.brand} ${installment.model}`).trim(),
      category: installment.category,
      khataNumber: installment.khataNumber || '—',
      totalPrice: String(installment.installmentPrice || 0),
      remainingAfterPayment: installment.remainingAmount,
      dueDate: scheduleEntry.dueDate,
    });
    await payment.save({ session });

    if (session) await session.commitTransaction();

    res.json({
      success: true,
      message: realStatus === 'partially_paid'
        ? `Partial payment recorded. Baqaya: Rs. ${shortfall}`
        : `Payment marked as ${realStatus}`,
      scheduleEntry,
      totalPaid: installment.totalPaid,
      remaining: installment.remainingAmount,
      totalArrears: installment.totalArrears,
    });

  } catch (error) {
    if (session) await session.abortTransaction();
    console.error('Payment update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment update failed',
      error: error.message 
    });
  } finally {
    if (session) session.endSession();
  }
};

// @desc    Apply Bulk Custom FIFO Payment
// @access  Public Helper
export const applyBulkPayment = async (
  installmentId, 
  totalAmountReceived, 
  collectedBy, 
  session
) => {
  const installment = await Installment
    .findById(installmentId)
    .session(session);

  if (!installment) throw new Error('Installment not found');

  // Get all missed + pending entries + partially_paid entries, 
  // sorted oldest first (FIFO)
  const unpaidEntries = installment.paymentSchedule
    .filter(e => 
      e.status === 'missed' || 
      e.status === 'pending' || 
      e.status === 'partially_paid'
    )
    .sort((a, b) => 
      new Date(a.dueDate) - new Date(b.dueDate)
    );

  // Get customer details for snapshot
  const customer = await mongoose.model('Customer')
    .findById(installment.customer)
    .session(session);

  let remainingToDistribute = totalAmountReceived;
  const updatedEntries = [];

  for (const entry of unpaidEntries) {
    if (remainingToDistribute <= 0) break;

    // How much is still owed on this entry?
    const alreadyPaid = entry.paidAmount || 0;
    const stillOwed = entry.expectedAmount - alreadyPaid;
    let allocatedForThisSlot = 0;

    if (remainingToDistribute >= stillOwed) {
      // Fully covers this entry
      allocatedForThisSlot = stillOwed;
      entry.paidAmount = entry.expectedAmount;
      entry.shortfallAmount = 0;
      entry.status = 'paid';
      entry.paidDate = new Date();
      entry.collectedBy = collectedBy;
      remainingToDistribute -= stillOwed;
    } else {
      // Partially covers this entry
      allocatedForThisSlot = remainingToDistribute;
      entry.paidAmount = alreadyPaid + remainingToDistribute;
      entry.shortfallAmount = 
        entry.expectedAmount - entry.paidAmount;
      entry.status = 'partially_paid';
      entry.paidDate = new Date();
      entry.collectedBy = collectedBy;
      remainingToDistribute = 0;
    }

    updatedEntries.push(entry._id);

    // Generate unique receipt number for bulk payments
    const currentYear = new Date().getFullYear();
    const count = await Payment.countDocuments({
      receiptNumber: new RegExp(`^${currentYear}-`)
    }).session(session);
    const sequentialNum = String(count + 1).padStart(4, '0');
    const receiptNumber = `${currentYear}-${sequentialNum}`;

    // Create individual Payment record for audit history
    const payment = new Payment({
      installment: installment._id,
      customer: installment.customer,
      scheduleEntryId: entry._id,
      amount: allocatedForThisSlot,
      expectedAmount: entry.expectedAmount,
      shortfall: entry.shortfallAmount,
      status: entry.status,
      collectedBy,
      paymentDate: new Date(),
      paidDate: new Date(),
      receiptNumber,

      // Split payment tracking
      // Bulk payments that partially fill a slot are part of a split group
      relatedDueDate: entry.dueDate,
      isPartOfSplitPayment: entry.status === 'partially_paid',
      splitPaymentGroup: entry.status === 'partially_paid' ? `${installment._id}_${entry._id}` : undefined,

      // Snapshot fields for fast reporting
      customerName: customer?.fullName || '—',
      customerPhone: customer?.phone || '—',
      itemDescription: (installment.category === 'other' ? (installment.customItemName || installment.customCategory) : `${installment.brand} ${installment.model}`).trim(),
      category: installment.category,
      khataNumber: installment.khataNumber || '—',
      totalPrice: String(installment.installmentPrice || 0),
      remainingAfterPayment: installment.remainingAmount,
      dueDate: entry.dueDate,
    });
    await payment.save({ session });
  }

  // Recalculate totals
  installment.totalPaid = installment.paymentSchedule
    .reduce((sum, e) => sum + (e.paidAmount || 0), 0);
  
  installment.remainingAmount = 
    installment.installmentPrice - (installment.advanceAmount || 0) - installment.totalPaid;
  
  installment.totalArrears = installment.paymentSchedule
    .reduce((sum, e) => sum + (e.shortfallAmount || 0), 0);

  // Update status
  if (installment.remainingAmount <= 0) {
    installment.status = 'completed';
  } else if (installment.paymentSchedule.filter(e => e.status === 'pending').length <= 3) {
    installment.status = 'near_completion';
  }

  await installment.save({ session });
  
  return {
    installment,
    entriesUpdated: updatedEntries.length,
    remainingUnallocated: remainingToDistribute,
  };
};

// @desc    Process a Bulk payment distributed via FIFO
// @route   POST /api/payments/bulk-payment
// @access  Private
export const bulkPayment = async (req, res) => {
  const isReplicaSet = mongoose.connection?.client?.topology?.description?.type === 'ReplicaSetWithPrimary' || 
                       mongoose.connection?.client?.topology?.description?.type === 'Sharded';
  const session = isReplicaSet ? await mongoose.startSession() : null;
  if (session) session.startTransaction();
  try {
    const { installmentId, totalAmount, collectedBy } = req.body;
    const result = await applyBulkPayment(installmentId, Number(totalAmount), collectedBy, session);
    if (session) await session.commitTransaction();
    res.json({
      success: true,
      message: `Bulk payment of Rs. ${totalAmount} processed successfully.`,
      ...result
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (session) session.endSession();
  }
};

// @desc    REPAIR: Recalculate schedule entry paidAmounts from Payment audit docs.
//          Fixes data corrupted by the historical overwrite bug where split payments
//          overwrote each other's paidAmount on the schedule entry.
// @route   POST /api/payments/repair-slot-statuses
// @access  Private (Owner only)
export const repairSlotStatuses = async (req, res) => {
  try {
    // 1. Load ALL Payment documents grouped by scheduleEntryId
    const allPayments = await Payment.find({}).lean();

    // Build map: scheduleEntryId -> total amount paid
    const slotTotals = {};
    for (const pmt of allPayments) {
      const key = String(pmt.scheduleEntryId);
      if (!key || key === 'null' || key === 'undefined') continue;
      slotTotals[key] = (slotTotals[key] || 0) + (pmt.amount || 0);
    }

    // 2. Load all active installments with their paymentSchedule
    const installments = await Installment.find({ isDeleted: { $ne: true } });

    let repaired = 0;
    let installmentsFixed = 0;

    for (const inst of installments) {
      let changed = false;

      for (const slot of inst.paymentSchedule) {
        const key = String(slot._id);
        const trueCumulative = slotTotals[key] || 0;
        const expected = slot.expectedAmount || 0;

        // Recalculate correct status
        let correctStatus = slot.status;
        let correctShortfall = slot.shortfallAmount || 0;

        if (trueCumulative >= expected && expected > 0) {
          correctStatus   = 'paid';
          correctShortfall = 0;
        } else if (trueCumulative > 0 && trueCumulative < expected) {
          correctStatus   = 'partially_paid';
          correctShortfall = expected - trueCumulative;
        } else if (trueCumulative === 0 && slot.status !== 'pending' && slot.status !== 'missed') {
          correctStatus   = 'pending';
          correctShortfall = 0;
        }

        // Only update if something is wrong
        if (slot.paidAmount !== trueCumulative || slot.status !== correctStatus || slot.shortfallAmount !== correctShortfall) {
          slot.paidAmount      = trueCumulative;
          slot.status          = correctStatus;
          slot.shortfallAmount = correctShortfall;
          changed = true;
          repaired++;
        }
      }

      if (changed) {
        // Recalculate installment-level totals
        inst.totalPaid = inst.paymentSchedule.reduce((s, e) => s + (e.paidAmount || 0), 0);
        inst.remainingAmount = Math.max(
          0,
          inst.installmentPrice - (inst.advanceAmount || 0) - inst.totalPaid
        );
        inst.totalArrears = inst.paymentSchedule.reduce((s, e) => s + (e.shortfallAmount || 0), 0);
        inst.installmentsPaid = inst.paymentSchedule.filter(e => e.status === 'paid').length;

        if (inst.remainingAmount <= 0) {
          inst.status = 'completed';
        } else if (inst.paymentSchedule.filter(e => e.status === 'pending').length <= 3) {
          inst.status = 'near_completion';
        } else {
          inst.status = 'active';
        }

        await inst.save();
        installmentsFixed++;
      }
    }

    res.json({
      success: true,
      message: `Repair complete. ${repaired} schedule slots fixed across ${installmentsFixed} installments.`,
      repaired,
      installmentsFixed,
    });
  } catch (error) {
    console.error('[repairSlotStatuses]', error);
    res.status(500).json({ success: false, message: 'Repair failed', error: error.message });
  }
};

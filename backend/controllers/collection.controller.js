import CollectionAssignment from '../models/CollectionAssignment.js';
import Installment from '../models/Installment.js';
import { applyBulkPayment } from './payment.controller.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Get today's collections for a worker
// @route   GET /api/collections/today?workerId=X
// @access  Private
export const getTodaysCollections = async (req, res) => {
  try {
    const { workerId } = req.query;
    if (!workerId) return res.status(400).json({ success: false, message: 'Worker ID is required' });

    // Normalize date to start and end of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const collections = await CollectionAssignment.find({
      worker: workerId,
      date: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('customer', 'fullName phone address cnic city')
      // BUG 3 FIX: Populate full installment with paymentSchedule + all fields
      // needed by CollectPaymentModal to skip the product dropdown and pre-fill
      // the payment amount.
      .populate({
        path: 'installment',
        populate: { path: 'customer', select: 'fullName phone' },
        select: 'brand model category khataNumber perInstallmentAmount remainingAmount totalInstallments scheduleType paymentSchedule status displayLabel customer',
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: collections });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update collection status
// @route   PATCH /api/collections/:id/status
// @access  Private
export const updateCollectionStatus = async (req, res) => {
  try {
    const { status, amountCollected, notes } = req.body;
    
    const collection = await CollectionAssignment.findById(req.params.id);
    if (!collection) return res.status(404).json({ success: false, message: 'Assignment not found' });

    collection.status = status;
    if (amountCollected !== undefined) collection.amountCollected = amountCollected;
    if (notes !== undefined) collection.notes = notes;

    await collection.save();

    // If collected, apply FIFO payment to installment
    if (status === 'collected') {
      const amt = Number(amountCollected) || collection.amountDue;
      await applyBulkPayment(collection.installment, amt, req.user._id, null);

      // Create system notification for all owners & managers
      const recipients = await User.find({ role: { $in: ['owner', 'manager'] } });
      const workerName = req.user.fullName || req.user.username;
      
      for (const rec of recipients) {
        await Notification.create({
          title: 'Naya Vasooli (New Collection)',
          message: `${workerName} ne customer se Rs. ${amt} vasool kar liye hain.`,
          type: 'system',
          user: rec._id,
          link: `/installments/${collection.installment}`
        });
      }
    }
    
    res.json({ success: true, data: collection });
  } catch (error) {
    console.error('[updateCollectionStatus]', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Assign a new collection task
// @route   POST /api/collections
// @access  Private
export const assignCollection = async (req, res) => {
  try {
    const { workerId, assignments } = req.body; // assignments: [{ customerId, installmentId, amountDue }]
    
    if (!workerId || !assignments || !assignments.length) {
      return res.status(400).json({ success: false, message: 'Worker ID and assignments array are required' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const createdAssignments = [];

    for (let assignment of assignments) {
      // Upsert to prevent duplicate assignments for the same day
      const record = await CollectionAssignment.findOneAndUpdate(
        { worker: workerId, installment: assignment.installmentId, date: { $gte: startOfDay } },
        {
          worker: workerId,
          customer: assignment.customerId,
          installment: assignment.installmentId,
          amountDue: assignment.amountDue,
          date: new Date(),
          assignedBy: req.user._id
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdAssignments.push(record);
    }

    res.status(201).json({ success: true, data: createdAssignments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

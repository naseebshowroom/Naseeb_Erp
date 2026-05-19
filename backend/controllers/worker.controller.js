import Worker from '../models/Worker.js';
import Installment from '../models/Installment.js';
import Customer from '../models/Customer.js';
import CollectionAssignment from '../models/CollectionAssignment.js';
import mongoose from 'mongoose';

// @desc    Get all workers
// @route   GET /api/workers
// @access  Private
export const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 });
    res.json({ success: true, data: workers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a worker
// @route   POST /api/workers
// @access  Private
export const createWorker = async (req, res) => {
  try {
    const { name, phone, zone, role, pin } = req.body;
    
    if (!name || !phone || !zone) {
      return res.status(400).json({ success: false, message: 'Name, phone, and zone are required' });
    }

    const worker = await Worker.create({
      name, phone, zone, role, pin,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a worker
// @route   PUT /api/workers/:id
// @access  Private
export const updateWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
    res.json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a worker
// @route   DELETE /api/workers/:id
// @access  Private
export const deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
    res.json({ success: true, message: 'Worker removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get collection report for a specific worker on a date
// @route   GET /api/workers/:workerId/collection-report?date=YYYY-MM-DD
// @access  Private
export const getWorkerCollectionReport = async (req, res) => {
  try {
    const { workerId } = req.params;
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Find all assignments for this worker on this day
    const assignments = await CollectionAssignment.find({
      worker: workerId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('customer').populate('installment');

    const paid = [];
    const missed = [];
    const pending = [];

    for (const assoc of assignments) {
      const row = {
        customer: assoc.customer,
        brand: assoc.installment?.brand || 'Item',
        model: assoc.installment?.model || '',
        category: assoc.installment?.category || '',
        khataNumber: assoc.installment?.khataNumber || '',
        perInstallmentAmount: assoc.amountDue || assoc.installment?.perInstallmentAmount || 0,
        scheduleEntry: {
          paidAmount: assoc.amountCollected || 0,
          status: assoc.status === 'collected' ? 'paid' : assoc.status,
          dueDate: assoc.date
        }
      };

      if (assoc.status === 'collected') {
        paid.push(row);
      } else if (assoc.status === 'missed') {
        missed.push(row);
      } else {
        pending.push(row);
      }
    }

    const totalCollected = paid.reduce((sum, r) => sum + r.scheduleEntry.paidAmount, 0);
    const totalMissed    = missed.reduce((sum, r) => sum + r.perInstallmentAmount, 0);
    const totalPending   = pending.reduce((sum, r) => sum + r.perInstallmentAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        paid, missed, pending,
        totals: {
          totalCollected,
          totalMissed,
          totalPending,
          assignedCount: assignments.length,
          collectedCount: paid.length,
          missedCount: missed.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

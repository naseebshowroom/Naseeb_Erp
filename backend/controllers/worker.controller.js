import Worker from '../models/Worker.js';
import Installment from '../models/Installment.js';
import Customer from '../models/Customer.js';

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

    // Find all installment schedule entries where collectedBy = workerId and dueDate = date
    const results = await Installment.aggregate([
      {
        $match: {
          isDeleted: false,
          isCashSale: { $ne: true },
        }
      },
      { $unwind: '$paymentSchedule' },
      {
        $match: {
          'paymentSchedule.dueDate': { $gte: startOfDay, $lte: endOfDay },
          'paymentSchedule.collectedBy': { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'paymentSchedule.collectedBy',
          foreignField: '_id',
          as: 'workerInfo'
        }
      },
      {
        $project: {
          customer: 1, brand: 1, model: 1, category: 1, khataNumber: 1,
          perInstallmentAmount: 1, scheduleEntry: '$paymentSchedule',
          workerInfo: { $arrayElemAt: ['$workerInfo', 0] }
        }
      }
    ]);

    // Also get "pending" entries for this date (not yet collected)
    const pendingResults = await Installment.aggregate([
      {
        $match: {
          isDeleted: false,
          isCashSale: { $ne: true },
          status: { $nin: ['completed', 'closed-rollover'] }
        }
      },
      { $unwind: '$paymentSchedule' },
      {
        $match: {
          'paymentSchedule.dueDate': { $gte: startOfDay, $lte: endOfDay },
          'paymentSchedule.status': 'pending',
          'paymentSchedule.collectedBy': { $exists: false }
        }
      },
      {
        $project: {
          customer: 1, brand: 1, model: 1, category: 1, khataNumber: 1,
          perInstallmentAmount: 1, scheduleEntry: '$paymentSchedule'
        }
      }
    ]);

    await Customer.populate(results, { path: 'customer', select: 'fullName phone' });
    await Customer.populate(pendingResults, { path: 'customer', select: 'fullName phone' });

    const paid    = results.filter(r => r.scheduleEntry.status === 'paid');
    const missed  = results.filter(r => r.scheduleEntry.status === 'missed');
    const pending = pendingResults;

    const totalCollected = paid.reduce((sum, r) => sum + (r.scheduleEntry.paidAmount || r.perInstallmentAmount || 0), 0);
    const totalMissed    = missed.reduce((sum, r) => sum + (r.perInstallmentAmount || 0), 0);
    const totalPending   = pending.reduce((sum, r) => sum + (r.perInstallmentAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        paid, missed, pending,
        totals: {
          totalCollected,
          totalMissed,
          totalPending,
          assignedCount: paid.length + missed.length + pending.length,
          collectedCount: paid.length,
          missedCount: missed.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

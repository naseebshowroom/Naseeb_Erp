import CollectionAssignment from '../models/CollectionAssignment.js';
import Installment from '../models/Installment.js';

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
    }).populate('customer').populate('installment').sort({ createdAt: -1 });

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
    
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
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

import Worker from '../models/Worker.js';

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
      name,
      phone,
      zone,
      role,
      pin,
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

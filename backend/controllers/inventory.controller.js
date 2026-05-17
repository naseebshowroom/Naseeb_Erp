import Inventory from '../models/Inventory.js';

export const getInventory = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = {};
    if (category) query.category = category;

    // Simplistic search on model/company/serial
    if (search) {
      query.$or = [
        { model: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { engineNo: { $regex: search, $options: 'i' } },
        { serialNo: { $regex: search, $options: 'i' } }
      ];
    }

    const inventory = await Inventory.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: inventory.length, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const addInventory = async (req, res) => {
  try {
    const { category, qty, ...rest } = req.body;
    const quantity = parseInt(qty, 10) || 1;

    const items = [];
    for (let i = 0; i < quantity; i++) {
      items.push({
        category,
        ...rest
      });
    }

    const createdItems = await Inventory.insertMany(items);

    res.status(201).json({ success: true, count: createdItems.length, data: createdItems });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error adding stock', error: error.message });
  }
};

export const getInventoryStats = async (req, res) => {
  try {
    const stats = await Inventory.aggregate([
      {
        $group: {
          _id: { category: "$category", status: "$status" },
          count: { $sum: 1 }
        }
      }
    ]);

    const summaryMoto = { total: 0, onInstallment: 0, completed: 0, available: 0 };
    const summaryElec = { total: 0, onInstallment: 0, completed: 0, available: 0 };

    stats.forEach(s => {
      const isMoto = s._id.category === 'motorcycle';
      const target = isMoto ? summaryMoto : summaryElec;

      target.total += s.count;
      if (s._id.status === 'available') target.available += s.count;
      else if (s._id.status === 'on_installment') target.onInstallment += s.count;
      else if (s._id.status === 'sold') target.completed += s.count;
    });

    res.status(200).json({ success: true, data: { motorcycle: summaryMoto, electronics: summaryElec } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const getInventoryAlerts = async (req, res) => {
  try {
    // Dummy alerts for now or basic low stock calculation
    const motoCount = await Inventory.countDocuments({ category: 'motorcycle', status: 'available' });
    const elecCount = await Inventory.countDocuments({ category: 'electronics', status: 'available' });

    const alerts = [];
    if (motoCount < 5) alerts.push({ id: 1, type: 'low_stock', message: `Motorcycle ka stock kam hai! Sirf ${motoCount} baqi hain.` });
    if (elecCount < 10) alerts.push({ id: 2, type: 'low_stock', message: `Electronics ka stock kam hai! Sirf ${elecCount} baqi hain.` });

    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

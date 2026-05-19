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

    const categories = ['motorcycle', 'electronics', 'car', 'mobile', 'ac', 'lcd', 'fridge', 'washing_machine', 'other'];
    const summary = {};
    categories.forEach(cat => {
      summary[cat] = { total: 0, onInstallment: 0, completed: 0, available: 0 };
    });

    stats.forEach(s => {
      const cat = s._id.category || 'other';
      if (!summary[cat]) {
        summary[cat] = { total: 0, onInstallment: 0, completed: 0, available: 0 };
      }
      const target = summary[cat];

      target.total += s.count;
      if (s._id.status === 'available') target.available += s.count;
      else if (s._id.status === 'on_installment') target.onInstallment += s.count;
      else if (s._id.status === 'sold') target.completed += s.count;
    });

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const getInventoryAlerts = async (req, res) => {
  try {
    const categories = [
      { id: 'motorcycle', name: 'Motorcycle', limit: 5 },
      { id: 'car', name: 'Gari', limit: 2 },
      { id: 'mobile', name: 'Mobile', limit: 5 },
      { id: 'ac', name: 'AC', limit: 3 },
      { id: 'lcd', name: 'LCD / TV', limit: 3 },
      { id: 'fridge', name: 'Fridge', limit: 3 },
      { id: 'washing_machine', name: 'Washing Machine', limit: 3 },
      { id: 'electronics', name: 'Electronics', limit: 5 }
    ];

    const alerts = [];
    let id = 1;
    for (const cat of categories) {
      const count = await Inventory.countDocuments({ category: cat.id, status: 'available' });
      if (count < cat.limit) {
        alerts.push({
          id: id++,
          type: 'low_stock',
          message: `${cat.name} ka stock kam hai! Sirf ${count} baqi hain.`
        });
      }
    }

    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

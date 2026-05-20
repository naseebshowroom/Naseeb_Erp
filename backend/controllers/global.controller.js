import Customer from '../models/Customer.js';
import Installment from '../models/Installment.js';
import Distributor from '../models/Distributor.js';
import Notification from '../models/Notification.js';
import Inventory from '../models/Inventory.js';

// @desc    Global search across multiple entities
// @route   GET /api/search
// @access  Private
export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchRegex = new RegExp(q, 'i');
    
    const [customers, installments, distributors] = await Promise.all([
      Customer.find({
        isDeleted: false,
        $or: [{ fullName: searchRegex }, { cnic: searchRegex }, { phone: searchRegex }]
      }).limit(5).select('fullName phone cnic'),
      
      Installment.find({
        isDeleted: false,
        $or: [{ brand: searchRegex }, { model: searchRegex }, { category: searchRegex }]
      }).limit(5).populate('customer', 'fullName'),
      
      Distributor.find({
        $or: [{ name: searchRegex }, { companyName: searchRegex }]
      }).limit(5).select('name companyName')
    ]);

    res.json({
      success: true,
      data: {
        customers,
        installments,
        distributors
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [{ user: req.user.id }, { type: 'system' }]
    }).sort({ createdAt: -1 }).limit(10);
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
// @desc    Public catalog — available stock (NO AUTH)
// @route   GET /api/global/public-stock
// @access  Public (no token required)
// Security: Only returns brand, model, category, color.
// costPrice, customer data, and financial details are NEVER exposed.
export const getPublicStock = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { status: 'available' };
    if (category) filter.category = category;

    const publicStock = await Inventory.find(filter)
      .select('company model category color elecType createdAt -_id')
      .sort({ createdAt: -1 })
      .lean();

    // Re-map 'company' → 'brand' for a clean public API
    const items = publicStock.map(i => ({
      brand:    i.company,
      model:    i.model,
      category: i.category,
      color:    i.color || null,
      subType:  i.elecType || null,
      addedOn:  i.createdAt,
    }));

    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

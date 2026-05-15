import ShopSettings from '../models/ShopSettings.js';

// @desc    Get global shop settings
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    let settings = await ShopSettings.findOne();
    
    if (!settings) {
      // Create defaults if not exists
      settings = await ShopSettings.create({
        shopName: 'Kiraya Installments',
        ownerName: 'Admin',
        address: 'Main Installment Market',
        city: 'Multan',
        phone: '0000-0000000',
        termsElectronics: '1. Standard Electronics Terms',
        termsMotorcycle: '1. Standard Motorcycle Terms',
        termsCar: '1. Standard Car Terms'
      });
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update global shop settings
// @route   PUT /api/settings
// @access  Private (Owner only)
export const updateSettings = async (req, res) => {
  try {
    let settings = await ShopSettings.findOne();

    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    if (settings) {
      // Update existing
      settings = await ShopSettings.findByIdAndUpdate(settings._id, updateData, {
        new: true,
        runValidators: true
      });
    } else {
      // Create new (upsert behavior)
      settings = await ShopSettings.create(updateData);
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Validation Error', error: error.message });
  }
};

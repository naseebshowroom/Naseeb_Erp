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
        shopName: 'Naseeb Installments',
        ownerName: 'Admin',
        address: 'Main Installment Market',
        city: 'Multan',
        phone: '0000-0000000',
        termsElectronics: '1. Standard Electronics Terms',
        termsMotorcycle: '1. Standard Motorcycle Terms',
        termsCar: '1. Standard Car Terms',
        receiptBrands: 'Honda / Super Power / Unique / Impress / Express / Galaxy / United',
        receiptColors: 'Red / Black / Selvar / Blue'
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

// @desc    Upload shop logo
// @route   POST /api/settings/logo
// @access  Private (Owner only)
export const uploadLogo = async (req, res) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({ success: false, message: 'Please upload a logo file' });
    }
    
    const logoUrl = req.file?.path || (req.files?.logo && req.files.logo[0]?.path);
    
    if (!logoUrl) {
       return res.status(400).json({ success: false, message: 'Logo upload failed' });
    }

    let settings = await ShopSettings.findOne();
    if (settings) {
      settings.logoUrl = logoUrl;
      await settings.save();
    } else {
      settings = await ShopSettings.create({ logoUrl });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


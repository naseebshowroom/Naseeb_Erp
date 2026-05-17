import Asset from '../models/Asset.js';
import Installment from '../models/Installment.js';
import Customer from '../models/Customer.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all assets
// @route   GET /api/assets
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getAssets = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.currentStatus = req.query.status;
    if (req.query.type)   query.assetType = req.query.type;

    const assets = await Asset.find(query)
      .populate('currentHolder.customerId', 'fullName phone')
      .populate('sourceDistributor', 'name companyName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: assets.length, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single asset with full history
// @route   GET /api/assets/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('currentHolder.customerId', 'fullName phone address')
      .populate('sourceDistributor', 'name companyName')
      .populate('linkedInstallments', 'customer status installmentPrice advanceAmount startDate khataNumber')
      .populate('history.customerId', 'fullName phone')
      .populate('history.installmentId', 'khataNumber status installmentPrice')
      .populate('history.recordedBy', 'name');

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Search asset by chassis or engine number
// @route   GET /api/assets/search?chassis=X&engine=Y
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const searchAsset = async (req, res) => {
  try {
    const { chassis, engine, serial } = req.query;
    const query = {};
    if (chassis) query.chassisNumber = { $regex: chassis.trim(), $options: 'i' };
    else if (engine) query.engineNumber = { $regex: engine.trim(), $options: 'i' };
    else if (serial) query.serialNumber = { $regex: serial.trim(), $options: 'i' };
    else return res.status(400).json({ success: false, message: 'Provide chassis, engine, or serial query param' });

    const assets = await Asset.find(query)
      .populate('currentHolder.customerId', 'fullName phone')
      .populate('linkedInstallments', 'customer status khataNumber installmentPrice');

    res.status(200).json({ success: true, count: assets.length, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new asset (when owner buys from distributor)
// @route   POST /api/assets
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const createAsset = async (req, res) => {
  try {
    const {
      assetType, chassisNumber, engineNumber, serialNumber,
      brand, model, color, year, customCategory,
      sourceDistributor, purchasePrice, purchaseDate, note
    } = req.body;

    const asset = await Asset.create({
      assetType, chassisNumber, engineNumber, serialNumber,
      brand, model, color, year, customCategory,
      sourceDistributor, purchasePrice,
      purchaseDate: purchaseDate || new Date(),
      currentStatus: 'in-stock',
      currentHolder: { holderType: 'owner' },
      history: [{
        event: 'purchased',
        date: purchaseDate || new Date(),
        amountAtEvent: purchasePrice,
        note: note || 'Purchased from distributor',
        recordedBy: req.user.id
      }]
    });

    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Validation Error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Issue an asset to a customer (link to installment)
// @route   PATCH /api/assets/:id/issue
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const issueAsset = async (req, res) => {
  try {
    const { installmentId, customerId, isCashSale, forceIssue, note } = req.body;
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    // Soft warning if already on-installment (don't block, just flag)
    const hasConflict = asset.currentStatus === 'on-installment';
    if (hasConflict && !forceIssue) {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: 'This asset is currently on-installment with another customer. Set forceIssue:true to proceed.',
        asset: {
          brand: asset.brand, model: asset.model, color: asset.color,
          currentStatus: asset.currentStatus,
          currentHolder: asset.currentHolder
        }
      });
    }

    const eventType = asset.history.length > 1 ? 're-issued' : (isCashSale ? 'sold-cash' : 'sold-installment');

    asset.currentStatus = 'on-installment';
    asset.currentHolder = { holderType: 'customer', customerId };
    asset.history.push({
      event: eventType,
      date: new Date(),
      installmentId,
      customerId,
      note: note || '',
      recordedBy: req.user.id
    });
    if (installmentId) asset.linkedInstallments.push(installmentId);
    if (hasConflict) {
      asset.hasConflictNote = true;
      asset.conflictNote = `Asset was marked on-installment at time of re-issue on ${new Date().toLocaleDateString()}`;
    }

    await asset.save();

    // Update installment with assetId
    if (installmentId) {
      await Installment.findByIdAndUpdate(installmentId, {
        assetId: asset._id,
        ...(hasConflict ? { assetConflictNote: asset.conflictNote } : {})
      });
    }

    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Mark asset as returned
// @route   PATCH /api/assets/:id/return
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const markAssetReturned = async (req, res) => {
  try {
    const { installmentId, customerId, note } = req.body;
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    asset.currentStatus = 'returned';
    asset.currentHolder = { holderType: 'owner' };
    asset.history.push({
      event: 'returned',
      date: new Date(),
      installmentId,
      customerId,
      note: note || 'Returned by customer',
      recordedBy: req.user.id
    });
    await asset.save();

    // Update installment assetStatus
    if (installmentId) {
      await Installment.findByIdAndUpdate(installmentId, { assetStatus: 'Returned' });
    }

    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Mark asset as resold to third party
//          NOTE: Installment stays ACTIVE. Customer still owes money.
// @route   PATCH /api/assets/:id/resold
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const markAssetResold = async (req, res) => {
  try {
    const { installmentId, customerId, thirdPartyName, thirdPartyPhone, thirdPartyAddress, note } = req.body;
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    asset.currentStatus = 'resold-other';
    asset.currentHolder = {
      holderType: 'third-party',
      thirdPartyName,
      thirdPartyPhone,
      thirdPartyAddress
    };
    asset.history.push({
      event: 'resold-third-party',
      date: new Date(),
      installmentId,
      customerId,
      thirdPartyName,
      thirdPartyPhone,
      note: note || 'Customer sold to third party',
      recordedBy: req.user.id
    });
    await asset.save();

    // Update installment assetStatus (installment stays ACTIVE)
    if (installmentId) {
      await Installment.findByIdAndUpdate(installmentId, {
        assetStatus: 'Resold-to-Other',
        resoldToName: thirdPartyName,
        resoldToPhone: thirdPartyPhone
      });
    }

    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Reissue asset to a new customer
// @route   PATCH /api/assets/:id/reissue
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const reissueAsset = async (req, res) => {
  try {
    const { newInstallmentId, customerId, note } = req.body;
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    asset.currentStatus = 'on-installment';
    asset.currentHolder = { holderType: 'customer', customerId };
    asset.history.push({
      event: 're-issued',
      date: new Date(),
      installmentId: newInstallmentId,
      customerId,
      note: note || 'Reissued to new customer',
      recordedBy: req.user.id
    });
    if (newInstallmentId) asset.linkedInstallments.push(newInstallmentId);

    await asset.save();

    if (newInstallmentId) {
      await Installment.findByIdAndUpdate(newInstallmentId, { assetId: asset._id });
    }

    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get full asset history (populated)
// @route   GET /api/assets/:id/history
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getAssetHistory = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('currentHolder.customerId', 'fullName phone')
      .populate('linkedInstallments', 'customer khataNumber status installmentPrice advanceAmount startDate scheduleType')
      .populate('history.customerId', 'fullName phone')
      .populate('history.installmentId', 'khataNumber status installmentPrice')
      .populate('history.recordedBy', 'name');

    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    // Populate customer inside linkedInstallments
    await Customer.populate(asset.linkedInstallments, { path: 'customer', select: 'fullName phone' });

    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

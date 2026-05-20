import mongoose from 'mongoose';
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

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Mark asset sold to NEXT party in chain (3rd, 4th, 5th...)
// @route   PATCH /api/assets/:id/resold-next
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const markResoldToNextParty = async (req, res) => {
  const isReplicaSet = mongoose.connection?.client?.topology?.description?.type === 'ReplicaSetWithPrimary' ||
                       mongoose.connection?.client?.topology?.description?.type === 'Sharded';
  const session = isReplicaSet ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const asset = await Asset.findById(req.params.id).session(session);
    if (!asset) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const { thirdPartyName, thirdPartyPhone, thirdPartyAddress, thirdPartyRelation, installmentId, soldByName, note } = req.body;

    if (!thirdPartyName || !thirdPartyPhone) {
      if (session) await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'thirdPartyName and thirdPartyPhone are required' });
    }

    const newPosition = (asset.totalHolderCount || 1) + 1;
    const eventType = newPosition === 3 ? 'resold-3rd-party' : 'resold-nth-party';
    const prevHolder = asset.currentHolder || {};

    asset.history.push({
      event: eventType,
      eventDate: new Date(),
      date: new Date(),
      installmentId: installmentId || null,
      customerId: prevHolder.customerId || null,
      customerName: prevHolder.customerId ? undefined : (soldByName || 'Previous holder'),
      holderType: 'third-party',
      thirdPartyName,
      thirdPartyPhone,
      thirdPartyAddress: thirdPartyAddress || '',
      thirdPartyRelation: thirdPartyRelation || '',
      chainPosition: newPosition,
      note: note || `Sold to ${thirdPartyName}`,
      recordedBy: req.user?._id,
    });

    asset.currentStatus = 'resold-other';
    asset.currentHolder = { holderType: 'third-party', customerId: null, thirdPartyName, thirdPartyPhone, thirdPartyAddress: thirdPartyAddress || '' };
    asset.totalHolderCount = newPosition;

    await asset.save({ session });

    if (installmentId) {
      await Installment.findByIdAndUpdate(installmentId, { assetStatus: 'Resold-to-Other', resoldToName: thirdPartyName, resoldToPhone: thirdPartyPhone }, { session });
    }

    if (session) await session.commitTransaction();
    res.json({ success: true, message: `Asset sold to ${thirdPartyName} (Chain Position #${newPosition})`, data: asset });
  } catch (err) {
    if (session) await session.abortTransaction();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (session) session.endSession();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Mark asset returned to owner (with isRepossession + condition)
// @route   PATCH /api/assets/:id/returned
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const markReturnedToOwner = async (req, res) => {
  const isReplicaSet = mongoose.connection?.client?.topology?.description?.type === 'ReplicaSetWithPrimary' ||
                       mongoose.connection?.client?.topology?.description?.type === 'Sharded';
  const session = isReplicaSet ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const asset = await Asset.findById(req.params.id).session(session);
    if (!asset) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const { returnedBy, returnedByPhone, installmentId, isRepossession, condition, reason, note } = req.body;
    const eventType = isRepossession ? 'repossessed' : 'returned-to-owner';
    const newPosition = (asset.totalHolderCount || 1) + 1;

    let entryNote = note || (isRepossession
      ? `Repossessed from ${returnedBy || 'holder'}`
      : `Returned by ${returnedBy || 'holder'} (${returnedByPhone || '—'})`
    );
    if (condition && condition !== 'good') entryNote += ` | Condition: ${condition}`;

    asset.history.push({
      event: eventType,
      eventDate: new Date(),
      date: new Date(),
      installmentId: installmentId || null,
      holderType: 'owner',
      chainPosition: newPosition,
      thirdPartyName: returnedBy || '',
      thirdPartyPhone: returnedByPhone || '',
      note: entryNote,
      recordedBy: req.user?._id,
    });

    asset.currentStatus = 'returned';
    asset.currentHolder = { holderType: 'owner', customerId: null, thirdPartyName: null, thirdPartyPhone: null };
    asset.totalHolderCount = newPosition;

    await asset.save({ session });

    if (installmentId) {
      await Installment.findByIdAndUpdate(installmentId, { assetStatus: 'Returned' }, { session });
    }

    if (session) await session.commitTransaction();
    res.json({ success: true, message: 'Asset returned to owner. Ready for reissue.', data: asset, canBeReissued: true });
  } catch (err) {
    if (session) await session.abortTransaction();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (session) session.endSession();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get smart asset alerts for notification bell
// @route   GET /api/assets/alerts
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getAssetAlerts = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const alerts = [];

    // Alert 1: Assets returned in last 7 days
    const recentlyReturned = await Asset.find({ currentStatus: { $in: ['returned', 'repossessed'] }, updatedAt: { $gte: sevenDaysAgo } })
      .select('brand model color chassisNumber updatedAt').lean();

    recentlyReturned.forEach(asset => {
      alerts.push({
        type: 'asset-returned',
        severity: 'success',
        title: 'Asset Available for Reissue',
        message: `${asset.brand || ''} ${asset.model || ''} ${asset.color ? '(' + asset.color + ')' : ''} wapas aa gaya hai. Kisi naye customer ko de sakte hain.`.trim(),
        asset: { _id: asset._id, name: `${asset.brand || ''} ${asset.model || ''}`.trim(), chassisNumber: asset.chassisNumber },
        actionUrl: `/assets/${asset._id}/history`,
        actionLabel: 'View & Reissue',
        createdAt: asset.updatedAt,
      });
    });

    // Alert 2: Resold assets with overdue payments
    const resoldAssets = await Asset.find({ currentStatus: 'resold-other' })
      .select('_id brand model linkedInstallments currentHolder')
      .populate({ path: 'linkedInstallments', match: { status: { $in: ['active', 'near_completion'] } }, select: 'customer remainingAmount totalArrears paymentSchedule status', populate: { path: 'customer', select: 'fullName phone' } })
      .lean();

    resoldAssets.forEach(asset => {
      (asset.linkedInstallments || []).forEach(inst => {
        if (!inst) return;
        const hasOverdue = (inst.paymentSchedule || []).some(e => e.status === 'missed' && new Date(e.dueDate) < new Date());
        if (hasOverdue) {
          alerts.push({
            type: 'resold-overdue',
            severity: 'warning',
            title: 'Resold Asset — Overdue Payment',
            message: `${asset.brand || ''} ${asset.model || ''} kisi aur ke paas hai lekin ${inst.customer?.fullName || 'customer'} ki qistain miss ho rahi hain.`,
            asset: { _id: asset._id, name: `${asset.brand || ''} ${asset.model || ''}`.trim() },
            installment: { _id: inst._id, customerName: inst.customer?.fullName, customerPhone: inst.customer?.phone, remainingAmount: inst.remainingAmount, totalArrears: inst.totalArrears },
            actionUrl: `/installments/${inst._id}`,
            actionLabel: 'View Installment',
            createdAt: new Date(),
          });
        }
      });
    });

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get asset by exact chassis number
// @route   GET /api/assets/by-chassis/:chassisNumber
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getAssetByChassis = async (req, res) => {
  try {
    const asset = await Asset.findOne({
      chassisNumber: { $regex: `^${req.params.chassisNumber.trim()}$`, $options: 'i' },
    })
      .populate('currentHolder.customerId', 'fullName phone')
      .populate('linkedInstallments', 'status remainingAmount customer khataNumber installmentPrice')
      .lean();

    if (!asset) return res.json({ success: true, found: false, canCreateNew: true });

    const STATUS_ALERTS = {
      'in-stock':       { type: 'success', message: 'Available — Issue kar sakte hain' },
      'returned':       { type: 'success', message: 'Wapas aa gaya — Issue kar sakte hain' },
      'repossessed':    { type: 'success', message: 'Wapas liya — Issue kar sakte hain' },
      'on-installment': { type: 'warning', message: 'Abhi kisi customer ke paas hai' },
      'resold-other':   { type: 'warning', message: '3rd/Nth party ke paas hai' },
    };

    res.json({
      success: true,
      found: true,
      data: {
        ...asset,
        canIssueNow: ['in-stock', 'returned', 'repossessed'].includes(asset.currentStatus),
        statusAlert: STATUS_ALERTS[asset.currentStatus] || { type: 'info', message: asset.currentStatus },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


import mongoose from 'mongoose';

/**
 * Asset Model — tracks ONE physical item (bike/product)
 * across its entire life in the business.
 *
 * KEY DESIGN PRINCIPLE:
 * - chassisNumber and engineNumber are NOT unique at the Installment level.
 * - Same bike can appear in multiple installments over time (reissued).
 * - This Asset model is the SINGLE SOURCE OF TRUTH for any physical item.
 * - Installment.chassisNumber is just a display copy — Asset._id is the real link.
 */

const historyEntrySchema = new mongoose.Schema({
  event: {
    type: String,
    enum: [
      'purchased',          // Owner bought from distributor
      'sold-installment',   // Given to customer on installment
      'sold-cash',          // Given to customer cash sale
      'returned',           // Customer returned to owner
      'resold-third-party', // Customer sold to someone else (installment still active)
      'repossessed',        // Owner took back due to default
      're-issued',          // Owner gave same bike to a NEW customer
      'written-off'         // Lost, stolen, totaled
    ],
    required: true
  },
  date: { type: Date, default: Date.now },

  // Which installment this event relates to
  installmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Installment'
  },

  // Who was involved
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  thirdPartyName:    { type: String },
  thirdPartyPhone:   { type: String },

  // Financial info at time of event
  amountAtEvent: { type: Number },

  note: { type: String },

  // Who recorded this in system
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

const assetSchema = new mongoose.Schema({

  // Physical identity
  assetType: {
    type: String,
    enum: ['motorcycle', 'car', 'mobile', 'ac', 'lcd', 'fridge', 'washing_machine', 'other'],
    required: true
  },

  // For motorcycles / cars
  chassisNumber:  { type: String },
  engineNumber:   { type: String },
  brand:          { type: String }, // Honda, Yamaha
  model:          { type: String }, // CD70, CG125
  color:          { type: String },
  year:           { type: Number },

  // For electronics
  serialNumber:   { type: String },

  // Category-specific display label (when assetType = 'other')
  customCategory: { type: String },

  // Where this asset came from
  sourceDistributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distributor'
  },
  purchasePrice:  { type: Number },
  purchaseDate:   { type: Date },

  // Current status of the physical asset
  currentStatus: {
    type: String,
    enum: [
      'in-stock',       // With owner, available
      'on-installment', // Given to a customer
      'returned',       // Returned by customer, back with owner
      'resold-other',   // Customer sold to someone else (owner still tracking)
      'written-off'     // Lost, stolen, totaled
    ],
    default: 'in-stock'
  },

  // Current holder — who physically has this item right now
  currentHolder: {
    holderType: {
      type: String,
      enum: ['owner', 'customer', 'third-party']
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    thirdPartyName:    { type: String },
    thirdPartyPhone:   { type: String },
    thirdPartyAddress: { type: String }
  },

  // FULL HISTORY CHAIN — the core of lifecycle tracking
  history: [historyEntrySchema],

  // Quick reference: every installment ever linked to this physical asset
  linkedInstallments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Installment'
  }],

  // Flag if asset was issued while still marked on-installment (edge case)
  hasConflictNote: { type: Boolean, default: false },
  conflictNote:    { type: String },

}, { timestamps: true });

// ── Indexes for fast lookup (NOT unique — same chassis = multiple records is invalid,
//    but this model has ONE record per physical bike searched by chassis) ──────────
assetSchema.index({ chassisNumber: 1 });
assetSchema.index({ engineNumber: 1 });
assetSchema.index({ serialNumber: 1 });
assetSchema.index({ currentStatus: 1 });
assetSchema.index({ assetType: 1 });

export default mongoose.model('Asset', assetSchema);

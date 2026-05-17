import mongoose from 'mongoose';

// ──────────────────────────────────────────────────────────────────────────────
// PaymentSchedule Entry Schema
// Each entry represents one due date in the installment plan.
// ──────────────────────────────────────────────────────────────────────────────
const paymentScheduleSchema = new mongoose.Schema({
  dueDate: { type: Date, required: true },
  expectedAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  shortfallAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: [
      'pending',
      'paid',
      'partially_paid',
      'missed',
      'carried_over',
    ],
    default: 'pending',
  },
  paidDate: { type: Date },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String },
}, { _id: true });

// ──────────────────────────────────────────────────────────────────────────────
// Installment Schema
// ──────────────────────────────────────────────────────────────────────────────
const installmentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },

  // Khata number — owner types manually, shown on all documents
  khataNumber: { type: String, trim: true },

  // Which investor's money was used for this deal
  investorName: {
    type: String,
    enum: ['Owner', 'Partner-Brother', 'Partner-1', 'Partner-2', 'Other'],
    default: 'Owner'
  },

  category: {
    type: String,
    enum: ['mobile', 'ac', 'tv', 'lcd', 'washing_machine', 'fridge', 'motorcycle', 'car', 'other'],
    required: true
  },

  // Used when category = 'other', owner types: "Fan", "Speaker", etc.
  customCategory: { type: String },
  
  // Product details
  brand:              { type: String },
  model:              { type: String },
  color:              { type: String },
  serialNumber:       { type: String },

  // NOTE: chassisNumber and engineNumber are NOT unique.
  // Same bike can appear in multiple installments over time (returned & reissued).
  // Use assetId (Asset model) for full lifecycle tracking.
  // Use assetStatus field to track current state.
  // Do NOT add unique: true to these fields.
  engineNumber:       { type: String },
  chassisNumber:      { type: String },
  registrationNumber: { type: String },
  year:               { type: Number },
  company:            { type: String },
  condition:          { type: String, enum: ['new', 'used'] },

  // Link to the physical Asset record (source of truth for lifecycle)
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },

  // Flag if asset was issued with a conflict (already on-installment)
  assetConflictNote: { type: String },

  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distributor'
  },

  // ── Financial ──────────────────────────────────────────────────────────────
  purchasePrice:    { type: Number, required: true },
  installmentPrice: { type: Number, required: true },
  profitMargin:     { type: Number },

  // ── Cash Sale ──────────────────────────────────────────────────────────────
  // When true: no installment plan. Only registration fee + total price.
  isCashSale:       { type: Boolean, default: false },
  registrationFee:  { type: Number, default: 0 },

  // ── Plan ───────────────────────────────────────────────────────────────────
  // advanceAmount = 0 is valid (no advance). Shows "No Advance Given" on documents.
  advanceAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number },

  // totalInstallments is OPTIONAL — owner may not know upfront.
  // When empty: "Open-ended installment plan" shown.
  totalInstallments: { type: Number },

  // perInstallmentAmount is entered MANUALLY by owner. Do NOT auto-calculate.
  perInstallmentAmount: { type: Number },

  scheduleType: {
    type: String,
    enum: ['daily', 'weekly', '5-day', '10-day', 'monthly'],
  },
  startDate: { type: Date },

  paymentSchedule: [paymentScheduleSchema],

  // ── Asset Status ───────────────────────────────────────────────────────────
  // Tracks whether the item is still with original customer, returned, or resold.
  // NOTE: 'Resold-to-Other' does NOT cancel installments — customer still owes money.
  assetStatus: {
    type: String,
    enum: ['In-Use', 'Returned', 'Resold-to-Other'],
    default: 'In-Use'
  },

  // When assetStatus = 'Resold-to-Other'
  resoldToName:  { type: String },
  resoldToPhone: { type: String },

  // ── Status ─────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['active', 'near_completion', 'completed', 'closed-rollover'],
    default: 'active'
  },
  totalPaid:         { type: Number, default: 0 },
  totalArrears:      { type: Number, default: 0 },
  installmentsPaid:  { type: Number, default: 0 },

  // For rollover: link to the previous installment that was closed
  previousInstallmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Installment'
  },

  notes: { type: String },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// ──────────────────────────────────────────────────────────────────────────────
// Pre-save hook
// - Calculate profitMargin from prices
// - Calculate remainingAmount
// - DO NOT auto-calculate perInstallmentAmount (owner types it manually)
// ──────────────────────────────────────────────────────────────────────────────
installmentSchema.pre('save', function(next) {
  if (this.isModified('purchasePrice') || this.isModified('installmentPrice')) {
    this.profitMargin = Math.round(this.installmentPrice - this.purchasePrice);
  }
  
  if (this.isModified('installmentPrice') || this.isModified('advanceAmount') || this.isModified('totalPaid')) {
    this.remainingAmount = Math.round(
      this.installmentPrice - (this.advanceAmount || 0) - (this.totalPaid || 0)
    );
  }

  // NOTE: perInstallmentAmount is NOT auto-calculated here.
  // Owner enters it manually in the wizard.
  
  next();
});

// Soft delete middleware
installmentSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Indexes for high performance lookups
installmentSchema.index({ customer: 1 });
installmentSchema.index({ status: 1 });
installmentSchema.index({ category: 1 });
installmentSchema.index({ 'paymentSchedule.dueDate': 1 });
installmentSchema.index({ 'paymentSchedule.status': 1 });
installmentSchema.index({ createdAt: -1 });

export default mongoose.model('Installment', installmentSchema);

import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  installment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Installment',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  scheduleEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'bank', 'other'],
    required: true,
    default: 'cash'
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paidDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },
  notes: {
    type: String
  },

  // ── SPLIT / PARTIAL PAYMENT TRACKING ──
  // When a single schedule slot is paid in multiple installments,
  // these fields group those transactions together.
  relatedDueDate:       { type: Date },     // the due date of the schedule slot this covers
  isPartOfSplitPayment: { type: Boolean, default: false }, // true when slot covered in multiple payments
  splitPaymentGroup:    { type: String },   // key: "installmentId_slotId"

  // ── SNAPSHOT FIELDS ──
  // These denormalized fields ensure that even if
  // a customer profile is edited or deleted, payments
  // retain their structural log. Super fast for reporting.
  customerName:    { type: String, required: true },
  customerPhone:   { type: String, required: true },
  itemDescription: { type: String, required: true }, // brand + model
  category:        { type: String, required: true },
  khataNumber:     { type: String, required: true },
  totalPrice:      { type: String, required: true },
  remainingAfterPayment: { type: Number, required: true },
  dueDate:         { type: Date, required: true },

}, { timestamps: true });

// COMPOUND INDEXES
// Speed up filters on payments page and ledger reports
paymentSchema.index({ installment: 1, paidDate: -1 });
paymentSchema.index({ collectedBy: 1, paidDate: -1 });
paymentSchema.index({ paidDate: -1 });
paymentSchema.index({ splitPaymentGroup: 1 });
paymentSchema.index({ scheduleEntryId: 1, paidDate: -1 });

export default mongoose.model('Payment', paymentSchema);

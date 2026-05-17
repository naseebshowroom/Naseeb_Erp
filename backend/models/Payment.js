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
  amount: {
    type: Number,
    required: true
  },
  expectedAmount: {
    type: Number
  },
  shortfall: {
    type: Number,
    default: 0
  },
  status: {
    type: String
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'bank', 'other'],
    default: 'cash'
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collectorName: {
    type: String  // Free-text name of who collected (owner/worker name)
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  },
  receiptNumber: {
    type: String,
    unique: true
  },
  scheduleEntryId: {
    type: mongoose.Schema.Types.ObjectId
  },
  isAdvance: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Auto-generate receipt number: RCP-YYYY-NNNN
paymentSchema.pre('save', async function(next) {
  if (!this.isNew) return next();

  try {
    const currentYear = new Date().getFullYear();
    // Find highest receipt number for current year
    const lastPayment = await this.constructor.findOne(
      { receiptNumber: new RegExp(`^RCP-${currentYear}-`) },
      { receiptNumber: 1 }
    ).sort({ createdAt: -1 });

    let sequence = 1;
    if (lastPayment && lastPayment.receiptNumber) {
      const parts = lastPayment.receiptNumber.split('-');
      if (parts.length === 3) {
        sequence = parseInt(parts[2], 10) + 1;
      }
    }

    this.receiptNumber = `RCP-${currentYear}-${sequence.toString().padStart(4, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Indexes for super fast payment query lookups
paymentSchema.index({ installment: 1 });
paymentSchema.index({ collectedBy: 1 });
paymentSchema.index({ paymentDate: -1 });

export default mongoose.model('Payment', paymentSchema);

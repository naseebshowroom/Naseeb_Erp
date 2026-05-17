import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { _id: false });

const distributorOutstandingSchema = new mongoose.Schema({
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distributor',
    required: true
  },
  items: [itemSchema],
  payments: [{
    amount:      { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    notes:       { type: String, default: '' },
    recordedAt:  { type: Date, default: Date.now },
  }],
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  }
}, { timestamps: true });

// Auto-calculate balance and status
distributorOutstandingSchema.pre('save', function(next) {
  // Re-calculate totalAmount if items array changed
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  // Calculate balance
  this.balance = this.totalAmount - this.amountPaid;

  // Set status
  if (this.balance <= 0 && this.totalAmount > 0) {
    this.status = 'paid';
  } else if (this.amountPaid > 0 && this.balance > 0) {
    this.status = 'partial';
  } else {
    this.status = 'pending';
  }

  next();
});

export default mongoose.model('DistributorOutstanding', distributorOutstandingSchema);

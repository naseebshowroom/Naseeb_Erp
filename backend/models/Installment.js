import mongoose from 'mongoose';

const paymentScheduleSchema = new mongoose.Schema({
  dueDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'missed'], 
    default: 'pending' 
  },
  paidDate: { type: Date },
  paidAmount: { type: Number }
}, { _id: true });

const installmentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  category: {
    type: String,
    enum: ['mobile', 'ac', 'lcd', 'washing_machine', 'fridge', 'motorcycle', 'car', 'other'],
    required: true
  },
  
  // Product details
  brand: { type: String },
  model: { type: String },
  color: { type: String },
  serialNumber: { type: String },
  engineNumber: { type: String },
  chassisNumber: { type: String },
  registrationNumber: { type: String },
  year: { type: Number },
  company: { type: String },
  condition: { type: String, enum: ['new', 'used'] },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distributor'
  },
  
  // Financial
  purchasePrice: { type: Number, required: true },
  installmentPrice: { type: Number, required: true },
  profitMargin: { type: Number },
  
  // Plan
  advanceAmount: { type: Number, required: true },
  remainingAmount: { type: Number },
  totalInstallments: { type: Number, required: true },
  perInstallmentAmount: { type: Number },
  scheduleType: {
    type: String,
    enum: ['daily', 'weekly', '5day', '10day', 'monthly'],
    required: true
  },
  startDate: { type: Date, required: true },
  
  paymentSchedule: [paymentScheduleSchema],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'near_completion', 'completed'],
    default: 'active'
  },
  totalPaid: { type: Number, default: 0 },
  installmentsPaid: { type: Number, default: 0 },
  
  notes: { type: String },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-calculate remaining, profit, and per-installment
installmentSchema.pre('save', function(next) {
  if (this.isModified('purchasePrice') || this.isModified('installmentPrice')) {
    this.profitMargin = this.installmentPrice - this.purchasePrice;
  }
  
  if (this.isModified('installmentPrice') || this.isModified('advanceAmount')) {
    this.remainingAmount = this.installmentPrice - this.advanceAmount;
  }
  
  if (this.isModified('remainingAmount') || this.isModified('totalInstallments')) {
    this.perInstallmentAmount = this.remainingAmount / this.totalInstallments;
  }
  
  next();
});

// Soft delete middleware
installmentSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

export default mongoose.model('Installment', installmentSchema);

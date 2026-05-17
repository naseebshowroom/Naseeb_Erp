import mongoose from 'mongoose';

const agreementRecordSchema = new mongoose.Schema({
  installment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Installment',
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  documentType: {
    type: String,
    enum: ['electronics_agreement', 'motorcycle_agreement', 'car_agreement', 'sale_receipt'],
    required: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  printedAt: {
    type: Date,
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { 
  timestamps: true 
});

// One record per installment per document type
agreementRecordSchema.index({ installment: 1, documentType: 1 }, { unique: true });

export default mongoose.model('AgreementRecord', agreementRecordSchema);

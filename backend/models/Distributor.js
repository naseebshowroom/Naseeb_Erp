import mongoose from 'mongoose';

const distributorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  cnic: { type: String },
  notes: { type: String },
  category: {
    type: String,
    enum: ['motorcycle', 'electronics', 'car', 'other'],
    default: 'other',
  },
}, { timestamps: true });

export default mongoose.model('Distributor', distributorSchema);

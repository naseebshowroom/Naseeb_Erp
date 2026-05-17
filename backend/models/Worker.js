import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  zone: { type: String, required: true },
  role: { type: String, default: 'collector' }, // e.g., collector, recovery
  pin: { type: String }, // For mobile app login if needed
  isActive: { type: Boolean, default: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

export default mongoose.model('Worker', workerSchema);

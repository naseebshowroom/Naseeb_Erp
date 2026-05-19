import mongoose from 'mongoose';

const collectionAssignmentSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  installment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Installment',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amountDue: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'collected', 'missed'],
    default: 'pending'
  },
  amountCollected: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Prevent duplicate assignments for the same installment on the same day
collectionAssignmentSchema.index({ worker: 1, installment: 1, date: 1 }, { unique: true });

export default mongoose.model('CollectionAssignment', collectionAssignmentSchema);

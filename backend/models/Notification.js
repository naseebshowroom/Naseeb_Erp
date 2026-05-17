import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['overdue', 'stock', 'completion', 'system'],
    default: 'system'
  },
  read: { type: Boolean, default: false },
  link: { type: String }, // e.g., /customers/:id
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);

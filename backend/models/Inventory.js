import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['motorcycle', 'electronics'],
    required: true
  },
  elecType: { 
    type: String // Mobile Phone, Air Conditioner, etc.
  },
  status: {
    type: String,
    enum: ['available', 'on_installment', 'sold'],
    default: 'available'
  },
  
  company: { type: String, required: true }, // brand/company
  model: { type: String, required: true },
  color: { type: String },
  
  engineNo: { type: String },
  chassisNo: { type: String },
  
  serialNo: { type: String }, // IMEI or Serial
  
  purchasePrice: { type: Number, required: true },
  
  distributor: { type: String },
  
  installment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Installment'
  },
  customerName: { type: String }, 
  
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

inventorySchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

export default mongoose.model('Inventory', inventorySchema);

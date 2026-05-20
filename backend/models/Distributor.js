import mongoose from 'mongoose';

const suppliedItemSchema = new mongoose.Schema({
  brand:          { type: String },
  make:           { type: String }, // e.g., Honda, Yamaha
  model:          { type: String }, // e.g., CD70, CG125
  chassisNumber:  { type: String },
  engineNumber:   { type: String },
  color:          { type: String },
  dateSupplied:   { type: Date },
  quantity:       { type: Number, default: 1 },
  unitPrice:      { type: Number },
  assignedToInstallment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Installment'
  },
  status: {
    type: String,
    enum: ['In-Stock', 'Sold', 'Returned'],
    default: 'In-Stock'
  }
}, { _id: true, timestamps: true });

const distributorSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  companyName: { type: String, required: true },
  phone:       { type: String, required: true },
  address:     { type: String },
  cnic:        { type: String },
  notes:       { type: String },
  category: {
    type: String,
    enum: ['motorcycle', 'electronics', 'car', 'other'],
    required: true,
  },

  // Item tracking — each unit supplied by this distributor
  suppliedItems: [suppliedItemSchema],

}, { timestamps: true });

export default mongoose.model('Distributor', distributorSchema);

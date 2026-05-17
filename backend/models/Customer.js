import mongoose from 'mongoose';

const guarantorSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['business', 'government'],
    required: true
  },
  fullName: { type: String, required: true },
  cnic: { 
    type: String, 
    required: true,
    match: [/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/, 'Invalid CNIC format']
  },
  phone: { 
    type: String, 
    required: true,
    match: [/^03[0-9]{2}-[0-9]{7}$/, 'Invalid Phone format']
  },
  address: { type: String, required: true },
  
  // Business Specific
  businessName: { type: String },
  businessType: { type: String },
  
  // Government Specific
  department: { type: String },
  designation: { type: String },
  employeeId: { type: String }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  fatherName: { type: String, required: true, trim: true },
  cnic: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/, 'Invalid CNIC format']
  },
  phone: { 
    type: String, 
    required: true,
    match: [/^03[0-9]{2}-[0-9]{7}$/, 'Invalid Phone format']
  },
  alternatePhone: { type: String },
  address: { type: String, required: true },
  city: { type: String, required: true },
  
  // Uploaded documents URLs (Cloudinary)
  photo: { type: String },
  cnicFront: { type: String },
  cnicBack: { type: String },
  
  status: {
    type: String,
    enum: ['active', 'completed', 'defaulted'],
    default: 'active'
  },
  

  guarantors: [guarantorSchema],
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isDeleted: { type: Boolean, default: false } // Soft delete
}, { timestamps: true });

// Prevent soft-deleted customers from appearing in queries by default
customerSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

export default mongoose.model('Customer', customerSchema);

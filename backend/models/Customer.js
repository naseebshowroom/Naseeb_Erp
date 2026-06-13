import mongoose from 'mongoose';

const guarantorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  fatherName: { type: String },
  cnic: { type: String },
  phone: { type: String, required: true },
  address: { type: String },
  // BUG 2 FIX: Removed the English-only enum restriction.
  // Old: enum: ['Brother', 'Father', 'Son', 'Friend', 'Colleague', ...]
  // This caused a Mongoose ValidationError when saving any Urdu/Roman-Urdu
  // relation text (e.g. 'Bhabi', 'Khaala', 'دوست').
  // Now: free text, trimmed, any language/script accepted.
  relation: { type: String, trim: true },
  profession: { type: String },
  // Government Specific
  department: { type: String },
  designation: { type: String },
  employeeId: { type: String },
  // Business Specific
  businessName: { type: String },
  businessType: { type: String },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  fatherName: { type: String, required: true, trim: true },

  // CNIC is OPTIONAL — sparse unique so multiple blank values don't conflict
  cnic: { 
    type: String, 
    sparse: true,          // null/undefined values are excluded from unique index
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

  // Khata number — owner types manually, appears on all documents
  khataNumber: { type: String, trim: true },
  
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

// Indexes for super fast search and phone matches
customerSchema.index({ fullName: 'text' });
customerSchema.index({ phone: 1 });

export default mongoose.model('Customer', customerSchema);

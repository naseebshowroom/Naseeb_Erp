import mongoose from 'mongoose';

const shopSettingsSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  ownerName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  phone: { type: String, required: true },
  logo: { type: String }, // Cloudinary URL
  
  // Agreement Default Templates
  termsElectronics: { type: String },
  termsMotorcycle: { type: String },
  termsCar: { type: String },
  
  // Custom Receipt Layout Elements
  receiptBrands: { type: String, default: 'Honda / Super Power / Unique / Impress / Express / Galaxy / United' },
  receiptColors: { type: String, default: 'Red / Black / Selvar / Blue' },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

export default mongoose.model('ShopSettings', shopSettingsSchema);

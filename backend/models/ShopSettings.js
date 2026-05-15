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
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

export default mongoose.model('ShopSettings', shopSettingsSchema);

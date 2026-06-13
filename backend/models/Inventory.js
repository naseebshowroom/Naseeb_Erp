import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  // ── Item Info ──────────────────────────────────────────────
  category: {
    type: String,
    enum: ['motorcycle', 'electronics', 'car', 'mobile', 'ac', 'lcd', 'fridge', 'washing_machine', 'other'],
    required: true
  },
  elecType: { type: String }, // Mobile Phone, Air Conditioner, etc.

  company:  { type: String, required: true }, // brand / company name
  model:    { type: String, required: true },
  color:    { type: String },

  engineNo:  { type: String },
  chassisNo: { type: String },
  serialNo:  { type: String }, // IMEI or Serial

  purchasePrice: { type: Number, required: true },

  // ── Distributor / Supplier ──────────────────────────────────
  // Can be an ObjectId (linked) or a plain string (legacy text)
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distributor',
    default: null,
  },
  distributorName: { type: String }, // denormalized snapshot for quick display

  // ── Purchase Type ───────────────────────────────────────────
  // 'cash'   = owner paid distributor immediately (naqd)
  // 'credit' = still owes distributor (udhaar)
  purchaseType: {
    type: String,
    enum: ['cash', 'credit'],
    default: 'credit',
  },

  // ── BUG 3 FIX: Ownership / Malikiyat ─────────────────────────────
  // Tracks whether this item belongs to the shop owner or a business partner.
  // Selected at creation time in the "Naya Khata" wizard; displayed on the
  // Saman Ki Tafseel card in InstallmentDetail.
  ownership: {
    type: String,
    enum: ['owner', 'partner'],
    default: 'owner',
  },
  // Only populated when ownership === 'partner'
  partnerName: {
    type: String,
    default: null,
  },

  // ── Stock Status ────────────────────────────────────────────
  // available           → dukan mein maujood hai
  // on_installment      → customer ko qist par diya gaya hai
  // sold_cash           → naqd bikra gaya hai
  // market_installment  → market mein kisi ko installment par diya gaya hai
  // returned_to_supplier→ wapas distributor ko bheja gaya
  status: {
    type: String,
    enum: ['available', 'on_installment', 'sold_cash', 'market_installment', 'returned_to_supplier'],
    default: 'available'
  },

  // ── Linked records ─────────────────────────────────────────
  installment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Installment'
  },
  customerName: { type: String },

  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Soft-delete middleware
inventorySchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Indexes for fast filtering
inventorySchema.index({ status: 1 });
inventorySchema.index({ distributor: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ purchaseType: 1 });

export default mongoose.model('Inventory', inventorySchema);

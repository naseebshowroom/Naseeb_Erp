import mongoose from 'mongoose';
import Customer from '../models/Customer.js';

// @desc    Get all customers (with pagination, search, filter)
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query object
    const query = {};
    
    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    
    // Search filter (regex on name, cnic, phone)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { fullName: searchRegex },
        { cnic: searchRegex },
        { phone: searchRegex }
      ];
    }

    const total = await Customer.countDocuments(query);
    
    // Use aggregation to join with installments and get active product categories
    const customers = await Customer.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: startIndex },
      { $limit: limit },
      {
        $lookup: {
          from: 'installments',
          localField: '_id',
          foreignField: 'customer',
          as: 'installments'
        }
      },
      {
        $addFields: {
          activeCategories: {
            $reduce: {
              input: "$installments",
              initialValue: [],
              in: {
                $cond: [
                  { $and: [{ $ne: ["$$this.isDeleted", true] }, { $ne: ["$$this.status", "completed"] }] },
                  { $setUnion: ["$$value", ["$$this.category"]] },
                  "$$value"
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          installments: 0 // Remove the full installments array to keep payload small
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: customers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get single customer by ID
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Gahak nahi mila' });
    }

    // Fetch associated data
    const [installments, payments] = await Promise.all([
      mongoose.model('Installment').find({ customer: customer._id, isDeleted: false }).lean(),
      mongoose.model('Payment').find({ customer: customer._id }).populate('installment').sort({ paymentDate: -1 }).lean()
    ]);

    res.status(200).json({ 
      success: true, 
      data: {
        ...customer,
        installments,
        payments
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res) => {
  try {
    const customerData = { ...req.body };
    customerData.createdBy = req.user.id;
    
    // Handle Cloudinary file uploads from Multer
    if (req.files) {
      if (req.files.photo) customerData.photo = req.files.photo[0].path;
      if (req.files.cnicFront) customerData.cnicFront = req.files.cnicFront[0].path;
      if (req.files.cnicBack) customerData.cnicBack = req.files.cnicBack[0].path;
    }

    // Parse JSON stringified guarantors if sent as form-data
    if (typeof customerData.guarantors === 'string') {
      customerData.guarantors = JSON.parse(customerData.guarantors);
    }

    const customer = await Customer.create(customerData);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    // Mongoose duplicate key error (e.g. duplicate CNIC)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'CNIC already registered' });
    }
    res.status(400).json({ success: false, message: 'Validation Error', error: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res) => {
  try {
    const customerData = { ...req.body };
    
    if (req.files) {
      if (req.files.photo) customerData.photo = req.files.photo[0].path;
      if (req.files.cnicFront) customerData.cnicFront = req.files.cnicFront[0].path;
      if (req.files.cnicBack) customerData.cnicBack = req.files.cnicBack[0].path;
    }

    if (typeof customerData.guarantors === 'string') {
      customerData.guarantors = JSON.parse(customerData.guarantors);
    }

    const customer = await Customer.findByIdAndUpdate(req.params.id, customerData, {
      new: true,
      runValidators: true
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'CNIC already registered' });
    }
    res.status(400).json({ success: false, message: 'Validation Error', error: error.message });
  }
};

// @desc    Soft delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Owner/Manager only)
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.isDeleted = true;
    await customer.save();

    res.status(200).json({ success: true, message: 'Customer successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get customer summary (stats)
// @route   GET /api/customers/:id/summary
// @access  Private
export const getCustomerSummary = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const Installment = mongoose.model('Installment');
    const Payment = mongoose.model('Payment');

    const installments = await Installment.find({ customer: req.params.id, isDeleted: false });
    
    let totalInstallments = installments.length;
    let totalPaid = 0;
    let remainingBalance = 0;

    installments.forEach(inst => {
      totalPaid += (inst.advanceAmount || 0); // Advance is part of paid
      remainingBalance += (inst.remainingAmount || 0);
    });

    const payments = await Payment.find({ customer: req.params.id, status: 'completed' });
    payments.forEach(pay => {
      totalPaid += (pay.amount || 0);
    });

    const summary = {
      totalInstallments,
      totalPaid,
      remainingBalance
    };

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Search customers globally
// @route   GET /api/customers/search
// @access  Private
export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const searchRegex = new RegExp(q, 'i');
    const customers = await Customer.find({
      isDeleted: false,
      $or: [
        { fullName: searchRegex },
        { cnic: searchRegex },
        { phone: searchRegex }
      ]
    }).limit(10).select('fullName cnic phone');

    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get top overdue customers
// @route   GET /api/customers/overdue
// @access  Private
export const getOverdueCustomers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const Installment = mongoose.model('Installment');
    
    // Find active installments that are past due
    const overdueInstallments = await Installment.find({
      status: 'active',
      nextPaymentDate: { $lt: startOfDay }
    }).populate('customer', 'fullName phone').sort({ nextPaymentDate: 1 }).limit(limit);

    res.json({ success: true, data: overdueInstallments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

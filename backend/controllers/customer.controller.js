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
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

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
    // We will populate installments and payments later when those models are built
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
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

    // TODO: Connect to actual Installment and Payment models once built.
    // For now, return mock values matching the frontend expectations.
    const summary = {
      totalInstallments: 2,
      totalPaid: 137500,
      remainingBalance: 87500
    };

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Helper to generate access token (1 hour)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '1h',
  });
};

// Helper to generate refresh token (7 days)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_key', {
    expiresIn: '7d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check for user
    const user = await User.findOne({ username: cleanUsername }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token in HTTPOnly cookie
    // BUGFIX: sameSite must be 'none' for cross-site requests (Vercel → Railway).
    // 'strict' or 'lax' causes the browser to silently drop this cookie,
    // making /api/auth/refresh always fail with 401 once access token expires.
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: true, // Required when sameSite='none'
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.jwt;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_key');
    
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Rotate refresh token
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.cookie('jwt', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 0, // Immediately expire
  });
  
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    const { currentPassword, newPassword } = req.body;

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Password is incorrect' });
    }

    user.password = newPassword;
    await user.save(); // pre-save hook will hash it

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
// @desc    Create a new user (worker/manager) — owner only
// @route   POST /api/auth/register
// @access  Private (owner)
export const createUser = async (req, res) => {
  try {
    const { name, username, password, role, phone, cnic } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username aur password zaroori hain' });
    }
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Ye username pehle se maujood hai' });
    }
    const user = await User.create({
      fullName: name,
      username: username.toLowerCase(),
      password,
      role: role || 'worker',
      phone,
      cnic,
      createdBy: req.user.id,
    });
    res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.fullName, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (workers/managers)
// @route   GET /api/auth/users
// @access  Private (owner/manager)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['worker', 'manager'] } })
      .select('-password')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update a user (worker/manager)
// @route   PUT /api/auth/users/:id
// @access  Private (owner/manager)
export const updateUser = async (req, res) => {
  try {
    const { fullName, phone, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, phone, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Worker nahi mila' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user (worker/manager) — owner only
// @route   DELETE /api/auth/users/:id
// @access  Private (owner)
export const deleteUser = async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Aap apna khud ka account delete nahi kar sakte' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Worker nahi mila' });
    res.status(200).json({ success: true, message: 'Account delete ho gaya' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phone, email },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Upload profile photo
// @route   POST /api/auth/profile/photo
// @access  Private
export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    
    // Cloudinary path is usually in req.file.path or req.files.photo[0].path
    const photoUrl = req.file?.path || (req.files?.photo && req.files.photo[0]?.path);
    
    if (!photoUrl) {
       return res.status(400).json({ success: false, message: 'Photo upload failed' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, { photoUrl }, { new: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


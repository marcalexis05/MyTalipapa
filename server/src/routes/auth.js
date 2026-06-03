// server/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmailOtp, sendSmsOtp } = require('../utils/sendOtp');
const crypto = require('crypto');

const router = express.Router();

router.get('/verify', async (req, res) => {
  const rawToken = req.query.token;
  const token = rawToken ? decodeURIComponent(rawToken).trim() : null;
  console.log('[/verify] Processed token:', token);
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }
  try {
    const normalizedToken = token ? token.toLowerCase() : null;
    console.log('[/verify] Normalized token:', normalizedToken);
    const user = await User.findOne({ verificationToken: normalizedToken });
    if (!user) {
      console.log('[/verify] No user found for token');
      return res.status(400).json({ error: 'Invalid verification token.' });
    }
    console.log('[/verify] Found user ID:', user._id, 'Stored token:', user.verificationToken);
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired.' });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    return res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error('Email verification error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------
// POST /api/register
// ---------------------------------------------------
// ---------------------------------------------------
// POST /api/register (with email verification)
// ---------------------------------------------------
router.post('/register', async (req, res) => {
  const {
    full_name,
    email,
    password,
    contact_number,
    role,
    agreed,
  } = req.body;

  // Basic validation
  if (!full_name || !email || !password || !contact_number || !role || agreed === undefined) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Duplicate email check
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Password hashing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Create unverified user
    const user = await User.create({
      full_name,
      email: email.toLowerCase(),
      contact_number,
      role,
      passwordHash,
      agreed,
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
    });

    // Send verification email
    await sendEmailOtp(email, verificationToken);

    return res.status(201).json({ message: 'Registration successful. Please check your email for verification instructions.' });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------
// POST /api/contractor/register-application
// ---------------------------------------------------
router.post('/contractor/register-application', async (req, res) => {
  const {
    fullName,
    businessName,
    email,
    password,
    contactNumber,
    selectedStalls,
  } = req.body;

  // Validate required fields and ensure at least one stall is selected
  if (!fullName || !businessName || !email || !password || !contactNumber || !Array.isArray(selectedStalls) || selectedStalls.length === 0) {
    return res.status(400).json({ error: 'All fields are required and at least one stall must be selected.' });
  }
  if (
    !fullName ||
    !businessName ||
    !email ||
    !password ||
    !contactNumber ||
    !selectedStalls
  ) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const userExists = await User.findOne({ email: email.toLowerCase() });
    const ContractorApplication = require('../models/ContractorApplication');
    const appExists = await ContractorApplication.findOne({ email: email.toLowerCase() });

    const status = (userExists && userExists.status) || (appExists && appExists.status);

    if (userExists && userExists.role !== 'contractor') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    if (status === 'pending') {
      return res.status(409).json({ error: 'A pending application with this email already exists.' });
    }
    if (status === 'approved') {
      return res.status(409).json({ error: 'An approved contractor account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const wasRejected = status === 'rejected';

    let application;
    let userRecord;

    if (userExists || appExists) {
      if (userExists) {
        userExists.full_name = fullName;
        userExists.contact_number = contactNumber;
        userExists.passwordHash = passwordHash;
        userExists.status = 'pending';
        await userExists.save();
        userRecord = userExists;
      } else {
        userRecord = await User.create({
          full_name: fullName,
          email: email.toLowerCase(),
          contact_number: contactNumber,
          role: 'contractor',
          passwordHash,
          status: 'pending',
          agreed: true,
        });
      }

      if (appExists) {
        appExists.fullName = fullName;
        appExists.businessName = businessName;
        appExists.contactNumber = contactNumber;
        appExists.passwordHash = passwordHash;
        appExists.selectedStalls = selectedStalls;
        appExists.status = 'pending';
        appExists.rejectionReason = undefined;
        appExists.appliedAt = new Date();
        appExists.isResubmitted = wasRejected;
        await appExists.save();
        application = appExists;
      } else {
        application = await ContractorApplication.create({
          fullName,
          businessName,
          contactNumber,
          email: email.toLowerCase(),
          passwordHash,
          selectedStalls,
          status: 'pending',
          isResubmitted: wasRejected,
        });
      }
    } else {
      application = await ContractorApplication.create({
        fullName,
        businessName,
        contactNumber,
        email: email.toLowerCase(),
        passwordHash,
        selectedStalls,
        status: 'pending',
        isResubmitted: false,
      });

      userRecord = await User.create({
        full_name: fullName,
        email: email.toLowerCase(),
        contact_number: contactNumber,
        role: 'contractor',
        passwordHash,
        status: 'pending',
        agreed: true,
      });
    }

    return res.status(201).json({
      message: 'Application submitted successfully',
      application,
      user: {
        id: userRecord._id,
        email: userRecord.email,
        full_name: userRecord.full_name,
        role: userRecord.role,
        status: userRecord.status,
        profilePicture: userRecord.profilePicture || null,
        contact_number: userRecord.contact_number || '',
      }
    });
  } catch (err) {
    // Detailed logging for debugging
    console.error('Contractor registration error:', err);
    // Duplicate key error (e.g., email already exists)
    if (err.code === 11000 && err.keyPattern) {
      const duplicateField = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ error: `An account with this ${duplicateField} already exists.` });
    }
    // Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ error: `Validation error: ${messages}` });
    }
    // Generic server error (include message in dev)
    const message = process.env.NODE_ENV !== 'production' ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }


});


// POST /api/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log(`[Login attempt] Email: ${email.toLowerCase()}, Role requested: ${role}, User found: ${user ? 'Yes' : 'No'}`);
    if (!user) {
      // Check if there is a pending or rejected contractor application
      const ContractorApplication = require('../models/ContractorApplication');
      const app = await ContractorApplication.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 });
      console.log(`[Login attempt] No user found. ContractorApplication status: ${app ? app.status : 'None'}`);
      if (app) {
        if (app.status === 'pending') {
          return res.status(403).json({ error: 'Your registration is still pending admin review.' });
        } else if (app.status === 'rejected') {
          return res.status(403).json({ error: 'Your registration application was rejected by the admin.' });
        }
      }
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    console.log(`[Login attempt] User role: ${user.role}, User status: ${user.status}`);
    // Role-based authorization: check role first
    if (role) {
      // Renter trying to login as another role
      if (user.role === 'renter' && role !== 'renter') {
        return res.status(403).json({ error: 'This is a renter account' });
      }
      // Contractor trying to login as another role
      if (user.role === 'contractor' && role !== 'contractor') {
        return res.status(403).json({ error: 'This is a contractor account' });
      }
      // Admin trying to login as another role
      if (user.role === 'admin' && role !== 'admin') {
        return res.status(403).json({ error: 'this is an admin account' });
      }
      // If role provided but does not match (should not happen after above), generic fallback
      if (user.role !== role) {
        return res.status(403).json({ error: `This account is not registered as a ${role}.` });
      }
    }
    // After role validation, enforce password change if the role matches the user's role
    if (role && user.role === role && user.mustChangePassword) {
      return res.status(403).json({ error: 'Password must be changed before proceeding.', mustChangePassword: true });
    }

    let isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`[Login attempt] Password matches User.passwordHash: ${isMatch}`);
    if (!isMatch && user.role === 'contractor') {
      const ContractorApplication = require('../models/ContractorApplication');
      const app = await ContractorApplication.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 });
      console.log(`[Login attempt] Password failed for contractor. App found: ${app ? 'Yes' : 'No'}, App status: ${app ? app.status : 'N/A'}`);
      if (app && app.status === 'approved') {
        const isAppMatch = await bcrypt.compare(password, app.passwordHash);
        console.log(`[Login attempt] Password matches App.passwordHash: ${isAppMatch}`);
        if (isAppMatch) {
          // Self-heal: Sync the correct passwordHash and status to User document
          user.passwordHash = app.passwordHash;
          user.status = 'approved';
          await user.save();
          isMatch = true;
          console.log(`[Login attempt] Self-healed User password and status successfully.`);
        }
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Auto-verify past users (who registered before email verification was introduced)
    if (!user.verificationToken && !user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    // After password verification, enforce password change if required
    if (user.mustChangePassword) {
      return res.status(403).json({ error: 'Password must be changed before proceeding.', mustChangePassword: true });
    }


    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status || 'approved',
        profilePicture: user.profilePicture || null,
        contact_number: user.contact_number || '',
        isVerified: user.isVerified,
      },
      token,
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------
// GET /api/profile
// ---------------------------------------------------
router.post('/change-password', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  const oldPassword = req.body.oldPassword || req.body.currentPassword;
  const { newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mytalipapa-secret-key-12345');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect.' });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordHash = passwordHash;
    await user.save();
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/verify-current-password', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  const token = authHeader.split(' ')[1];
  const { password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mytalipapa-secret-key-12345');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    return res.json({ valid: isMatch });
  } catch (err) {
    console.error('Verify current password error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mytalipapa-secret-key-12345');
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Auto-expire archive access status if 24 hours have passed since approval
    if (user.archiveAccessStatus === 'approved' && user.archiveAccessApprovedAt) {
      const now = new Date();
      const approvedTime = new Date(user.archiveAccessApprovedAt);
      const diffMs = now - approvedTime;
      const validityMs = 24 * 60 * 60 * 1000; // 24 hours
      if (diffMs > validityMs) {
        user.archiveAccessStatus = 'none';
        user.archiveAccessApprovedAt = null;
        await user.save();
      }
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error('Fetch profile error:', err);
    return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
  }
});

// ---------------------------------------------------
// PUT /api/profile
// ---------------------------------------------------
router.put('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mytalipapa-secret-key-12345');
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { full_name, contact_number, profilePicture } = req.body;
    if (full_name) user.full_name = full_name;
    if (contact_number) user.contact_number = contact_number;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        contact_number: user.contact_number,
        role: user.role,
        status: user.status,
        profilePicture: user.profilePicture,
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------
// POST /api/identify-account
// ---------------------------------------------------
router.post('/identify-account', async (req, res) => {
  const { accountName } = req.body;

  if (!accountName || !accountName.trim()) {
    return res.status(400).json({ error: 'Account name or email is required.' });
  }

  try {
    const trimmedName = accountName.trim();
    let user = null;

    // 1. Search by email
    user = await User.findOne({ email: trimmedName.toLowerCase() });

    // 2. Search by phone number
    if (!user) {
      user = await User.findOne({ contact_number: trimmedName });
    }

    // 3. Search by full name (case insensitive)
    if (!user) {
      user = await User.findOne({ full_name: { $regex: new RegExp('^' + trimmedName + '$', 'i') } });
    }

    if (!user) {
      return res.status(404).json({ error: 'No account associated with that name or email was found.' });
    }

    // Helper functions to mask the receivers
    const maskEmail = (email) => {
      const parts = email.split('@');
      if (parts.length !== 2) return email;
      const [name, domain] = parts;
      if (name.length <= 2) return `${name[0]}***@${domain}`;
      return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
    };

    const maskPhone = (phone) => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length <= 4) return '******' + cleaned;
      // Philippines phone format standard: +63 9** *** 1234
      if (cleaned.startsWith('63') && cleaned.length === 12) {
        return `+63 9${cleaned.substring(3, 5)}*** ${cleaned.substring(cleaned.length - 4)}`;
      }
      if (cleaned.startsWith('09') && cleaned.length === 11) {
        return `+63 9${cleaned.substring(2, 4)}*** ${cleaned.substring(cleaned.length - 4)}`;
      }
      return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)}** *** ${cleaned.substring(cleaned.length - 4)}`;
    };

    return res.status(200).json({
      userId: user._id,
      maskedEmail: maskEmail(user.email),
      maskedPhone: maskPhone(user.contact_number)
    });
  } catch (err) {
    console.error('Identify account error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------
// POST /api/forgot-password (Sends OTP to verified account)
// ---------------------------------------------------
router.post('/forgot-password', async (req, res) => {
  const { userId, method } = req.body;

  if (!userId || !method) {
    return res.status(400).json({ error: 'User ID and recovery method are required.' });
  }

  if (method !== 'email' && method !== 'sms') {
    return res.status(400).json({ error: 'Invalid delivery method. Must be email or sms.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Rate limiting: Max 3 requests per 10 minutes
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    user.otpRequests = (user.otpRequests || []).filter(timestamp => new Date(timestamp).getTime() > tenMinutesAgo);

    if (user.otpRequests.length >= 3) {
      return res.status(429).json({ error: 'Too many requests. You can request up to 3 OTP codes every 10 minutes.' });
    }

    // Log request timestamp
    user.otpRequests.push(new Date());

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Cache plain OTP in global memory for local dev integration testing
    if (process.env.NODE_ENV !== 'production') {
      global.lastDevOtps = global.lastDevOtps || {};
      global.lastDevOtps[user._id.toString()] = otp;
    }

    // Hash OTP using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    user.resetOtp = hashedOtp;
    user.resetOtpExpires = new Date(now + 5 * 60 * 1000); // 5 minutes validity
    await user.save();

    // Dispatch the OTP via selected method (Nodemailer or Twilio)
    if (method === 'email') {
      await sendEmailOtp(user.email, otp, 'reset');
    } else {
      await sendSmsOtp(user.contact_number, otp);
    }

    // Critical: Never return the OTP code itself to the client!
    return res.status(200).json({
      message: 'Verification code has been sent successfully.'
    });
  } catch (err) {
    console.error('Forgot password send error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------
// POST /api/verify-otp
// ---------------------------------------------------
router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ error: 'User ID and OTP code are required.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check expiration
    if (!user.resetOtp || !user.resetOtpExpires || new Date(user.resetOtpExpires).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired verification session. Please request a new code.' });
    }

    // Compare hashed OTP
    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    return res.status(200).json({ message: 'Verification code verified successfully.' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------
// POST /api/reset-password
// ---------------------------------------------------
router.post('/reset-password', async (req, res) => {
  const { userId, otp, password } = req.body;

  if (!userId || !otp || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Password Complexity Validation
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigitOrSpecial = /[\d\W]/.test(password);
  if (!hasLetter || !hasDigitOrSpecial) {
    return res.status(400).json({ error: 'Password must contain at least one letter and one number or special character.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Re-verify OTP to confirm authenticity
    if (!user.resetOtp || !user.resetOtpExpires || new Date(user.resetOtpExpires).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired verification session.' });
    }

    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid verification session.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Apply new password and invalidate the OTP + clear requests
    user.passwordHash = passwordHash;
    user.resetOtp = null;
    user.resetOtpExpires = null;
    user.otpRequests = [];
    await user.save();

    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  router.get('/dev/last-otp/:userId', (req, res) => {
    const { userId } = req.params;
    const otps = global.lastDevOtps || {};
    const otp = otps[userId];
    if (!otp) return res.status(404).json({ error: 'No dev OTP found for this user.' });
    return res.status(200).json({ otp });
  });
}

const Announcement = require('../models/Announcement');

// POST /api/admin/announcements
router.post('/admin/announcements', async (req, res) => {
  try {
    const { title, content, targetAudience } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }
    const announcement = await Announcement.create({
      title,
      content,
      targetAudience: targetAudience || 'all',
    });
    return res.status(201).json(announcement);
  } catch (err) {
    console.error('Error creating announcement:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Temporary endpoint to reset contractor password for juliales.christiandave.narcilla@gmail.com
router.get('/dev/reset-contractor', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    const email = 'juliales.christiandave.narcilla@gmail.com';
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { passwordHash, status: 'approved' } },
      { new: true }
    );

    const ContractorApplication = require('../models/ContractorApplication');
    const app = await ContractorApplication.findOneAndUpdate(
      { email },
      { $set: { passwordHash, status: 'approved' } },
      { new: true }
    );

    return res.json({
      message: 'Password reset successfully for ' + email,
      userUpdated: !!user,
      userStatus: user ? user.status : null,
      appUpdated: !!app,
      appStatus: app ? app.status : null
    });
  } catch (err) {
    console.error('Dev reset error:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/change-first-password', async (req, res) => {
  const { email, password, newPassword } = req.body;
  if (!email || !password || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasDigitOrSpecial = /[\d\W]/.test(newPassword);
  if (!hasLetter || !hasDigitOrSpecial) {
    return res.status(400).json({ error: 'Password must contain at least one letter and one number or special character.' });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (!user.mustChangePassword) {
      return res.status(400).json({ error: 'This account does not require a password change.' });
    }
    // Directly set new password without checking current password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordHash = passwordHash;
    user.mustChangePassword = false;
    await user.save();

    const ContractorApplication = require('../models/ContractorApplication');
    await ContractorApplication.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { passwordHash } }
    );

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Password changed successfully.',
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status || 'approved',
        profilePicture: user.profilePicture || null,
        contact_number: user.contact_number || '',
        isVerified: user.isVerified,
      },
      token,
    });
  } catch (err) {
    console.error('Change first password error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
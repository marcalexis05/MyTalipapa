const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    contact_number: { type: String, required: true },
    role: { type: String, enum: ['renter', 'contractor', 'admin'], required: true },
    passwordHash: { type: String, required: true },
    mustChangePassword: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    agreed: { type: Boolean, default: false },
    profilePicture: { type: String, default: null },
    archiveAccessStatus: { type: String, enum: ['none', 'pending', 'approved'], default: 'none' },
    archiveAccessApprovedAt: { type: Date, default: null },
    resetOtp: { type: String, default: null },
    resetOtpExpires: { type: Date, default: null },
    otpRequests: { type: [Date], default: [] },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);

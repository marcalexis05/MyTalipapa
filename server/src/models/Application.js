// models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // From the rental inquiry form (Image 2)
  fullName:            { type: String, required: true },
  contactNumber:       { type: String, required: true },
  email:               { type: String, required: true },
  preferredStall:      { type: String, required: true },  // stallNumber ref
  stallLabel:          { type: String },                  // e.g. "STALL #045"
  intendedBusinessUse: { type: String, required: true },  // dropdown selection
  stallId: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Stall' },
  contractorEmail: { type: String },  additionalMessage:   { type: String, default: '' },

  // Status managed by contractor (Image 1)
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  appliedAt:       { type: Date, default: Date.now },
  reviewedAt:      { type: Date, default: null },
  reviewedBy:      { type: String, default: null },
  rejectionReason: { type: String, default: null },

  // UI display helpers
  initials:    { type: String },   // e.g. "JR"
  avatarColor: { type: String },   // hex color for avatar background
  archived:    { type: Boolean, default: false },
  archivedAt:  { type: Date },
}, { timestamps: true });
applicationSchema.index({ stallId: 1 });
applicationSchema.index({ contractorEmail: 1 });

module.exports = mongoose.model('Application', applicationSchema);
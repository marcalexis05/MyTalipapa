const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g., 'application_submitted', 'application_approved'
    details: { type: String, required: true }, // Description of the activity
    performedBy: { type: String, required: true }, // User who performed the action (email or name)
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);

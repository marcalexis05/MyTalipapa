const mongoose = require('mongoose');

const StallRemovalRequestSchema = new mongoose.Schema(
  {
    stallId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stall', required: true },
    location: { type: String, required: true },
    contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestReason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNotes: { type: String, default: '' },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StallRemovalRequest', StallRemovalRequestSchema);

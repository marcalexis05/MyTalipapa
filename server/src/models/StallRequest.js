const mongoose = require('mongoose');

const StallRequestSchema = new mongoose.Schema({
  stallId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stall', required: true },
  contractorEmail: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StallRequest', StallRequestSchema);

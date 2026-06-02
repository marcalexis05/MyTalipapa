const mongoose = require('mongoose');

const occupancyRecordSchema = new mongoose.Schema({
  stallId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stall', required: true },
  renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  contractorEmail: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('OccupancyRecord', occupancyRecordSchema);

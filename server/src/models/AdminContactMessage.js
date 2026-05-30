const mongoose = require('mongoose');

const adminContactMessageSchema = new mongoose.Schema({
  subject:       { type: String, required: true },
  message:       { type: String, required: true },
  renterName:    { type: String },
  renterEmail:   { type: String },
  renterContact: { type: String },
  status:        { type: String, default: 'unread' },
  reply:         { type: String },
  repliedAt:     { type: Date },
  createdAt:     { type: Date, default: Date.now },
});

module.exports = mongoose.model('AdminContactMessage', adminContactMessageSchema);
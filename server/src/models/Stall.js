// models/Stall.js
const mongoose = require('mongoose');

const stallSchema = new mongoose.Schema({
  stallNumber:    { type: String, required: true },
  section:        { type: String, required: true },
  color:          { type: String },
  zone:           { type: String, enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
  hasStallNumber: { type: Boolean, default: true },
  managedBy:      { type: String, default: null }, // Contractor email
  contractorContact: { type: String, default: null }, // Contractor phone number
  status:         { type: String, enum: ['available', 'occupied', 'pending'], default: 'available' },
  size:           { type: Number, default: 12 },
  sizeUnit:       { type: String, default: 'sqm' },
  monthlyRate:    { type: Number },
  currency:       { type: String, default: 'PHP' },
  amenities:      [{ type: String }],
  
  // Location Coordinates & Metadata
  coordinates: {
    x:       { type: Number },
    y:       { type: Number },
    hallway: { type: String }
  },
  vendorName:     { type: String },
  location:       { type: String },
  productType:    { type: String },
  phoneNumber:    { type: String },
  operatingHours: { type: String },

  listing: {
    isActive:  { type: Boolean, default: true },
    autoRenew: { type: Boolean, default: false },
    listedAt:  { type: Date },
  },
  // ✅ tenant is an object with defaults — never null
  tenant: {
    name:       { type: String, default: null },
    contact:    { type: String, default: null },
    email:      { type: String, default: null },
    leaseStart: { type: Date,   default: null },
    leaseEnd:   { type: Date,   default: null },
  },
}, { timestamps: true });

module.exports = mongoose.model('Stall', stallSchema);
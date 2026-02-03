// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
  transactionID: { type: String, required: true, unique: true },
  referenceNumber: { type: String },
  amount:        { type: Number, required: true },
  currency:      { type: String, default: 'USD' },
  date:          { type: Date, required: true },
  description:   { type: String },
  source:        { type: String, default: 'system' }
}, { timestamps: true });

transactionSchema.index({ transactionID: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
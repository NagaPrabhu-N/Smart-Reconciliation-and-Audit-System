const mongoose = require('mongoose');

const reconciliationResultSchema = mongoose.Schema({
  uploadJobId:   { type: String, required: true },
  transactionID: { type: String, required: true },
  systemAmount:  { type: Number },
  fileAmount:    { type: Number },
  variance:      { type: Number },
  status:        { 
    type: String, 
    enum: ['Matched', 'Partial Match', 'Mismatch', 'Unmatched', 'Duplicate'],
    default: 'Unmatched' 
  },
  isManuallyCorrected: { type: Boolean, default: false },
  adminNotes:    { type: String }
}, { timestamps: true });

reconciliationResultSchema.index({ uploadJobId: 1 });

module.exports = mongoose.model('ReconciliationResult', reconciliationResultSchema);
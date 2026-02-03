// models/AuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = mongoose.Schema({
  action:      { type: String, required: true },
  performedBy: { type: String, required: true },
  role:        { type: String, required: true }, 
  details:     { type: String },                 
  status:      { type: String, default: 'Success' },
  jobId:       { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
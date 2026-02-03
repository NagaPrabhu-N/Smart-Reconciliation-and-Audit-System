// controllers/auditController.js
const AuditLog = require('../models/AuditLog');
const getLogs = async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 });
  res.json(logs);
};

module.exports = { getLogs };
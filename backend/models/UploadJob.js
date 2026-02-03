// backend/models/UploadJob.js
const mongoose = require('mongoose');

const uploadJobSchema = mongoose.Schema({
  jobId:        { type: String, required: true, unique: true },
  filename:     { type: String, required: true },
  fileHash:     { type: String, required: true },
  totalRecords: { type: Number, required: true },
  uploadedBy:   { type: String, required: true },
  status:       { type: String, default: 'Completed' }
}, { timestamps: true });

module.exports = mongoose.model('UploadJob', uploadJobSchema);
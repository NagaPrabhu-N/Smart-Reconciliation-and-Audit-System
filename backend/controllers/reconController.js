const fs = require('fs');
const csv = require('csv-parser');
const crypto = require('crypto'); 
const { Readable } = require('stream');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const ReconciliationResult = require('../models/ReconciliationResult');
const UploadJob = require('../models/UploadJob');

const getFileHash = (buffer) => {
  return crypto.createHash('md5').update(buffer).digest('hex');
};

const bufferToStream = (buffer) => {
  return Readable.from(buffer);
};

const previewFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  
  const results = [];
  let headers = [];
  bufferToStream(req.file.buffer)
    .pipe(csv())
    .on('headers', (h) => headers = h)
    .on('data', (data) => { if (results.length < 20) results.push(data); })
    .on('end', () => res.json({ filename: req.file.originalname, headers, preview: results }));
};

const reconcileFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Please upload a CSV file' });

  try {
    const fileHash = getFileHash(req.file.buffer);
    
    const existingJob = await UploadJob.findOne({ fileHash, status: 'Completed' });
    if (existingJob) {
      return res.json({ 
        message: 'Cached Result', 
        jobId: existingJob.jobId, 
        status: 'Completed', 
        isCached: true 
      });
    }

    const jobId = crypto.randomUUID();
    await UploadJob.create({
      jobId,
      filename: req.file.originalname,
      fileHash,
      totalRecords: 0,
      uploadedBy: req.user.username,
      status: 'Processing' 
    });

    processFileBackground(jobId, req.file.buffer, req.body.mapping, req.user);

    res.json({ message: 'Processing started', jobId, status: 'Processing', isCached: false });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

const processFileBackground = async (jobId, fileBuffer, mappingStr, user) => {
  const results = [];
  const fileRows = [];
  const mapConfig = mappingStr ? JSON.parse(mappingStr) : null;
  const seenIDs = new Set();
  const duplicateIDs = new Set();

  bufferToStream(fileBuffer)
    .pipe(csv())
    .on('data', (data) => fileRows.push(data))
    .on('end', async () => {
      try {
        for (const row of fileRows) {
            let fileID = mapConfig ? row[mapConfig.transactionID] : (row.transactionID || row.TransactionID || row.id);
            fileID = fileID ? fileID.toString().trim() : ''; 
            if (fileID && seenIDs.has(fileID)) duplicateIDs.add(fileID);
            if (fileID) seenIDs.add(fileID);
        }

        for (const row of fileRows) {
            let fileID = mapConfig ? row[mapConfig.transactionID] : (row.transactionID || row.TransactionID);
            fileID = fileID ? fileID.toString().trim() : '';

            let fileRef = mapConfig ? row[mapConfig.referenceNumber] : (row.referenceNumber || row.Reference || row.reference);
            fileRef = fileRef ? fileRef.toString().trim() : '';

            const rawAmount = mapConfig ? row[mapConfig.amount] : (row.amount || row.Amount);
            const fileAmount = parseFloat(rawAmount);

            let status = 'Unmatched';
            let notes = 'Transaction ID not found';
            let sysAmount = null;

            if (duplicateIDs.has(fileID)) {
                status = 'Duplicate';
                notes = 'Duplicate ID in file';
            } else {
                let systemRecord = null;
                let matchType = 'None';

                if (fileID) {
                    systemRecord = await Transaction.findOne({ transactionID: fileID });
                    if (systemRecord) matchType = 'ID';
                }
                
                if (!systemRecord && fileRef) {
                    systemRecord = await Transaction.findOne({ 
                        referenceNumber: { $regex: new RegExp(`^${fileRef}$`, "i") } 
                    });
                    if (systemRecord) {
                        matchType = 'Ref';
                        notes = `Found via Reference: ${fileRef}`;
                    }
                }

                if (systemRecord) {
                    sysAmount = systemRecord.amount;
                    const diff = Math.abs(sysAmount - fileAmount);
                    const variancePct = (sysAmount !== 0) ? (diff / sysAmount) * 100 : (diff === 0 ? 0 : 100);

                    if (diff < 0.01) { 
                        status = 'Matched';
                        notes = matchType === 'Ref' ? 'Perfect Match (via Ref)' : 'Perfect Match';
                    } else if (variancePct <= 2) {
                        status = 'Partial Match';
                        notes = `Variance ${variancePct.toFixed(2)}%`;
                        if (matchType === 'Ref') notes += ' (via Ref)';
                    } else {
                        status = 'Mismatch';
                        notes = `Variance > 2% (${variancePct.toFixed(0)}%)`;
                        if (matchType === 'Ref') notes += ' (via Ref)';
                    }
                } else {
                    if (fileRef) notes = `ID and Ref (${fileRef}) not found in System`;
                }
            }

            results.push({
                uploadJobId: jobId,
                transactionID: fileID || 'UNKNOWN',
                systemAmount: sysAmount,
                fileAmount: fileAmount || 0,
                variance: sysAmount ? Math.abs(sysAmount - fileAmount) : 0,
                status: status,
                adminNotes: notes
            });
        }

        await ReconciliationResult.insertMany(results);
        await UploadJob.findOneAndUpdate({ jobId }, { status: 'Completed', totalRecords: results.length });

        const stats = {
            matched: results.filter(r => r.status === 'Matched').length,
            partial: results.filter(r => r.status === 'Partial Match').length,
            mismatch: results.filter(r => r.status === 'Mismatch').length,
            duplicate: results.filter(r => r.status === 'Duplicate').length,
            unmatched: results.filter(r => r.status === 'Unmatched').length
        };

        const summary = `Reconciliation Completed. Total: ${results.length} | Matched: ${stats.matched} | Partial: ${stats.partial} | Exceptions: ${stats.mismatch + stats.unmatched} | Duplicates: ${stats.duplicate}`;

        await AuditLog.create({
            action: 'File Reconciliation',
            performedBy: user.username,
            role: user.role,
            details: summary,
            status: 'Success',
            jobId: jobId 
        });

      } catch (error) {
        console.error('Background Process Failed:', error);
        await AuditLog.create({
            action: 'File Reconciliation',
            performedBy: user.username,
            role: user.role,
            details: `Job ${jobId} Failed. Error: ${error.message}`,
            status: 'Failed',
            jobId: jobId
        });
        await UploadJob.findOneAndUpdate({ jobId }, { status: 'Failed' });
      }
    });
};

const getJobStatus = async (req, res) => {
    const { id } = req.params;
    const job = await UploadJob.findOne({ jobId: id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status === 'Completed') {
        const results = await ReconciliationResult.find({ uploadJobId: id });
        return res.json({ status: 'Completed', data: results, totalRecords: job.totalRecords });
    }
    res.json({ status: job.status }); 
};

const updateRecord = async (req, res) => {
  const { id } = req.params;
  const { newAmount, status, notes } = req.body;
  try {
    const record = await ReconciliationResult.findById(id);
    if (!record) return res.status(404).json({ message: 'Record not found' });

    const oldAmount = record.fileAmount;
    const oldStatus = record.status;

    if (newAmount) record.fileAmount = newAmount;
    if (status) record.status = status;
    if (notes) record.adminNotes = notes;
    record.isManuallyCorrected = true;

    await record.save();

    const changes = [];
    if (newAmount && newAmount != oldAmount) changes.push(`Amount: $${oldAmount} ➝ $${newAmount}`);
    if (status && status !== oldStatus) changes.push(`Status: ${oldStatus} ➝ ${status}`);
    const changeLog = changes.length > 0 ? changes.join(' | ') : 'Only Notes updated';

    await AuditLog.create({
        action: 'Manual Correction',
        performedBy: req.user.username,
        role: req.user.role,
        details: `Correction on ${record.transactionID}. [ ${changeLog} ]`,
        status: 'Success',
        jobId: record.uploadJobId
    });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
};

const getLatestJob = async (req, res) => {
    try {
        const latestJob = await UploadJob.findOne({ status: 'Completed' }).sort({ createdAt: -1 });
        if (!latestJob) return res.status(404).json({ message: 'No records found' });
        const results = await ReconciliationResult.find({ uploadJobId: latestJob.jobId });
        res.json({ 
            jobId: latestJob.jobId, 
            filename: latestJob.filename, 
            uploadedBy: latestJob.uploadedBy,
            data: results, 
            totalRecords: latestJob.totalRecords,
            status: 'Completed'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const uploadSystemData = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
      await Transaction.deleteMany({});
  } catch (err) {
      return res.status(500).json({ message: 'Failed to clear old data' });
  }

  const BATCH_SIZE = 5000; 
  let batch = [];
  let totalInserted = 0;
  const seenIDs = new Set();

  const stream = bufferToStream(req.file.buffer).pipe(csv());

  stream.on('data', async (row) => {
      const tID = row.transactionID || row.id || row.ID || row['Transaction ID'];
      const ref = row.referenceNumber || row.Reference || row.ref || row.reference || ''; 
      const amt = row.amount || row.Amount || 0;

      const cleanRecord = {
          transactionID: tID ? tID.toString().trim() : null,
          amount: parseFloat(amt),
          referenceNumber: ref ? ref.toString().trim() : '',
          date: new Date(), 
          description: row.description || row.Description || 'System Upload',
          source: 'system_upload'
      };

      if (cleanRecord.transactionID && !isNaN(cleanRecord.amount)) {
          if (!seenIDs.has(cleanRecord.transactionID)) {
              seenIDs.add(cleanRecord.transactionID);
              batch.push(cleanRecord);
          }
      }

      if (batch.length >= BATCH_SIZE) {
          stream.pause(); 
          try {
              await Transaction.insertMany(batch);
              totalInserted += batch.length;
              batch = []; 
          } catch (err) {
              console.error('Batch Insert Failed', err);
          }
          stream.resume(); 
      }
  });

  stream.on('end', async () => {
      if (batch.length > 0) {
          try {
              await Transaction.insertMany(batch);
              totalInserted += batch.length;
          } catch (err) {
              console.error('Final Batch Failed', err);
          }
      }

      await AuditLog.create({
          action: 'System Data Update',
          performedBy: req.user.username,
          role: req.user.role,
          details: `Replaced System Data with ${totalInserted} records.`,
          status: 'Success',
          jobId: null
      });

      res.json({ message: 'System Records Updated Successfully', count: totalInserted });
  });

  stream.on('error', (err) => {
      res.status(500).json({ message: 'Stream Error: ' + err.message });
  });
};

module.exports = { reconcileFile, updateRecord, previewFile, getJobStatus, getLatestJob, uploadSystemData };
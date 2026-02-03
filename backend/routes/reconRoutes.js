const express = require('express');
const router = express.Router();
const multer = require('multer');
const { reconcileFile, updateRecord, previewFile, getJobStatus, getLatestJob, uploadSystemData } = require('../controllers/reconController');

const { protect, admin } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/preview', protect, upload.single('file'), previewFile);
router.post('/upload', protect, upload.single('file'), reconcileFile);
router.put('/update/:id', protect, updateRecord);
router.get('/status/:id', protect, getJobStatus);
router.get('/latest', protect, getLatestJob);
router.post('/system-upload', protect, admin, upload.single('file'), uploadSystemData);

module.exports = router;
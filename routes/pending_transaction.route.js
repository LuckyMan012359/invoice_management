const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const {
  createPendingTransaction,
  readPendingTransaction,
  updatePendingTransaction,
  deletePendingTransaction,
} = require('../controllers/pending_transaction.controller.js');
const verifyToken = require('../middlewares/authJWT.js');

const uploadDir = path.join(__dirname, '../uploads/attachments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

router.post(
  '/create_pending_transaction',
  upload.array('attachments'),
  verifyToken,
  createPendingTransaction,
);
router.get('/get_pending_transactions', verifyToken, readPendingTransaction);
router.put(
  '/update_pending_transaction',
  upload.array('attachments'),
  verifyToken,
  updatePendingTransaction,
);
router.delete('/delete_pending_transaction', verifyToken, deletePendingTransaction);

module.exports = router;

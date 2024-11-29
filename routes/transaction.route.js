const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const {
  createTransaction,
  readTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionData,
} = require('../controllers/transaction.controller.js');
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

const optimizeImage = async (filePath) => {
  const compressedFilePath = filePath.replace(
    path.extname(filePath),
    `_optimized${path.extname(filePath)}`,
  );

  await sharp(filePath).resize({ width: 800 }).jpeg({ quality: 80 }).toFile(compressedFilePath);

  fs.renameSync(compressedFilePath, filePath);
};

const optimizePDF = async (filePath) => {
  const compressedFilePath = filePath.replace(
    path.extname(filePath),
    `_compressed${path.extname(filePath)}`,
  );

  const pdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const compressedPDFBytes = await pdfDoc.save({
    useObjectStreams: false,
  });

  fs.writeFileSync(compressedFilePath, compressedPDFBytes);

  fs.unlinkSync(filePath);
  fs.renameSync(compressedFilePath, filePath);
};

const validateAndOptimizeFiles = async (req, res, next) => {
  try {
    if (req.files) {
      for (const file of req.files) {
        const filePath = file.path;

        if (file.mimetype.startsWith('image/')) {
          await optimizeImage(filePath);
        } else if (file.mimetype === 'application/pdf') {
          await optimizePDF(filePath);
        } else {
          fs.unlinkSync(filePath);
          return res.status(400).json({ message: 'Unsupported file type.' });
        }
      }
    }
    next();
  } catch (error) {
    console.error('File processing error:', error);
    return res.status(500).json({ message: 'Error processing files.' });
  }
};

const router = express.Router();

router.post(
  '/create_transaction',
  upload.array('attachments'),
  verifyToken,
  validateAndOptimizeFiles,
  createTransaction,
);

router.get('/get_transactions', verifyToken, readTransaction);

router.put(
  '/update_transaction',
  upload.array('attachments'),
  verifyToken,
  validateAndOptimizeFiles,
  updateTransaction,
);

router.delete('/delete_transaction', verifyToken, deleteTransaction);

router.get('/total_transaction_value', verifyToken, getTransactionData);

module.exports = router;

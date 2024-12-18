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
  approveUpdateTransaction,
  approveCreatingTransaction,
  deleteApproveUpdatingTransaction,
  getTransactionDataAmount,
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

let clients = [];

router.get('/updates', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`data: ${JSON.stringify({ message: 'Connected to SSE' })}\n\n`);

  const client = { id: Date.now(), res };
  clients.push(client);

  req.on('close', () => {
    clients = clients.filter((c) => c.id !== client.id);
    res.end();
  });
});

const sendUpdateToClients = (data) => {
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

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

router.put(
  '/approve_update_transaction',
  upload.array('attachments'),
  verifyToken,
  validateAndOptimizeFiles,
  async (req, res) => {
    const { transaction_id } = req.body;

    try {
      await approveUpdateTransaction(req, res);
      sendUpdateToClients({ type: 'DELETE', transactionId: transaction_id });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({ message: 'Failed to delete transaction' });
    }
  },
);

router.delete('/delete_transaction', verifyToken, async (req, res) => {
  const { transaction_id } = req.query;

  try {
    await deleteTransaction(req, res);
    sendUpdateToClients({ type: 'DELETE', transactionId: transaction_id });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Failed to delete transaction' });
  }
});

router.get('/total_transaction_value', verifyToken, getTransactionData);

router.put('/approve_create_transaction', verifyToken, async (req, res) => {
  const { transaction_id } = req.body;

  try {
    await approveCreatingTransaction(req, res);
    sendUpdateToClients({ type: 'DELETE', transactionId: transaction_id });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Failed to delete transaction' });
  }
});

router.put('/delete_approve_update_transaction', verifyToken, async (req, res) => {
  const { transaction_id } = req.body;

  try {
    await deleteApproveUpdatingTransaction(req, res);
    sendUpdateToClients({ type: 'DELETE', transactionId: transaction_id });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Failed to delete transaction' });
  }
});

router.get('/get_transaction_data_amount', verifyToken, getTransactionDataAmount);

module.exports = router; // Only export the router

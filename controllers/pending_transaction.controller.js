const { deleteCache, getCache, setCache } = require('../config/cacheController');
const PendingTransaction = require('../models/pending_transaction.model');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');

exports.createPendingTransaction = async (req, res) => {
  try {
    const {
      transaction_type,
      amount,
      notes,
      document,
      transaction_date,
      original_transaction,
      isRemove,
    } = req.body;

    const existingPendingTransaction = await PendingTransaction.findOne({
      original_transaction: original_transaction,
    });

    const originalTransaction = await Transaction.findOne({
      _id: original_transaction,
    });

    let pendingStatus;

    if (isRemove === 'true') {
      pendingStatus = '0';
    } else if (isRemove === 'false' && req.files && req.files.length > 0) {
      pendingStatus = '1';
    } else {
      pendingStatus = '2';
    }

    const attachments = req.files
      ? req.files.map((file) => ({
          originalname: file.originalname,
          hashedName: file.filename,
          path: file.path,
          mimetype: file.mimetype,
        }))
      : [];

    if (!existingPendingTransaction) {
      const transaction = new PendingTransaction({
        supplier_id: originalTransaction.supplier_id,
        customer_id: originalTransaction.customer_id,
        transaction_type,
        amount,
        document,
        notes,
        transaction_date,
        attachments: attachments.map((file) => `uploads/attachments/${file.hashedName}`),
        original_transaction,
        pending: true,
        attachmentsUpdateStatus: pendingStatus,
      });

      const newTransaction = await transaction.save();

      originalTransaction.pending_transaction_id = newTransaction._id;
      console.log(originalTransaction);
      await originalTransaction.save();

      deleteCache('transaction');
      deleteCache('pending_transaction');

      res.status(201).send({
        message: 'Transaction pending successfully!',
        transaction,
      });
    } else {
      let attachments = existingPendingTransaction.attachments;

      attachments.forEach((filePath) => {
        const fullPath = path.join(__dirname, '..', filePath);
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${fullPath}`, err);
          } else {
            console.log(`File deleted successfully: ${fullPath}`);
          }
        });
      });

      attachments = req.files.map((file) => `uploads/attachments/${file.filename}`);

      existingPendingTransaction.supplier_id = originalTransaction.supplier_id;
      existingPendingTransaction.customer_id = originalTransaction.customer_id;
      existingPendingTransaction.transaction_type = transaction_type;
      existingPendingTransaction.amount = amount;
      existingPendingTransaction.document = document;
      existingPendingTransaction.pending = true;
      existingPendingTransaction.original_transaction = original_transaction;
      existingPendingTransaction.attachmentsUpdateStatus = pendingStatus;
      existingPendingTransaction.notes = notes;
      existingPendingTransaction.transaction_date = transaction_date;
      existingPendingTransaction.attachments = attachments;

      await existingPendingTransaction.save();

      originalTransaction.pending_transaction_id = existingPendingTransaction._id;
      await originalTransaction.save();

      deleteCache('transaction');
      deleteCache('pending_transaction');

      res.status(200).send({
        message: 'Transaction pending successfully!',
        transaction: existingPendingTransaction,
      });
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).send({
      message: 'An error occurred while creating the transaction.',
      error: error.message,
    });
  }
};

exports.readPendingTransaction = async (req, res) => {
  try {
    const { customer, supplier, keyword, date, pageNum, pageSize } = req.query;

    const cacheKey = `pending_transactions:${customer}:${supplier}:${keyword}:${date}:${pageNum}:${pageSize}`;

    const cachedData = getCache('pending_transaction', cacheKey);
    if (cachedData) {
      return res.status(200).send(cachedData);
    }

    const match = {};

    const user = await User.findOne({ email: req.user.email }).exec();

    if (user.role === 'customer') {
      match['customer_id'] = user._id;
    }

    if (customer) {
      match['$or'] = [
        { 'customer.firstName': { $regex: customer, $options: 'i' } },
        { 'customer.lastName': { $regex: customer, $options: 'i' } },
      ];
    }

    if (supplier) {
      match['supplier.name'] = { $regex: supplier, $options: 'i' };
    }

    if (keyword) {
      match.$or = [
        { notes: { $regex: keyword, $options: 'i' } },
        { document: { $regex: keyword, $options: 'i' } },
        { amount: parseFloat(keyword) },
        { transaction_type: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (date) {
      const parsedDate = new Date(date);
      const nextDate = new Date(parsedDate);
      nextDate.setDate(parsedDate.getDate() + 1);

      match.transaction_date = {
        $gte: parsedDate,
        $lt: nextDate,
      };
    }

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier_id',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      {
        $unwind: { path: '$customer', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true },
      },
      {
        $match: match,
      },
      {
        $sort: { created: -1 },
      },
      {
        $project: {
          _id: 1,
          transaction_type: 1,
          amount: 1,
          document: 1,
          notes: 1,
          transaction_date: 1,
          attachments: 1,
          'customer._id': 1,
          'customer.email': 1,
          'customer.firstName': 1,
          'customer.lastName': 1,
          'supplier._id': 1,
          'supplier.email': 1,
          'supplier.name': 1,
        },
      },
      {
        $skip: (parseInt(pageNum, 10) - 1) * pageSize,
      },
      {
        $limit: parseInt(pageSize, 10),
      },
    ];

    const totalPipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier_id',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      {
        $unwind: { path: '$customer', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true },
      },
      {
        $match: match,
      },
      {
        $sort: { created: -1 },
      },
      {
        $project: {
          _id: 1,
          transaction_type: 1,
          amount: 1,
          document: 1,
          balance: 1,
          notes: 1,
          transaction_date: 1,
          'customer._id': 1,
          'customer.email': 1,
          'customer.firstName': 1,
          'customer.lastName': 1,
          'supplier._id': 1,
          'supplier.email': 1,
          'supplier.name': 1,
        },
      },
    ];

    const transactions = await PendingTransaction.aggregate(pipeline);

    const totalTransactions = await PendingTransaction.aggregate(totalPipeline);

    const count = totalTransactions.length > 0 ? totalTransactions.length : 0;

    const result = {
      message: 'Transactions retrieved successfully',
      transactions,
      totalPage: Math.ceil(count / parseInt(pageSize, 10)),
      totalCount: count,
      totalTransactions,
    };

    setCache('pending_transaction', cacheKey, result);

    res.status(200).send(result);
  } catch (error) {
    console.error('Error reading transactions:', error);
    res.status(500).send({
      message: 'An error occurred while retrieving transactions',
      error: error.message,
    });
  }
};

exports.updatePendingTransaction = async (req, res) => {
  try {
    const { pending_transaction_id, allowStatus } = req.body;

    const existingPendingTransaction = await PendingTransaction.findById(pending_transaction_id);
    if (!existingPendingTransaction) {
      return res.status(404).send({ message: 'Pending transaction not found.' });
    }

    if (allowStatus === 'allow') {
      const latestTransaction = await Transaction.findOne({
        _id: existingPendingTransaction.original_transaction,
      });

      let balance =
        existingPendingTransaction.transaction_type === 'invoice'
          ? Number(existingPendingTransaction.amount)
          : -Number(existingPendingTransaction.amount);

      if (
        latestTransaction &&
        latestTransaction._id.toString() ===
          existingPendingTransaction.original_transaction.toString()
      ) {
        balance =
          latestTransaction.transaction_type === 'invoice'
            ? Number(latestTransaction.balance) - Number(latestTransaction.amount) + balance
            : Number(latestTransaction.balance) + Number(latestTransaction.amount) + balance;
      }

      let attachments = latestTransaction.attachments;

      if (existingPendingTransaction.attachmentsUpdateStatus === '0') {
        latestTransaction.attachments.forEach((filePath) => {
          const fullPath = path.join(__dirname, '..', filePath);
          fs.unlink(fullPath, (err) => {
            if (err) {
              console.error(`Error deleting file: ${fullPath}`, err);
            } else {
              console.log(`File deleted successfully: ${fullPath}`);
            }
          });
        });

        attachments = [];
      } else if (existingPendingTransaction.attachmentsUpdateStatus === '1') {
        latestTransaction.attachments.forEach((filePath) => {
          const fullPath = path.join(__dirname, '..', filePath);
          fs.unlink(fullPath, (err) => {
            if (err) {
              console.error(`Error deleting file: ${fullPath}`, err);
            } else {
              console.log(`File deleted successfully: ${fullPath}`);
            }
          });
        });

        attachments = existingPendingTransaction.attachments;
      }

      const translate_transaction_type =
        existingPendingTransaction.transaction_type === 'invoice'
          ? 'factura'
          : existingPendingTransaction.transaction_type === 'payment'
          ? 'pago'
          : 'devolucion';

      latestTransaction.attachments = attachments;
      latestTransaction.transaction_type = existingPendingTransaction.transaction_type;
      latestTransaction.translate_transaction_type = translate_transaction_type;
      latestTransaction.amount = existingPendingTransaction.amount;
      latestTransaction.document = existingPendingTransaction.document;
      latestTransaction.balance = balance;
      latestTransaction.notes = '';
      latestTransaction.transaction_date = existingPendingTransaction.transaction_date;
      latestTransaction.pending_transaction_id = null;

      await latestTransaction.save();

      await PendingTransaction.findByIdAndDelete(pending_transaction_id);

      deleteCache('transaction');
      deleteCache('pending_transaction');

      const otherTransaction = await Transaction.find({
        $and: [
          {
            customer_id: latestTransaction.customer_id,
          },
          {
            created: { $gt: latestTransaction.created },
          },
        ],
      }).sort({ created: -1 });

      otherTransaction.map(async (transaction) => {
        if (transaction.transaction_type === 'invoice') {
          balance += transaction.amount;

          transaction.balance = balance;
        } else {
          balance -= transaction.amount;

          transaction.balance = balance;
        }

        await transaction.save();
      });

      res.status(200).send({
        message: 'Allow pending transaction successfully',
        transaction: latestTransaction,
      });
    } else {
      if (
        existingPendingTransaction.attachments &&
        existingPendingTransaction.attachments.length > 0
      ) {
        existingPendingTransaction.attachments.forEach((filePath) => {
          const fullPath = path.join(__dirname, '..', filePath);
          fs.unlink(fullPath, (err) => {
            if (err) {
              console.error(`Error deleting file: ${fullPath}`, err);
            } else {
              console.log(`File deleted successfully: ${fullPath}`);
            }
          });
        });
      }

      const deletedTransaction = await PendingTransaction.findByIdAndDelete(pending_transaction_id);

      if (deletedTransaction) {
        const originalTransaction = await Transaction.findById(
          deletedTransaction.original_transaction,
        );
        originalTransaction.pending_transaction_id = null;
        await originalTransaction.save();
      }

      res.status(200).send({
        message: 'Disallow pending transaction successfully',
      });
    }

    deleteCache('customer');
    deleteCache('supplier');
    deleteCache('transaction');
    deleteCache('pending_transaction');
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).send({
      message: 'An error occurred while updating the transaction.',
      error: error.message,
    });
  }
};

exports.deletePendingTransaction = async (req, res) => {
  try {
    const { transaction_id } = req.query;

    if (!transaction_id) {
      return res.status(400).send({ message: 'Transaction ID is required.' });
    }

    const transaction = await PendingTransaction.findById(transaction_id);
    if (!transaction) {
      return res.status(404).send({ message: 'Transaction not found.' });
    }

    if (transaction.attachments && transaction.attachments.length > 0) {
      transaction.attachments.forEach((filePath) => {
        const fullPath = path.join(__dirname, '..', filePath);
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${fullPath}`, err);
          } else {
            console.log(`File deleted successfully: ${fullPath}`);
          }
        });
      });
    }

    await PendingTransaction.findByIdAndDelete(transaction_id);

    const originalTransaction = await Transaction.findById(transaction.original_transaction);

    originalTransaction.pending_transaction_id = null;
    await originalTransaction.save();

    deleteCache('transaction');
    deleteCache('pending_transaction');

    res.status(200).send({
      message: 'Transaction and associated attachments deleted successfully!',
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).send({
      message: 'An error occurred while deleting the transaction.',
      error: error.message,
    });
  }
};

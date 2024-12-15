const { deleteCache, getCache, setCache } = require('../config/cacheController');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');

exports.createTransaction = async (req, res) => {
  try {
    const { customer_id, supplier_id, transaction_type, amount, notes, transaction_date } =
      req.body;

    const latestTransaction = await Transaction.findOne({ customer_id }).sort({
      created: -1,
    });

    let balance = transaction_type === 'invoice' ? amount : amount * -1;

    if (latestTransaction) {
      if (transaction_type === 'invoice') {
        balance = latestTransaction.balance + Number(amount);
      } else {
        balance = latestTransaction.balance - Number(amount);
      }
    }

    const attachments = req.files
      ? req.files.map((file) => ({
          originalname: file.originalname,
          hashedName: file.filename,
          path: file.path,
          mimetype: file.mimetype,
        }))
      : [];

    let translate_transaction_type =
      transaction_type === 'invoice'
        ? 'factura'
        : transaction_type === 'payment'
        ? 'pago'
        : 'devolucion';

    const transaction = new Transaction({
      customer_id,
      supplier_id,
      transaction_type,
      translate_transaction_type,
      amount,
      balance,
      notes,
      transaction_date,
      attachments: attachments.map((file) => `uploads/attachments/${file.hashedName}`),
      approve_status: 2,
    });

    await transaction.save();

    deleteCache('customer');
    deleteCache('transaction');
    deleteCache('pending_transaction');
    deleteCache('supplier');

    res.status(201).send({
      message: 'Transaction created successfully!',
      transaction,
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).send({
      message: 'An error occurred while creating the transaction.',
      error: error.message,
    });
  }
};

exports.readTransaction = async (req, res) => {
  try {
    const { customer, supplier, keyword, date, pageNum, pageSize, approve_status } = req.query;

    const cacheKey = `transactions:${req.user.email}:${req.user.role}:${customer}:${supplier}:${keyword}:${date}:${pageNum}:${pageSize}:${approve_status}`;

    const cachedData = getCache('transaction', cacheKey);
    if (cachedData) {
      return res.status(200).send(cachedData);
    }

    const match = {};
    const user = await User.findOne({ email: req.user.email }).exec();

    if (user.role === 'customer') {
      match['customer_id'] = user._id;
    }

    if (customer) {
      const nameParts = customer.trim().split(/\s+/);
      if (nameParts.length > 1) {
        const firstName = nameParts.slice(0, -1).join(' '); // Everything except the last part
        const lastName = nameParts[nameParts.length - 1]; // Last part

        match['$and'] = [
          { 'customer.firstName': { $regex: firstName, $options: 'i' } },
          { 'customer.lastName': { $regex: lastName, $options: 'i' } },
        ];
      } else {
        match['$or'] = [
          { 'customer.firstName': { $regex: customer, $options: 'i' } },
          { 'customer.lastName': { $regex: customer, $options: 'i' } },
        ];
      }
    }

    if (supplier) {
      match['supplier.name'] = { $regex: supplier, $options: 'i' };
    }

    if (approve_status && Number(approve_status) === 1) {
      match['$or'] = [{ approve_status: 1 }, { approve_status: 3 }];
    } else if (approve_status && Number(approve_status) === 2) {
      match['approve_status'] = 2;
    } else if (approve_status && Number(approve_status) === 3) {
      match['approve_status'] = 3;
    }

    if (req.user.role === 'admin') {
      if (keyword) {
        match.$or = [
          { notes: { $regex: keyword, $options: 'i' } },
          { amount: parseFloat(keyword.replace(/-/g, '').replace(/,/g, '')) },
          { transaction_type: { $regex: keyword, $options: 'i' } },
          { translate_transaction_type: { $regex: keyword, $options: 'i' } },
        ];
      }
    } else {
      if (keyword) {
        match.$or = [
          { notes: { $regex: keyword, $options: 'i' } },
          { amount: parseFloat(keyword.replace(/-/g, '').replace(/,/g, '')) },
          { balance: parseFloat(keyword.replace(/,/g, '')) },
          { transaction_type: { $regex: keyword, $options: 'i' } },
          { translate_transaction_type: { $regex: keyword, $options: 'i' } },
        ];
      }
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
        $lookup: {
          from: 'users',
          localField: 'updated_customer_id',
          foreignField: '_id',
          as: 'updated_customer',
        },
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'updated_supplier_id',
          foreignField: '_id',
          as: 'updated_supplier',
        },
      },
      {
        $unwind: { path: '$customer', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$updated_customer', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$updated_supplier', preserveNullAndEmptyArrays: true },
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
          translate_transaction_type: 1,
          amount: 1,
          balance: 1,
          notes: 1,
          transaction_date: 1,
          approve_status: 1,
          attachments: 1,
          updated_transaction_type: 1,
          updated_translate_transaction_type: 1,
          updated_amount: 1,
          updated_balance: 1,
          updated_notes: 1,
          updated_transaction_date: 1,
          updated_attachments: 1,
          isRemoved: 1,
          created: 1,
          'customer._id': 1,
          'customer.email': 1,
          'customer.firstName': 1,
          'customer.lastName': 1,
          'supplier._id': 1,
          'supplier.email': 1,
          'supplier.name': 1,
          'updated_customer._id': 1,
          'updated_customer.email': 1,
          'updated_customer.firstName': 1,
          'updated_customer.lastName': 1,
          'updated_supplier._id': 1,
          'updated_supplier.email': 1,
          'updated_supplier.name': 1,
        },
      },
    ];

    if (pageNum && pageSize) {
      pipeline.push(
        { $skip: (parseInt(pageNum, 10) - 1) * parseInt(pageSize, 10) },
        { $limit: parseInt(pageSize, 10) },
      );
    }

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
          balance: 1,
          notes: 1,
          transaction_date: 1,
          approve_status: 1,
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

    const transactions = await Transaction.aggregate(pipeline);
    const totalTransactions = await Transaction.aggregate(totalPipeline);
    const count = totalTransactions.length > 0 ? totalTransactions.length : 0;

    let incomes = 0;
    let expenses = 0;

    totalTransactions.forEach((item) => {
      if (item.transaction_type === 'invoice') {
        incomes += item.amount;
      } else {
        expenses += item.amount;
      }
    });

    const result = {
      message: 'Transactions retrieved successfully',
      transactions,
      totalPage: Math.ceil(count / parseInt(pageSize, 10)),
      incomes,
      expenses,
      totalCount: count,
      totalTransactions,
    };

    setCache('transaction', cacheKey, result);

    res.status(200).send(result);
  } catch (error) {
    console.error('Error reading transactions:', error);
    res.status(500).send({
      message: 'An error occurred while retrieving transactions',
      error: error.message,
    });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const {
      transaction_id,
      customer_id,
      supplier_id,
      transaction_type,
      amount,
      notes,
      transaction_date,
      isRemove,
    } = req.body;

    if (
      !transaction_id ||
      !customer_id ||
      !supplier_id ||
      !transaction_type ||
      !amount ||
      !transaction_date
    ) {
      return res.status(400).send({ message: 'All fields are required.' });
    }

    const existingTransaction = await Transaction.findById(transaction_id);
    if (!existingTransaction) {
      return res.status(404).send({ message: 'Transaction not found.' });
    }

    let balance = transaction_type === 'invoice' ? Number(amount) : -Number(amount);

    let attachments = [];

    if (req.files && req.files.length > 0) {
      existingTransaction.attachments.forEach((filePath) => {
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
    }

    const translate_transaction_type =
      transaction_type === 'invoice'
        ? 'factura'
        : transaction_type === 'payment'
        ? 'pago'
        : 'devolucion';

    existingTransaction.updated_customer_id = customer_id;
    existingTransaction.updated_supplier_id = supplier_id;
    existingTransaction.updated_transaction_type = transaction_type;
    existingTransaction.updated_translate_transaction_type = translate_transaction_type;
    existingTransaction.updated_amount = amount;
    existingTransaction.updated_balance = balance;
    existingTransaction.updated_notes = notes;
    existingTransaction.updated_transaction_date = transaction_date;
    existingTransaction.updated_attachments = attachments;
    existingTransaction.isRemoved = isRemove;
    existingTransaction.approve_status = 3;

    await existingTransaction.save();

    deleteCache('customer');
    deleteCache('transaction');
    deleteCache('pending_transaction');
    deleteCache('supplier');

    res.status(200).send({
      message: 'Transaction updated successfully!',
      transaction: existingTransaction,
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).send({
      message: 'An error occurred while updating the transaction.',
      error: error.message,
    });
  }
};

exports.approveUpdateTransaction = async (req, res) => {
  try {
    const {
      transaction_id,
      customer_id,
      supplier_id,
      transaction_type,
      amount,
      notes,
      transaction_date,
      isRemove,
      updated_attachments,
    } = req.body;

    if (
      !transaction_id ||
      !customer_id ||
      !supplier_id ||
      !transaction_type ||
      !amount ||
      !transaction_date
    ) {
      return res.status(400).send({ message: 'All fields are required.' });
    }

    const existingTransaction = await Transaction.findById(transaction_id);
    if (!existingTransaction) {
      return res.status(404).send({ message: 'Transaction not found.' });
    }

    const latestTransaction = await Transaction.findOne({
      $and: [{ customer_id }, { created: { $lt: existingTransaction.created } }],
    })
      .sort({ created: -1 })
      .skip(0)
      .limit(1);

    let balance = transaction_type === 'invoice' ? Number(amount) : -Number(amount);

    if (latestTransaction && latestTransaction._id.toString() !== transaction_id) {
      balance =
        transaction_type === 'invoice'
          ? latestTransaction.balance + Number(amount)
          : latestTransaction.balance - Number(amount);
    }

    let attachments = existingTransaction.attachments;

    if (isRemove === 'true') {
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
      attachments = [];
    }

    if (req.files && req.files.length > 0) {
      existingTransaction.attachments.forEach((filePath) => {
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
    }

    if (updated_attachments && updated_attachments.length > 0) {
      existingTransaction.attachments.forEach((filePath) => {
        const fullPath = path.join(__dirname, '..', filePath);
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${fullPath}`, err);
          } else {
            console.log(`File deleted successfully: ${fullPath}`);
          }
        });
      });
      attachments = updated_attachments.map((file) => file);
    }

    const translate_transaction_type =
      transaction_type === 'invoice'
        ? 'factura'
        : transaction_type === 'payment'
        ? 'pago'
        : 'devolucion';

    existingTransaction.customer_id = customer_id;
    existingTransaction.supplier_id = supplier_id;
    existingTransaction.transaction_type = transaction_type;
    existingTransaction.translate_transaction_type = translate_transaction_type;
    existingTransaction.amount = amount;
    existingTransaction.balance = balance;
    existingTransaction.notes = notes;
    existingTransaction.transaction_date = transaction_date;
    existingTransaction.attachments = attachments;
    existingTransaction.approve_status = 1;
    existingTransaction.updated_customer_id = null;
    existingTransaction.updated_supplier_id = null;
    existingTransaction.updated_amount = 0;
    existingTransaction.updated_balance = 0;
    existingTransaction.updated_notes = '';
    (existingTransaction.updated_attachments = []), await existingTransaction.save();

    deleteCache('customer');
    deleteCache('transaction');
    deleteCache('pending_transaction');
    deleteCache('supplier');

    const otherTransactions = await Transaction.find({
      $and: [
        {
          customer_id,
        },
        {
          created: { $gt: existingTransaction.created },
        },
      ],
    });

    otherTransactions.map(async (transaction) => {
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
      message: 'Transaction updated successfully!',
      transaction: existingTransaction,
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).send({
      message: 'An error occurred while updating the transaction.',
      error: error.message,
    });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { transaction_id } = req.query;

    if (!transaction_id) {
      return res.status(400).send({ message: 'Transaction ID is required.' });
    }

    const transaction = await Transaction.findById(transaction_id);
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

    const deletedTransaction = await Transaction.findByIdAndDelete(transaction_id);

    deleteCache('customer');
    deleteCache('transaction');
    deleteCache('pending_transaction');
    deleteCache('supplier');

    const otherTransactions = await Transaction.find({
      customer_id: deletedTransaction.customer_id,
      created: { $gt: deletedTransaction.created },
    });

    const beforeTransaction = await Transaction.findOne({
      customer_id: deletedTransaction.customer_id,
      created: { $lt: deletedTransaction.created },
    });

    if (otherTransactions && otherTransactions.length > 0) {
      if (beforeTransaction) {
        otherTransactions.map(async (transaction) => {
          if (deletedTransaction.transaction_type === 'invoice') {
            transaction.balance -= deletedTransaction.amount;
          } else {
            transaction.balance += deletedTransaction.amount;
          }

          await transaction.save();
        });
      } else {
        let balance;

        otherTransactions.map(async (transaction, index) => {
          if (index === 0) {
            balance =
              transaction.transaction_type === 'invoice'
                ? transaction.amount
                : transaction.amount * -1;

            transaction.balance = balance;
          } else {
            balance =
              transaction.transaction_type === 'invoice'
                ? balance + transaction.amount
                : balance - transaction.amount;

            transaction.balance = balance;
          }

          await transaction.save();
        });
      }
    }

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

exports.getTransactionData = async (req, res) => {
  try {
    const cacheKey = `total_transaction_value:${req.user.email}:${req.user.role}`;
    const cachedData = getCache('transaction', cacheKey);

    if (cachedData) {
      return res.status(200).send(cachedData);
    }

    let filter = {};

    if (req.user.role !== 'admin') {
      filter = {
        customer_id: req.user._id,
      };
    }

    const transactions = await Transaction.find(filter);

    let TotalPurchases = 0;
    let TotalPayments = 0;
    let TotalReturns = 0;

    transactions.map((item) => {
      if (item.transaction_type === 'invoice') {
        TotalPurchases += item.amount;
      } else if (item.transaction_type === 'payment') {
        TotalPayments += item.amount;
      } else {
        TotalReturns += item.amount;
      }
    });

    const responseData = {
      TotalPurchases,
      TotalPayments,
      TotalReturns,
    };

    setCache('transaction', cacheKey, responseData);

    return res.status(200).send(responseData);
  } catch (error) {
    console.error('Error getting transactions data', error);
    return res.status(500).send({
      message: 'An error occurred while getting all transactions.',
      error: error.message,
    });
  }
};

exports.approveCreatingTransaction = async (req, res) => {
  try {
    const { transaction_id } = req.body;

    console.log(transaction_id);

    const transaction = await Transaction.findByIdAndUpdate(
      { _id: transaction_id },
      {
        approve_status: 1,
      },
    );

    deleteCache('customer');
    deleteCache('transaction');
    deleteCache('pending_transaction');
    deleteCache('supplier');

    res.status(200).send({
      message: 'Transaction approve successfully!',
      transaction: transaction,
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).send({
      message: 'An error occurred while updating the transaction.',
      error: error.message,
    });
  }
};

exports.deleteApproveUpdatingTransaction = async (req, res) => {
  try {
    const { transaction_id } = req.body;

    console.log(transaction_id);

    const transaction = await Transaction.findByIdAndUpdate(transaction_id, {
      approve_status: 1,
      updated_customer_id: null,
      updated_supplier_id: null,
      updated_transaction_type: '',
      updated_translate_transaction_type: '',
      updated_amount: 0,
      updated_balance: 0,
      updated_notes: '',
      updated_attachments: [],
    });

    console.log(transaction);

    res.status(200).send({
      message: 'Transaction approve successfully!',
      transaction: transaction,
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).send({
      message: 'An error occurred while deleting the transaction.',
      error: error.message,
    });
  }
};

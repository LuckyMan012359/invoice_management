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

    const transaction = new Transaction({
      customer_id,
      supplier_id,
      transaction_type,
      amount,
      balance,
      notes,
      transaction_date,
      attachments: attachments.map((file) => `uploads/attachments/${file.hashedName}`),
    });

    await transaction.save();

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
    const { customer, supplier, keyword, date, pageNum, pageSize } = req.query;

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
        { amount: parseFloat(keyword) },
        { balance: parseFloat(keyword) },
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
          balance: 1,
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
    ];

    console.log(pageNum, pageSize);

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

    res.status(200).send({
      message: 'Transactions retrieved successfully',
      transactions,
      totalPage: Math.ceil(count / parseInt(pageSize, 10)),
      totalCount: count,
      totalTransactions,
    });
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

    existingTransaction.customer_id = customer_id;
    existingTransaction.supplier_id = supplier_id;
    existingTransaction.transaction_type = transaction_type;
    existingTransaction.amount = amount;
    existingTransaction.balance = balance;
    existingTransaction.notes = notes;
    existingTransaction.transaction_date = transaction_date;
    existingTransaction.attachments = attachments;

    await existingTransaction.save();

    const otherTransactions = await Transaction.find({
      $and: [
        {
          customer_id,
        },
        {
          created: { $gt: existingTransaction.created },
        },
      ],
    }).sort({ created: -1 });

    otherTransactions.map(async (transaction) => {
      if (transaction.transaction_type === 'invoice') {
        balance += transaction.amount;
        console.log(balance);

        transaction.balance = balance;
      } else {
        balance -= transaction.amount;
        console.log(balance);

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

    const otherTransactions = await Transaction.find({
      created: { $gt: deletedTransaction.created },
    }).sort({ created: -1 });

    if (otherTransactions && otherTransactions.length > 0) {
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

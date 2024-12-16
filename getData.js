const Transaction = require('./models/transaction.model');
const PendingTransaction = require('./models/pending_transaction.model');
// const { deleteCache, getCache, setCache } = require('../config/cacheController');
// const Transaction = require('../models/transaction.model');
// const User = require('../models/user.model');
// const fs = require('fs');
// const path = require('path');

const getTransactionDataAmount = (io) => {
  try {
    setInterval(async () => {
      const transactions = await Transaction.find({
        $or: [{ approve_status: 2 }, { approve_status: 3 }],
      });

      const pendingTransactions = await PendingTransaction.find();

      io.emit('transactionDataUpdated', {
        transactions: transactions,
        pendingTransactions: pendingTransactions,
      });
    }, 1000);
  } catch (error) {
    console.error(error);
  }
};

module.exports = getTransactionDataAmount;

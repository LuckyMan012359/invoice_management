const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Transaction Schema
 */
const pendingTransactionSchema = new Schema({
  customer_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  supplier_id: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
  transaction_type: {
    type: String,
    enum: ['invoice', 'payment', 'return'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  document: {
    type: String,
  },
  notes: {
    type: String,
  },
  transaction_date: {
    type: Date,
    required: true,
  },
  attachments: [
    {
      type: String,
      required: true,
    },
  ],
  attachmentsUpdateStatus: {
    type: String,
    enum: ['0', '1', '2'],
    require: true,
  },
  original_transaction: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
    require: true,
  },
  pending: {
    type: Boolean,
    require,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PendingTransaction', pendingTransactionSchema);

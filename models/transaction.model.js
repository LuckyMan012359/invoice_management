const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Transaction Schema
 */
const transactionSchema = new Schema({
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
  translate_transaction_type: {
    type: String,
    enum: ['factura', 'pago', 'devolucion'],
  },
  amount: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
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
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);

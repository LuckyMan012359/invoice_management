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
  updated_customer_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  supplier_id: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
  updated_supplier_id: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  pending_transaction_id: {
    type: Schema.Types.ObjectId,
    ref: 'PendingTransaction',
    default: null,
  },
  transaction_type: {
    type: String,
    enum: ['invoice', 'payment', 'return'],
    required: true,
  },
  updated_transaction_type: {
    type: String,
    enum: ['invoice', 'payment', 'return'],
  },
  translate_transaction_type: {
    type: String,
    enum: ['factura', 'pago', 'devolucion'],
  },
  updated_translate_transaction_type: {
    type: String,
    enum: ['factura', 'pago', 'devolucion'],
  },
  amount: {
    type: Number,
    required: true,
  },
  updated_amount: {
    type: Number,
  },
  balance: {
    type: Number,
    required: true,
  },
  updated_balance: {
    type: Number,
  },
  document: {
    type: String,
  },
  updated_document: {
    type: String,
  },
  notes: {
    type: String,
  },
  updated_notes: {
    type: String,
  },
  transaction_date: {
    type: Date,
    required: true,
  },
  updated_transaction_date: {
    type: Date,
  },
  approve_status: {
    type: Number,
    enum: [1, 2, 3],
  },
  attachments: [
    {
      type: String,
      required: true,
    },
  ],
  updated_attachments: [
    {
      type: String,
    },
  ],
  isRemoved: [
    {
      type: Boolean,
    },
  ],
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);

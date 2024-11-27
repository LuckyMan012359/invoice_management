const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Supplier Schema
 */
const supplierSchema = new Schema({
  name: {
    type: String,
    required: [true, 'FullName not provided '],
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  homeAddress: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: [true, 'Email already exists in database!'],
    lowercase: true,
    trim: true,
    required: [true, 'Email not provided'],
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: '{VALUE} is not a valid email!',
    },
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Supplier', supplierSchema);

const { deleteCache, getCache, setCache } = require('../config/cacheController');
const bcrypt = require('bcryptjs');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');

exports.createCustomer = async (req, res) => {
  const { firstName, lastName, email, phoneNumber, role, homeAddress, password } = req.body;

  try {
    const existingCustomer = await User.findOne({ email }).exec();
    if (existingCustomer) {
      return res
        .status(409)
        .send({ message: "Customer already exist. Please update customer's info." });
    }

    const userData = new User({
      firstName,
      lastName,
      email,
      role: role,
      password: bcrypt.hashSync(password, 8),
      homeAddress: homeAddress,
      phoneNumber: phoneNumber,
    });

    await userData.save();

    deleteCache('customer');
    deleteCache('transaction');
    deleteCache('pending_transaction');

    return res.status(201).send({ message: 'Customer created successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred while creating the customer.' });
  }
};

exports.readCustomer = async (req, res) => {
  const { pageNum, pageSize, keyword } = req.query;

  try {
    const adminUser = await User.findOne({ email: req.user.email }).exec();

    const cacheKey = `customers:${req.user.email}:${req.user.role}:${pageNum}:${pageSize}:${keyword}`;

    const cachedData = getCache('customer', cacheKey);

    if (cachedData) {
      return res.status(200).send(cachedData);
    }

    const nameParts = keyword ? keyword.split(' ').filter(Boolean) : [];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : null;
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : null;

    let filter = {
      email: {
        $ne: adminUser.email,
      },
      ...(keyword
        ? {
            $or: [
              { firstName: { $regex: keyword, $options: 'i' } },
              { lastName: { $regex: keyword, $options: 'i' } },
              { phoneNumber: { $regex: keyword, $options: 'i' } },
              { homeAddress: { $regex: keyword, $options: 'i' } },
              ...(firstName && lastName
                ? [
                    {
                      $and: [
                        { firstName: { $regex: firstName, $options: 'i' } },
                        { lastName: { $regex: lastName, $options: 'i' } },
                      ],
                    },
                  ]
                : []),
            ],
          }
        : {}),
    };

    const limit = parseInt(pageSize);
    const skip = (parseInt(pageNum) - 1) * limit;

    const customers = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalCount = await User.find(filter).countDocuments(filter);

    const resultCustomer = await Promise.all(
      customers.map(async (customer) => {
        const transactions = await Transaction.find({
          customer_id: customer._id,
          approve_status: { $in: [1, 3] },
        });

        if (transactions && transactions.length > 0) {
          const { invoiceTotal, paymentTotal, returnTotal } = transactions.reduce(
            (totals, item) => {
              if (item.transaction_type === 'invoice') {
                totals.invoiceTotal += item.amount || 0;
              } else if (item.transaction_type === 'payment') {
                totals.paymentTotal += item.amount || 0;
              } else {
                totals.returnTotal += item.amount || 0;
              }
              return totals;
            },
            { invoiceTotal: 0, paymentTotal: 0, returnTotal: 0 },
          );

          customer = customer.toObject();
          customer.totalPurchase = invoiceTotal;
          customer.totalPayment = paymentTotal;
          customer.totalReturn = returnTotal;
          customer.totalBalance = invoiceTotal - paymentTotal - returnTotal;
        } else {
          customer = customer.toObject();
          customer.totalPurchase = 0;
          customer.totalPayment = 0;
          customer.totalReturn = 0;
          customer.totalBalance = 0;
        }

        return customer;
      }),
    );

    const totalPipeline = [
      {
        $match: {
          approve_status: { $in: [1, 3] },
        },
      },
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

    const totalTransactions = await Transaction.aggregate(totalPipeline);

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
      data: resultCustomer,
      incomes,
      expenses,
      meta: {
        totalRecords: totalCount,
        currentPage: parseInt(pageNum),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    setCache('customer', cacheKey, result);

    return res.status(200).send(result);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred while fetching customers.' });
  }
};

exports.updateCustomer = async (req, res) => {
  const { _id, firstName, lastName, email, phoneNumber, role, homeAddress, password } = req.body;

  try {
    const existingCustomer = await User.findOne({ _id }).exec();
    if (!existingCustomer) {
      return res.status(404).send({ message: 'Customer not found.' });
    }

    const updateFields = {
      firstName,
      lastName,
      email,
      role,
      homeAddress,
      phoneNumber,
    };

    if (password && password.trim()) {
      updateFields.password = bcrypt.hashSync(password, 8);
    }

    await User.updateOne({ _id }, { $set: updateFields });

    deleteCache('customer');
    deleteCache('supplier');
    deleteCache('transaction');
    deleteCache('pending_transaction');

    return res.status(200).send({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred while updating the customer.' });
  }
};

exports.deleteCustomer = async (req, res) => {
  const { deleteCustomerID } = req.query;

  try {
    if (!deleteCustomerID) {
      return res.status(400).send({ message: 'Customer ID is required.' });
    }

    const deletedCustomer = await User.findByIdAndDelete(deleteCustomerID).exec();
    if (!deletedCustomer) {
      return res.status(404).send({ message: 'Customer not found.' });
    }

    deleteCache('customer');
    deleteCache('transaction');
    deleteCache('pending_transaction');

    return res
      .status(200)
      .send({ message: 'Customer deleted successfully.', customer: deletedCustomer });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return res.status(500).send({ message: 'An error occurred while deleting the customer.' });
  }
};

exports.readOnlyCustomer = async (req, res) => {
  try {
    let filter = {
      role: { $ne: 'admin' },
    };

    if (req.user.role !== 'admin') {
      filter.email = req.user.email;
    }

    const cacheKey = `only_customers:${req.user.email}:${req.user.role}`;

    const cachedData = getCache('customer', cacheKey);
    if (cachedData) {
      return res.status(200).send(cachedData);
    }

    const customers = await User.find(filter).exec();

    const resultCustomer = await Promise.all(
      customers.map(async (customer) => {
        const transactions = await Transaction.find({ customer_id: customer._id });

        if (transactions && transactions.length > 0) {
          const { invoiceTotal, paymentTotal, returnTotal } = transactions.reduce(
            (totals, item) => {
              if (item.transaction_type === 'invoice') {
                totals.invoiceTotal += item.amount || 0;
              } else if (item.transaction_type === 'payment') {
                totals.paymentTotal += item.amount || 0;
              } else {
                totals.returnTotal += item.amount || 0;
              }
              return totals;
            },
            { invoiceTotal: 0, paymentTotal: 0, returnTotal: 0 },
          );

          customer = customer.toObject();
          customer.totalPurchase = invoiceTotal;
          customer.totalPayment = paymentTotal;
          customer.totalReturn = returnTotal;
          customer.totalBalance = invoiceTotal - paymentTotal - returnTotal;
        } else {
          customer = customer.toObject();
          customer.totalPurchase = 0;
          customer.totalPayment = 0;
          customer.totalReturn = 0;
          customer.totalBalance = 0;
        }

        return customer;
      }),
    );

    const result = {
      data: resultCustomer,
    };

    setCache('customer', cacheKey, result);

    return res.status(200).send(result);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred while fetching customers.' });
  }
};

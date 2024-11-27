const bcrypt = require('bcryptjs');
const Trasnaction = require('../models/transaction.model');
const User = require('../models/user.model');

exports.createCustomer = async (req, res) => {
  const { firstName, lastName, email, phoneNumber, role, homeAddress, password } = req.body;
  console.log(role);

  try {
    const existingCustomer = await User.findOne({ email }).exec();
    if (existingCustomer) {
      return res
        .status(409)
        .send({ message: "Customer already exists. Please update customer's info" });
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

    let filter = {
      email: { $ne: adminUser.email },
      ...(keyword
        ? {
            $or: [
              { firstName: { $regex: keyword, $options: 'i' } },
              { lastName: { $regex: keyword, $options: 'i' } },
              { phoneNumber: { $regex: keyword, $options: 'i' } },
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
        const transactions = await Trasnaction.find({ customer_id: customer._id });

        if (transactions && transactions.length > 0) {
          const { invoiceTotal, paymentTotal } = transactions.reduce(
            (totals, item) => {
              if (item.transaction_type === 'invoice') {
                totals.invoiceTotal += item.amount || 0;
              } else {
                totals.paymentTotal += item.amount || 0;
              }
              return totals;
            },
            { invoiceTotal: 0, paymentTotal: 0 },
          );

          customer = customer.toObject();
          customer.totalPurchase = invoiceTotal;
          customer.totalPayment = paymentTotal;
          customer.totalBalance = invoiceTotal - paymentTotal;
        } else {
          customer = customer.toObject();
          customer.totalPurchase = 0;
          customer.totalPayment = 0;
          customer.totalBalance = 0;
          customer.totalBalance = 0;
        }

        return customer;
      }),
    );

    console.log(resultCustomer);

    return res.status(200).send({
      data: resultCustomer,
      meta: {
        totalRecords: totalCount,
        currentPage: parseInt(pageNum),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred while fetching customers.' });
  }
};

exports.updateCustomer = async (req, res) => {
  const { _id, firstName, lastName, email, phoneNumber, homeAddress, password } = req.body;

  console.log(req.body);

  try {
    const existingCustomer = await User.findOne({ _id }).exec();
    if (!existingCustomer) {
      return res.status(404).send({ message: 'Customer not found.' });
    }

    const updateFields = {
      firstName,
      lastName,
      email,
      homeAddress,
      phoneNumber,
    };

    if (password && password.trim()) {
      console.log(123);

      updateFields.password = bcrypt.hashSync(password, 8);
    }

    await User.updateOne({ _id }, { $set: updateFields });

    return res.status(200).send({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred while updating the customer.' });
  }
};

exports.deleteCustomer = async (req, res) => {
  console.log(req.query);
  const { deleteCustomerID } = req.query;

  try {
    if (!deleteCustomerID) {
      return res.status(400).send({ message: 'Customer ID is required.' });
    }

    const deletedCustomer = await User.findByIdAndDelete(deleteCustomerID).exec();
    if (!deletedCustomer) {
      return res.status(404).send({ message: 'Customer not found.' });
    }

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

    const customers = await User.find(filter).exec();

    return res.status(200).send({
      data: customers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred while fetching customers.' });
  }
};

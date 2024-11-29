const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const NodeCache = require('node-cache');
const { getCache, setCache, deleteCache } = require('../config/cacheController');
const userCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

exports.signup = (req, res) => {
  const { firstName, lastName, email, role, password, homeAddress, phoneNumber } = req.body;
  const user = new User({
    firstName,
    lastName,
    email,
    role,
    password: bcrypt.hashSync(password, 8),
    homeAddress,
    phoneNumber,
  });

  user
    .save()
    .then(() => {
      res.status(200).send({
        message: 'User Registered successfully',
      });
    })
    .catch((err) => {
      res.status(500).send({
        message: err,
      });
      return;
    });
};

exports.signin = (req, res) => {
  User.findOne({
    email: req.body.email,
  })
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message: 'User Not found.',
        });
      }

      var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: 'Invalid Password!',
        });
      }

      const expiresIn = 86400;

      var token = jwt.sign(
        {
          id: user.id,
        },
        process.env.API_SECRET,
        {
          expiresIn,
        },
      );

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      res.status(200).send({
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
        },
        message: 'Login successfull',
        accessToken: token,
        expires_at: expiresAt.toISOString(),
      });
    })
    .catch((err) => {
      res.status(500).send({
        message: err,
      });
      return;
    });
};

exports.getUserInfo = async (req, res) => {
  try {
    const cacheKey = `user:${req.user.email}`;

    const cachedData = getCache('customer', cacheKey);
    if (cachedData) {
      return res.status(200).send({ user: cachedData });
    }

    let user = await User.findOne({ email: req.user.email }).exec();

    const transactions = await Transaction.find({ customer_id: user._id });

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

      user = user.toObject();
      user.totalPurchase = invoiceTotal;
      user.totalPayment = paymentTotal;
      user.totalReturn = returnTotal;
      user.totalBalance = invoiceTotal - paymentTotal - returnTotal;
    } else {
      user = user.toObject();
      user.totalPurchase = 0;
      user.totalPayment = 0;
      user.totalReturn = 0;
      user.totalBalance = 0;
    }

    setCache('customer', cacheKey, user);

    res.status(200).send({
      user: user,
    });
  } catch (error) {
    console.error('Error reading user info:', error);
    res.status(500).send({
      message: 'An error occurred while getting user info',
      error: error.message,
    });
  }
};

exports.updateUserInfo = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, homeAddress, password } = req.body;

    const updateFields = {
      firstName,
      lastName,
      phoneNumber,
      homeAddress,
    };

    if (password && password.trim() !== '') {
      updateFields.password = bcrypt.hashSync(password, 8);
    }

    const user = await User.findOneAndUpdate({ email: req.user.email }, updateFields, {
      new: true,
    });

    console.log(user);

    deleteCache('customer');
    deleteCache('transaction');
    deleteCache('pending_transaction');

    res.status(200).send({
      message: 'Updated Successfully',
      user: user,
    });
  } catch (error) {
    console.error('Error updating user info:', error);
    res.status(500).send({
      message: 'An error occurred while updating user info',
      error: error.message,
    });
  }
};

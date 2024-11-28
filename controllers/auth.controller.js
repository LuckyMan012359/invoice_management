const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');

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

exports.hiddencontent = (req, res) => {
  if (!req.user) {
    res.status(403).send({
      message: 'Invalid JWT token',
    });
  }
  if (req.user == 'admin') {
    res.status(200).send({
      message: 'Congratulations! but there is no hidden content',
    });
  } else {
    res.status(403).send({
      message: 'Unauthorised access',
    });
  }
};

exports.userRole = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).exec();

    res.status(200).send({
      role: user.role,
    });
  } catch (error) {
    console.error('Error reading user info:', error);
    res.status(500).send({
      message: 'An error occurred while getting user info',
      error: error.message,
    });
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    let user = await User.findOne({ email: req.user.email }).exec();

    const transactions = await Transaction.find({ customer_id: user._id });

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

      user = user.toObject();
      user.totalPurchase = invoiceTotal;
      user.totalPayment = paymentTotal;
      user.totalBalance = invoiceTotal - paymentTotal;
    } else {
      user = user.toObject();
      user.totalPurchase = 0;
      user.totalPayment = 0;
      user.totalBalance = 0;
    }

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

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

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
    console.error('Error reading transactions:', error);
    res.status(500).send({
      message: 'An error occurred while retrieving transactions',
      error: error.message,
    });
  }
};

const express = require('express');
const {
  createCustomer,
  updateCustomer,
  readCustomer,
  deleteCustomer,
  readOnlyCustomer,
} = require('../controllers/customer.controller');
const verifyToken = require('../middlewares/authJWT');
const router = express.Router();

router.post('/add_customer', verifyToken, createCustomer);
router.get('/get_customers', verifyToken, readCustomer);
router.put('/update_customer', verifyToken, updateCustomer);
router.delete('/delete_customer', verifyToken, deleteCustomer);
router.get('/get_only_customers', verifyToken, readOnlyCustomer);

module.exports = router;

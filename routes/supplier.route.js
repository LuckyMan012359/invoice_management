const express = require('express');
const verifyToken = require('../middlewares/authJWT');
const {
  createSupplier,
  readSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplier.controller');
const router = express.Router();

router.post('/add_supplier', verifyToken, createSupplier);
router.get('/get_suppliers', verifyToken, readSupplier);
router.put('/update_supplier', verifyToken, updateSupplier);
router.delete('/delete_supplier', verifyToken, deleteSupplier);

module.exports = router;

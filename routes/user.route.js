const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authJWT');
const { signup, signin, hiddencontent, userRole } = require('../controllers/auth.controller.js');

router.post('/register', signup);
router.post('/login', signin);
router.get('/hiddencontent', verifyToken, hiddencontent);
router.get('/user_role', verifyToken, userRole);

module.exports = router;

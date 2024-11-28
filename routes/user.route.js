const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authJWT');
const {
  signup,
  signin,
  hiddencontent,
  userRole,
  getUserInfo,
  updateUserInfo,
} = require('../controllers/auth.controller.js');

router.post('/register', signup);
router.post('/login', signin);
router.get('/hiddencontent', verifyToken, hiddencontent);
router.get('/user_role', verifyToken, userRole);
router.get('/get_user_info', verifyToken, getUserInfo);
router.put('/update_user', verifyToken, updateUserInfo);

module.exports = router;

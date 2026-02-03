// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUsers, deleteUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', authUser);

router.post('/register', protect, admin, registerUser); 
router.get('/users', protect, admin, getUsers);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;
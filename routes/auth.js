const express = require('express');
const authcontroller= require('../controllers/auth');
const router = express.Router();

router.post('/register', authcontroller.register)
router.post('/login', authcontroller.login)

module.exports = router;
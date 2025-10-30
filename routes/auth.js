// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// POST /api/login - احراز هویت کاربر
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username, password });

    // پیدا کردن کاربر
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'نام کاربری یا رمز عبور اشتباه است'
      });
    }

    // بررسی رمز عبور (ساده - برای تست)
    // TODO: بعداً با bcrypt جایگزین کنید
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'نام کاربری یا رمز عبور اشتباه است'
      });
    }

    // ایجاد توکن JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'لاگین موفق',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در سرور'
    });
  }
});

module.exports = router;
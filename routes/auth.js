// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');


// در routes/auth.js
router.post('/reset-db', async (req, res) => {
  try {
    console.log('🔄 RESETTING DATABASE...');
    
    // حذف همه کاربرها
    await User.destroy({ where: {} });
    console.log('🗑️ All users deleted');
    
    // ایجاد کاربر تست
    const testUser = await User.create({
      username: 'test',
      password: 'test'
    });
    
    console.log('✅ TEST USER CREATED:', {
      id: testUser.id,
      username: testUser.username,
      password: testUser.password
    });
    
    res.json({
      success: true,
      message: 'دیتابیس ریست شد و کاربر تست ایجاد شد',
      data: testUser
    });
    
  } catch (error) {
    console.error('❌ RESET ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 LOGIN ATTEMPT:', req.body);

        // 🔽 این خطوط رو اضافه کنید برای نمایش همه کاربرها
        const allUsers = await User.findAll();
        console.log('👥 ALL USERS IN DATABASE:', allUsers.map(u => ({ 
            id: u.id, 
            username: u.username,
            password: u.password 
        })));
        console.log('🔍 LOGIN CREDENTIALS:', req.body);
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'نام کاربری و رمز عبور الزامی است'
            });
        }

        // پیدا کردن کاربر
        const user = await User.findOne({ where: { username } });
        console.log('👤 USER FOUND:', user ? 'YES' : 'NO');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }

        // بررسی رمز عبور
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                error: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }

        // ایجاد توکن
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ LOGIN SUCCESS:', username);
        
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
        console.error('❌ LOGIN ERROR:', error);
        res.status(500).json({
            success: false,
            error: 'خطا در سرور'
        });
    }
});

module.exports = router; // ✅ این خط مهمه!
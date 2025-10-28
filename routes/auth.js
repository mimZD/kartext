const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'kartext-jwt-secret-key-2024-change-in-production';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    const isValidPassword = await user.validatePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // پاسخ مطابق با مدل اندروید
    res.json({
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Server error' 
    });
  }
});

module.exports = router;

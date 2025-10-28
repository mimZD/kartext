const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kartext-jwt-secret-key-2024-change-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        error: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken, JWT_SECRET };

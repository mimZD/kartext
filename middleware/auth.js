// middleware/auth.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    console.log('Auth Header:', authHeader);
    
    if (!authHeader) {
        return res.status(401).json({ 
            success: false, 
            error: "Access token required" 
        });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: "Access token required" 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('JWT Error:', err);
            return res.status(403).json({ 
                success: false, 
                error: "Invalid or expired token" 
            });
        }
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
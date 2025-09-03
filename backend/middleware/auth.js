const { authService } = require('../services/database');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  const user = authService.verifyToken(token);
  if (!user) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }

  req.user = user;
  next();
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const user = authService.verifyToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};


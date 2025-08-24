const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

// Verify JWT Token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.token || 
                  req.body.token;

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
        error: true,
        success: false
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET );
    
    // Check if user still exists
    const user = await userModel.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        message: "Invalid token. User not found.",
        error: true,
        success: false
      });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: "Invalid token",
        error: true,
        success: false
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: "Token expired",
        error: true,
        success: false
      });
    }

    res.status(500).json({
      message: error.message || "Internal server error",
      error: true,
      success: false
    });
  }
};

// Require Authentication (alias for verifyToken)
const requireAuth = verifyToken;

// Optional Authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.token || 
                  req.body.token;

    if (!token) {
      return next(); // Continue without authentication
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await userModel.findById(decoded.userId).select('-password');
    if (user) {
      req.userId = decoded.userId;
      req.user = user;
    }

    next();

  } catch (error) {
    // Continue without authentication even if token is invalid
    next();
  }
};

module.exports = {
  verifyToken,
  requireAuth,
  optionalAuth
};

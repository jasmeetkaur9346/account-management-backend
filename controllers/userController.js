const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
        error: true,
        success: false
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists",
        error: true,
        success: false
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new userModel({
      username,
      password: hashedPassword
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      data: {
        id: savedUser._id,
        username: savedUser.username
      },
      error: false,
      success: true
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal server error",
      error: true,
      success: false
    });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
        error: true,
        success: false
      });
    }

    // Find user
    const user = await userModel.findOne({ username });
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
        error: true,
        success: false
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid credentials",
        error: true,
        success: false
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username
        }
      },
      error: false,
      success: true
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal server error",
      error: true,
      success: false
    });
  }
};

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false
      });
    }

    res.status(200).json({
      message: "User profile fetched successfully",
      data: user,
      error: false,
      success: true
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal server error",
      error: true,
      success: false
    });
  }
};

// Logout User
const logoutUser = async (req, res) => {
  try {
    res.status(200).json({
      message: "Logout successful",
      error: false,
      success: true
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal server error",
      error: true,
      success: false
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser
};

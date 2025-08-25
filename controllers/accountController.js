const mongoose = require('mongoose');
const accountModel = require('../models/accountModel');
const entryModel = require('../models/entryModel');

// Create Account
const createAccount = async (req, res) => {
  try {
    const { accountName, phoneNumber } = req.body;

    if (!accountName) {
      return res.status(400).json({
        message: "Account name is required",
        error: true,
        success: false
      });
    }

    // Check if account already exists for this user
    const existingAccount = await accountModel.findOne({
      accountName,
      createdBy: req.userId
    });

    if (existingAccount) {
      return res.status(400).json({
        message: "Account with this name already exists",
        error: true,
        success: false
      });
    }

    const newAccount = new accountModel({
      accountName,
      phoneNumber: phoneNumber || '',
      createdBy: req.userId
    });

    const savedAccount = await newAccount.save();

    res.status(201).json({
      message: "Account created successfully",
      data: savedAccount,
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

// Get All Accounts
const getAllAccounts = async (req, res) => {
  try {
    const accounts = await accountModel.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.userId),
          isActive: true
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'entries',               // entryModel ka default collection name
          let: { accId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$accountId', '$$accId'] } } },
            { $sort: { date: -1, createdAt: -1 } }, // latest by business date, then createdAt
            { $limit: 1 },
            { $project: { _id: 0, amount: 1, type: 1, date: 1, createdAt: 1 } }
          ],
          as: 'lastEntry'
        }
      },
      { $addFields: { lastEntry: { $arrayElemAt: ['$lastEntry', 0] } } }
    ]);

    res.status(200).json({
      message: 'Accounts fetched successfully',
      data: accounts,
      error: false,
      success: true
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Internal server error',
      error: true,
      success: false
    });
  }
};

// Get Account By ID
const getAccountById = async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await accountModel.findOne({
      _id: accountId,
      createdBy: req.userId,
      isActive: true
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
        error: true,
        success: false
      });
    }

    res.status(200).json({
      message: "Account fetched successfully",
      data: account,
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

// Update Account
const updateAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { accountName, phoneNumber } = req.body;

    const account = await accountModel.findOne({
      _id: accountId,
      createdBy: req.userId
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
        error: true,
        success: false
      });
    }

    const updatedAccount = await accountModel.findByIdAndUpdate(
      accountId,
      {
        accountName: accountName || account.accountName,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : account.phoneNumber
      },
      { new: true }
    );

    res.status(200).json({
      message: "Account updated successfully",
      data: updatedAccount,
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

// Delete Account
const deleteAccount = async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await accountModel.findOne({
      _id: accountId,
      createdBy: req.userId
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
        error: true,
        success: false
      });
    }

    // Soft delete
    await accountModel.findByIdAndUpdate(accountId, { isActive: false });

    res.status(200).json({
      message: "Account deleted successfully",
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

// Get Account Balance
const getAccountBalance = async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await accountModel.findOne({
      _id: accountId,
      createdBy: req.userId,
      isActive: true
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
        error: true,
        success: false
      });
    }

    // Calculate balance from entries
    const entries = await entryModel.find({ accountId });
    let balance = 0;

    entries.forEach(entry => {
      if (entry.type === 'given') {
        balance += entry.amount;
      } else if (entry.type === 'receive') {
        balance -= entry.amount;
      }
    });

    // Update account balance
    await accountModel.findByIdAndUpdate(accountId, { balance });

    res.status(200).json({
      message: "Account balance fetched successfully",
      data: { balance },
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
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  getAccountBalance
};

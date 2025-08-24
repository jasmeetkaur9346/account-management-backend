const entryModel = require('../models/entryModel');
const accountModel = require('../models/accountModel');

// Create Entry
const createEntry = async (req, res) => {
  try {
    const { accountId, type, amount, date, reason } = req.body;

    if (!accountId || !type || !amount) {
      return res.status(400).json({
        message: "Account ID, type, and amount are required",
        error: true,
        success: false
      });
    }

    if (!['given', 'receive'].includes(type)) {
      return res.status(400).json({
        message: "Type must be either 'given' or 'receive'",
        error: true,
        success: false
      });
    }

    // Check if account exists and belongs to user
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

    const newEntry = new entryModel({
      accountId,
      type,
      amount: Math.abs(amount), // Ensure positive amount
      date: date || new Date(),
      reason: reason || '',
      createdBy: req.userId
    });

    const savedEntry = await newEntry.save();

    // Update account balance
    let newBalance = account.balance;
    if (type === 'given') {
      newBalance += Math.abs(amount);
    } else if (type === 'receive') {
      newBalance -= Math.abs(amount);
    }

    await accountModel.findByIdAndUpdate(accountId, { balance: newBalance });

    res.status(201).json({
      message: "Entry created successfully",
      data: savedEntry,
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

// Get Entries By Account
const getEntriesByAccount = async (req, res) => {
  try {
    const { accountId } = req.params;

    // Check if account exists and belongs to user
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

    const entries = await entryModel.find({
      accountId,
      createdBy: req.userId
    }).sort({ date: 1, createdAt: 1 }); // Oldest first, latest last

    res.status(200).json({
      message: "Entries fetched successfully",
      data: entries,
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

// Update Entry
const updateEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { type, amount, date, reason } = req.body;

    const entry = await entryModel.findOne({
      _id: entryId,
      createdBy: req.userId
    });

    if (!entry) {
      return res.status(404).json({
        message: "Entry not found",
        error: true,
        success: false
      });
    }

    // Get account for balance calculation
    const account = await accountModel.findById(entry.accountId);
    
    // Reverse old entry effect on balance
    let newBalance = account.balance;
    if (entry.type === 'given') {
      newBalance -= entry.amount;
    } else if (entry.type === 'receive') {
      newBalance += entry.amount;
    }

    // Update entry
    const updatedEntry = await entryModel.findByIdAndUpdate(
      entryId,
      {
        type: type || entry.type,
        amount: amount !== undefined ? Math.abs(amount) : entry.amount,
        date: date || entry.date,
        reason: reason !== undefined ? reason : entry.reason
      },
      { new: true }
    );

    // Apply new entry effect on balance
    const finalType = type || entry.type;
    const finalAmount = amount !== undefined ? Math.abs(amount) : entry.amount;
    
    if (finalType === 'given') {
      newBalance += finalAmount;
    } else if (finalType === 'receive') {
      newBalance -= finalAmount;
    }

    await accountModel.findByIdAndUpdate(entry.accountId, { balance: newBalance });

    res.status(200).json({
      message: "Entry updated successfully",
      data: updatedEntry,
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

// Delete Entry
const deleteEntry = async (req, res) => {
  try {
    const { entryId } = req.params;

    const entry = await entryModel.findOne({
      _id: entryId,
      createdBy: req.userId
    });

    if (!entry) {
      return res.status(404).json({
        message: "Entry not found",
        error: true,
        success: false
      });
    }

    // Get account for balance calculation
    const account = await accountModel.findById(entry.accountId);
    
    // Reverse entry effect on balance
    let newBalance = account.balance;
    if (entry.type === 'given') {
      newBalance -= entry.amount;
    } else if (entry.type === 'receive') {
      newBalance += entry.amount;
    }

    // Delete entry
    await entryModel.findByIdAndDelete(entryId);

    // Update account balance
    await accountModel.findByIdAndUpdate(entry.accountId, { balance: newBalance });

    res.status(200).json({
      message: "Entry deleted successfully",
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

// Get Entry By ID
const getEntryById = async (req, res) => {
  try {
    const { entryId } = req.params;

    const entry = await entryModel.findOne({
      _id: entryId,
      createdBy: req.userId
    }).populate('accountId', 'accountName phoneNumber');

    if (!entry) {
      return res.status(404).json({
        message: "Entry not found",
        error: true,
        success: false
      });
    }

    res.status(200).json({
      message: "Entry fetched successfully",
      data: entry,
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

// Get All Entries for Dashboard
const getAllEntries = async (req, res) => {
  try {
    const entries = await entryModel.find({
      createdBy: req.userId
    })
    .populate('accountId', 'accountName phoneNumber')
    .sort({ date: -1, createdAt: -1 }); // Latest first for dashboard

    res.status(200).json({
      message: "All entries fetched successfully",
      data: entries,
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

// Get Entries by Date Range
const getEntriesByDateRange = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if account exists and belongs to user
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

    let query = {
      accountId,
      createdBy: req.userId
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const entries = await entryModel.find(query)
      .sort({ date: 1, createdAt: 1 }); // Oldest first

    res.status(200).json({
      message: "Entries fetched successfully",
      data: entries,
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
  createEntry,
  getEntriesByAccount,
  updateEntry,
  deleteEntry,
  getEntryById,
  getAllEntries,
  getEntriesByDateRange
};

      
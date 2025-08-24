const express = require('express');
const router = express.Router();

// Import Controllers
const userController = require('../controllers/userController');
const accountController = require('../controllers/accountController');
const entryController = require('../controllers/entryController');

// Import Middleware
const { verifyToken, requireAuth } = require('../middleware/authToken');

// **🔐 User Routes**
router.post('/user-register', userController.registerUser);
router.post('/user-login', userController.loginUser);
router.post('/user-logout', requireAuth, userController.logoutUser);
router.get('/get-profile', requireAuth, userController.getUserProfile);

// **💰 Account Routes**
router.post('/create-account', requireAuth, accountController.createAccount);
router.get('/get-all-accounts', requireAuth, accountController.getAllAccounts);
router.get('/get-single-account/:accountId', requireAuth, accountController.getAccountById);
router.post('/update-account/:accountId', requireAuth, accountController.updateAccount);
router.delete('/delete-account/:accountId', requireAuth, accountController.deleteAccount);
router.get('/get-account-balance/:accountId', requireAuth, accountController.getAccountBalance);

// **📊 Entry Routes**
router.post('/create-entry', requireAuth, entryController.createEntry);
router.get('/get-all-entries', requireAuth, entryController.getAllEntries);
router.get('/get-entry-by-accounts/:accountId', requireAuth, entryController.getEntriesByAccount);
router.get('/get-entry-by-date/:accountId', requireAuth, entryController.getEntriesByDateRange);
router.get('/get-single-entry/:entryId', requireAuth, entryController.getEntryById);
router.post('/update-entry/:entryId', requireAuth, entryController.updateEntry);
router.delete('/delete-entry/:entryId', requireAuth, entryController.deleteEntry);

module.exports = router;

/**
 * routes/chat.routes.js
 */
const router = require('express').Router();
const ctrl = require('../controllers/chat.controller');
const { optionalAuth } = require('../middleware/auth');

// optionalAuth: works for both guests and authenticated users
router.post('/message', optionalAuth, ctrl.sendMessage);
router.get('/history/:sessionId', optionalAuth, ctrl.getChatHistory);

module.exports = router;

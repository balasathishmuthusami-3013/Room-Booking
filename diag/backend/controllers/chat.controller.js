/**
 * controllers/chat.controller.js
 */

const ChatService = require('../services/chat.service');
const { v4: uuidv4 } = require('uuid');

// POST /api/chat/message
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ status: 'fail', message: 'Message is required.' });
    }

    // Use provided sessionId or generate new one
    const session = sessionId || uuidv4();
    const userId = req.user?._id || null;

    const result = await ChatService.processMessage(session, message.trim(), userId);

    res.json({ status: 'success', data: result });
  } catch (err) { next(err); }
};

// GET /api/chat/history/:sessionId
exports.getChatHistory = async (req, res, next) => {
  try {
    const history = await ChatService.getChatHistory(
      req.params.sessionId,
      req.user?._id
    );
    res.json({ status: 'success', data: { history } });
  } catch (err) { next(err); }
};

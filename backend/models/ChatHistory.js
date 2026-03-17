/**
 * models/ChatHistory.js — AI Chatbot Conversation Storage
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: {
      intent: String,         // Detected intent: 'availability', 'pricing', 'booking_help', 'escalate'
      confidence: Number,
      suggestedAction: String,
    },
  },
  { _id: false }
);

const chatHistorySchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for guest sessions
    },
    messages: [messageSchema],
    isEscalated: { type: Boolean, default: false },
    escalatedAt: { type: Date },
    resolvedAt: { type: Date },
    platform: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web',
    },
    // Context maintained across messages
    context: {
      lastRoomQueried: String,
      lastDateRange: {
        checkIn: Date,
        checkOut: Date,
      },
    },
  },
  { timestamps: true }
);

chatHistorySchema.index({ user: 1, createdAt: -1 });
chatHistorySchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);

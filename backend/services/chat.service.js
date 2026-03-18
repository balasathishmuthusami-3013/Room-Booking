/**
 * services/chat.service.js — AI Chatbot with OpenAI + Intelligent Mock Fallback
 *
 * When OPENAI_API_KEY is present → real GPT responses with hotel context
 * When not present → rule-based mock with intent detection
 */

const OpenAI = require('openai');
const ChatHistory = require('../models/ChatHistory');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are "Aria", the AI concierge for Hoto.tours Hotel.
You are warm, professional, and knowledgeable about the hotel.

Your capabilities:
- Check room availability and pricing
- Explain booking steps clearly
- Describe room types and amenities
- Handle cancellation and refund policy questions
- Escalate complex issues to admin staff

Hotel Facts:
- Check-in: 3:00 PM | Check-out: 12:00 PM
- Room types: Standard ($150/night), Deluxe ($300/night), Suite ($600/night), Penthouse ($1500/night)
- Tax: 12% | Service charge: 5%
- Refund policy: Full refund if cancelled 48+ hours before check-in, 50% refund 24-48 hours, no refund within 24 hours
- Payment: Stripe (cards) or Razorpay (UPI/cards)

Always be concise (2-3 sentences max per response). Use emojis sparingly.
If you cannot help with something, say "Let me connect you with our team" and set escalation.`;

// Intent patterns for mock fallback
const INTENT_PATTERNS = {
  availability: /availab|free|open|when|date|check.?in|check.?out/i,
  pricing: /price|cost|rate|how much|fee|charge|expensive|cheap/i,
  booking: /book|reserv|confirm|how to|steps|process/i,
  cancel: /cancel|refund|money back|stop|undo/i,
  amenities: /amenit|pool|spa|gym|restaur|wifi|park|facili/i,
  escalate: /human|agent|staff|manager|help|complaint|problem|issue/i,
};

const MOCK_RESPONSES = {
  availability: (ctx) => `I'd be happy to check availability for you! 📅 
Please provide your check-in and check-out dates, and I'll let you know which rooms are open. 
You can also use the "Check Availability" button on our booking page for real-time results.`,

  pricing: () => `Here's a quick overview of our room rates per night: 🏨
• Standard Room: $150 | Deluxe Room: $300 | Suite: $600 | Penthouse: $1,500
All rates are subject to 12% tax and 5% service charge. We occasionally have seasonal discounts — check the Rooms page for current offers!`,

  booking: () => `Booking with us is simple! Here's how: 📋
1️⃣ Browse rooms and select your dates
2️⃣ Click "Book Now" and fill in guest details  
3️⃣ Choose payment via Stripe (card) or Razorpay (UPI/card)
4️⃣ Receive your booking confirmation by email. Need help at any step?`,

  cancel: () => `Our cancellation policy is designed to be fair: 💼
• **48+ hours** before check-in: Full refund
• **24-48 hours** before: 50% refund  
• **Within 24 hours**: No refund
You can cancel anytime from your "My Bookings" page. Refunds process within 5-7 business days.`,

  amenities: () => `Hoto.tours Hotel offers world-class amenities! ✨
Including: Infinity Pool, Aurum Spa & Wellness Center, Fitness Studio, 7 Restaurants & Bars, Business Center, Concierge Service, 24/7 Room Service, and Valet Parking.
Ask me about any specific amenity for more details!`,

  escalate: () => `I understand you need additional assistance. 🔔
I'm connecting you with our guest services team right now. You can also reach us directly at:
📞 +1 (800) 555-0100 | ✉️ concierge@aurumgrand.com | Available 24/7`,

  default: () => `Welcome to Hoto.tours Hotel! 🏨 I'm Aria, your AI concierge.
I can help you with room availability, pricing, bookings, and amenities.
What can I assist you with today?`,
};

class ChatService {
  static detectIntent(message) {
    for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
      if (pattern.test(message)) return intent;
    }
    return 'default';
  }

  /**
   * processMessage — Main chat entry point
   * Tries OpenAI first, falls back to mock
   */
  static async processMessage(sessionId, userMessage, userId = null) {
    // Load or create session
    let session = await ChatHistory.findOne({ sessionId });
    if (!session) {
      session = await ChatHistory.create({
        sessionId,
        user: userId,
        messages: [],
        context: {},
      });
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    let assistantResponse;
    let intent = ChatService.detectIntent(userMessage);
    let shouldEscalate = intent === 'escalate';

    // Try OpenAI if configured
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key') {
      assistantResponse = await ChatService._callOpenAI(
        session.messages,
        session.context
      );
    } else {
      // Intelligent mock fallback
      assistantResponse = await ChatService._mockResponse(intent, session.context, userMessage);
    }

    // Add assistant response
    session.messages.push({
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date(),
      metadata: { intent, confidence: 0.9 },
    });

    // Handle escalation
    if (shouldEscalate && !session.isEscalated) {
      session.isEscalated = true;
      session.escalatedAt = new Date();
    }

    await session.save();

    return {
      message: assistantResponse,
      intent,
      isEscalated: session.isEscalated,
      sessionId,
    };
  }

  static async _callOpenAI(messages, context) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Build messages array: system + last 10 messages (context window management)
      const conversationMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-10).map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ];

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: conversationMessages,
        max_tokens: 300,
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (err) {
      logger.error('OpenAI API error, falling back to mock:', err.message);
      const intent = ChatService.detectIntent(messages[messages.length - 1]?.content || '');
      return ChatService._mockResponse(intent, context);
    }
  }

  static async _mockResponse(intent, context, userMessage = '') {
    // Slight delay to feel more natural
    await new Promise((r) => setTimeout(r, 500));

    const responseFunc = MOCK_RESPONSES[intent] || MOCK_RESPONSES.default;
    return responseFunc(context, userMessage);
  }

  /**
   * getChatHistory — Retrieve session history
   */
  static async getChatHistory(sessionId, userId) {
    const query = { sessionId };
    if (userId) query.user = userId;
    return ChatHistory.findOne(query).select('messages isEscalated createdAt');
  }
}

module.exports = ChatService;

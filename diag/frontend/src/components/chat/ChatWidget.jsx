/**
 * src/components/chat/ChatWidget.jsx — Floating AI Chatbot
 */

import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { chatAPI } from '../../services/api';

const SUGGESTIONS = ['Room availability', 'View pricing', 'How to book', 'Cancellation policy'];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Welcome to Amigo Hotel! 🏨 I'm Aria, your AI concierge. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const message = text || input.trim();
    if (!message || loading) return;

    setInput('');
    setShowSuggestions(false);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', content: message },
    ]);
    setLoading(true);

    try {
      const { data } = await chatAPI.sendMessage({ message, sessionId });
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: data.data.message },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'I apologize — please try again or contact us at +1 (800) 555-0100.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-amber-400 text-gray-900 shadow-2xl flex items-center justify-center text-2xl hover:bg-amber-300 transition-all hover:scale-110 focus:outline-none"
        aria-label="Open chat"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ maxHeight: '520px', transformOrigin: 'bottom right' }}
      >
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center font-bold text-lg">A</div>
          <div>
            <div className="font-semibold text-sm">Aria — AI Concierge</div>
            <div className="text-amber-400 text-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span> Online
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto text-gray-400 hover:text-white transition">✕</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center text-xs font-bold mr-2 mt-1 shrink-0">A</div>
              )}
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center text-xs font-bold mr-2 mt-1 shrink-0">A</div>
              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs bg-white border border-amber-300 text-amber-700 px-3 py-1 rounded-full hover:bg-amber-50 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask anything..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center hover:bg-amber-300 transition disabled:opacity-50"
          >
            ➤
          </button>
        </div>
      </div>
    </>
  );
}

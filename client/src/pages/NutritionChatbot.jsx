import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChatSocket } from '../hooks/useChatSocket';
import api from '../services/api';
import { Send, MessageSquare, Trash2, ArrowDown, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const getOrInitializeSessionId = () => {
  let id = sessionStorage.getItem('chatSessionId');
  if (!id) {
    id = `session-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('chatSessionId', id);
  }
  return id;
};

const NutritionChatbot = () => {
  const { token, user } = useAuth();
  const [sessionId, setSessionId] = useState(getOrInitializeSessionId);
  const [input, setInput] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  // Hook handles connection, token appending, and typing states
  const {
    messages,
    setMessages,
    sendMessage,
    sendTypingState,
    isStreaming,
    isTyping,
    error,
  } = useChatSocket(sessionId, token);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Load chat history from API on mount/session switch
  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await api.get(`/chat/history/${sessionId}`);
        setMessages(res.data.data.messages);
      } catch (err) {
        console.error('[Chat] Failed to load history:', err);
        toast.error('Failed to load past messages.');
      } finally {
        setHistoryLoading(false);
      }
    };

    if (sessionId) {
      loadHistory();
    }
  }, [sessionId, setMessages]);

  // Auto-scroll to the bottom of the conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Send message handler
  const handleSend = (e) => {
    e.preventDefault();
    const val = input.trim();
    if (!val) return;

    sendMessage(val);
    setInput('');
    sendTypingState(false);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    sendTypingState(e.target.value.length > 0);
  };

  // Clear chat handler
  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear your current conversation?')) {
      const newSessionId = `session-${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('chatSessionId', newSessionId);
      setSessionId(newSessionId);
      setMessages([]);
      toast.success('Chat cleared!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      
      {/* 1. Header controls */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <MessageSquare size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Ask NutriChef</h2>
            <p className="text-[10px] text-slate-400">Conversational Nutrition & Culinary Companion</p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-red-100 hover:text-red-600 hover:bg-red-50/50 rounded-lg text-xs font-semibold text-slate-500 transition-all cursor-pointer"
        >
          <Trash2 size={13} />
          Clear Chat
        </button>
      </div>

      {/* 2. Message History Box */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 scrollbar-hidden"
      >
        {historyLoading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs animate-pulse">
            Loading transcript history...
          </div>
        ) : messages.length === 0 ? (
          /* Welcome Card */
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto p-6 space-y-4">
            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-base font-bold animate-bounce">
              🥗
            </div>
            <div>
              <h3 className="font-bold text-slate-700 text-sm">Welcome to NutriChef Chat!</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Hi {user?.name}, I'm your kitchen sidekick. Ask me nutritional questions, recipe substitutions, or food ideas!
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] text-slate-500 italic max-w-xs">
              "How can I replace eggs in my pancake recipe?"
            </div>
          </div>
        ) : (
          /* Messages list */
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg._id || Math.random().toString()}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-4 text-xs shadow-sm leading-relaxed ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {/* Message Sender Header */}
                  <p className={`text-[9px] font-bold mb-1 opacity-70 ${isUser ? 'text-emerald-100 text-right' : 'text-slate-400'}`}>
                    {isUser ? 'You' : 'NutriChef'}
                  </p>
                  
                  {/* Message text content */}
                  <div className="whitespace-pre-line font-medium">{msg.content}</div>
                </div>
              </div>
            );
          })
        )}

        {/* Dynamic Typing / Streaming States */}
        {isTyping && !isStreaming && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center gap-1.5 shadow-sm">
              <Sparkles size={12} className="text-emerald-500 animate-spin" />
              NutriChef is formulating a response...
            </div>
          </div>
        )}

        {/* Bottom anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Text Box Area */}
      {error && (
        <div className="bg-red-50 text-red-700 text-xs px-4 py-2 border-t border-red-100 font-semibold">
          Error: {error}
        </div>
      )}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex gap-3">
        <input
          type="text"
          placeholder="Ask a question about food, macros, or substitutions..."
          value={input}
          onChange={handleInputChange}
          disabled={isStreaming}
          className="flex-1 px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default NutritionChatbot;

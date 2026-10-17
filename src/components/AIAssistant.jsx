import { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, X, RotateCcw, AlertCircle, MessageSquare } from 'lucide-react';
import api from '../services/api';

const STARTER_QUESTIONS = [
  'How do I create a new sale in POS?',
  'Where can I view low stock products?',
  'Sidee loo eegaa deymaha macaamiisha?',
];

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hello! I am your JILE Electronics AI assistant. Ask me anything about POS, sales, inventory, customers, or reports.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  const handleSend = async (userText) => {
    const textToSend = (userText || input).trim();
    if (!textToSend || loading) return;

    setError('');
    setInput('');

    const newMessages = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Build messages payload for backend (role, content), omitting initial greeting
      const outgoingMessages = newMessages
        .filter((m) => m && m.content && !m.content.includes('Hello! I am your JILE Electronics AI assistant.'))
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      let reply = '';
      try {
        const res = await api.post('/ai/chat', { messages: outgoingMessages });
        reply = res.data?.data?.message || res.data?.message;
      } catch (chatErr) {
        // Fallback to /assistant if needed
        const res = await api.post('/assistant', { messages: outgoingMessages });
        reply = res.data?.reply;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: reply || 'No response received.' }]);
    } catch (err) {
      console.error('AI Assistant error:', err);
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to connect to AI assistant.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          "Hello! I am your JILE Electronics AI assistant. Ask me anything about POS, sales, inventory, customers, or reports.",
      },
    ]);
    setError('');
  };

  return (
    <>
      {/* Floating "Ask AI" Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Ask AI Assistant"
        className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-rose-600 px-4 py-3 sm:px-5 sm:py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition-all duration-200 hover:opacity-95 hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none"
      >
        <div className="relative flex items-center justify-center">
          <Sparkles size={18} className="animate-pulse" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
        </div>
        <span>Ask AI</span>
      </button>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 flex h-[540px] max-h-[82vh] w-[calc(100vw-2rem)] sm:w-[400px] max-w-[420px] flex-col rounded-3xl border border-slate-800/90 bg-slate-900/95 shadow-2xl backdrop-blur-2xl overflow-hidden font-sans">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-rose-600 text-white shadow-md">
                <Bot size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">
                    <span className="text-rose-500">JILE</span> AI Assistant
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400">
                  POS & Inventory Guidance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Restart Chat"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-xs sm:text-sm">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-brand-400 border border-slate-700/80 mb-0.5">
                      <Bot size={15} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 break-words whitespace-pre-wrap leading-relaxed shadow-md ${
                      isUser
                        ? 'bg-gradient-to-r from-brand-600 via-brand-500 to-rose-600 text-white rounded-br-sm'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {/* Starter Questions (show if only initial message is present) */}
            {messages.length === 1 && (
              <div className="pt-2">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MessageSquare size={12} className="text-brand-400" />
                  Suggested Questions
                </p>
                <div className="flex flex-col gap-1.5">
                  {STARTER_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(q)}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-left text-xs font-medium text-slate-300 hover:border-brand-500/50 hover:bg-brand-950/20 hover:text-white transition-all duration-150"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-brand-400 border border-slate-700/80 mb-0.5">
                  <Bot size={15} />
                </div>
                <div className="rounded-2xl rounded-bl-sm border border-slate-700/60 bg-slate-800/90 px-4 py-3 shadow-md">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" />
                    <span
                      className="h-2 w-2 rounded-full bg-brand-400 animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-brand-400 animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    />
                    <span className="ml-2 text-xs text-slate-400 font-medium">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-start gap-2 shadow-inner">
                <AlertCircle size={16} className="shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-200">Error</p>
                  <p className="mt-0.5 break-words">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-slate-800 bg-slate-950/80 p-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-rose-600 text-white shadow-md transition-all duration-200 hover:opacity-95 active:scale-95 disabled:opacity-40"
              aria-label="Send Message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

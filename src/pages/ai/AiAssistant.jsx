import { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Trash2,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Copy,
  Check,
  Languages,
  DollarSign,
  Package,
  TrendingUp,
  CreditCard,
  Layers,
  HelpCircle,
  ArrowRight,
  Shield,
  Loader2,
  FileText,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { money, formatDateTime } from '../../utils/format';

const SUGGESTIONS = [
  {
    id: 'today-sales',
    category: 'Sales',
    labelEn: "Today's Sales",
    labelSo: 'Iibka Maanta',
    promptEn: 'How much did I sell today? Give me the breakdown.',
    promptSo: 'Immisa ayaan iibiyay maanta? I sii faahfaahinta.',
    icon: DollarSign,
  },
  {
    id: 'month-profit',
    category: 'Profit',
    labelEn: "This Month's Profit",
    labelSo: "Faa'iidada Bishan",
    promptEn: 'How much net and gross profit did we generate this month?',
    promptSo: "Immisa faa'iido ah (gross iyo net) ayaan samaynay bishan?",
    icon: TrendingUp,
    adminOnly: true,
  },
  {
    id: 'low-stock',
    category: 'Inventory',
    labelEn: 'Low Stock Products',
    labelSo: 'Alaabta Digniinta ku jirta',
    promptEn: 'Which products are running low on stock and need restocking?',
    promptSo: 'Waa kuwee alaabta qarka u saaran inay dhamaato ee u baahan in la dalbo?',
    icon: AlertTriangle,
  },
  {
    id: 'out-stock',
    category: 'Inventory',
    labelEn: 'Out-of-Stock Products',
    labelSo: 'Alaabta Dhamatay',
    promptEn: 'Show all products that are completely out of stock.',
    promptSo: 'I tus dhammaan alaabta kaydkeedu eberka yahay (out of stock).',
    icon: Package,
  },
  {
    id: 'customer-debts',
    category: 'Finance',
    labelEn: 'Customer Debts',
    labelSo: 'Daymaha Macaamiisha',
    promptEn: 'Who owes money to the store and what is the total debt balance?',
    promptSo: 'Yaa lacag igu leh immisana waaye wadarta daynta maqan?',
    icon: CreditCard,
  },
  {
    id: 'today-expenses',
    category: 'Finance',
    labelEn: "Today's Expenses",
    labelSo: 'Kharashka Maanta',
    promptEn: 'What expenses have been recorded today?',
    promptSo: 'Waa maxay kharashaadka maanta la diiwaangeliyay?',
    icon: DollarSign,
  },
  {
    id: 'best-sellers',
    category: 'Sales',
    labelEn: 'Best-Selling Products',
    labelSo: 'Alaabta ugu Iibka Badan',
    promptEn: 'Which products are our top sellers?',
    promptSo: 'Waa kuwee alaabta ugu iibka badan ee dukaanka?',
    icon: TrendingUp,
  },
  {
    id: 'stock-history',
    category: 'Inventory',
    labelEn: 'Stock Movement History',
    labelSo: 'Dhaqdhaqaaqa Kaydka',
    promptEn: 'Show me recent stock movements this week.',
    promptSo: 'I tus dhaqdhaqaaqii kaydka ee ugu dambeeyay todobaadkan.',
    icon: Layers,
  },
  {
    id: 'weekly-report',
    category: 'Reports',
    labelEn: 'Weekly Business Report',
    labelSo: 'Warbixinta Todobaadka',
    promptEn: 'Give me a comprehensive weekly business performance summary.',
    promptSo: 'I sii warbixin dhamaystiran oo ku saabsan ganacsiga todobaadkan.',
    icon: FileText,
  },
  {
    id: 'how-to-use',
    category: 'Guide',
    labelEn: 'How to Use This System',
    labelSo: 'Sida loo Isticmaalo',
    promptEn: 'Explain how to use the JILE Electronics system modules step by step.',
    promptSo: 'Sidee loo isticmaalaa nidaamka JILE Electronics talaabo talaabo?',
    icon: HelpCircle,
  },
];

function MarkdownRenderer({ text }) {
  if (!text) return null;

  // Split into paragraphs / lines
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        // Headers
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-base text-slate-900 dark:text-white mt-3 mb-1">
              {line.replace('### ', '')}
            </h4>
          );
        }
        if (line.startsWith('## ') || line.startsWith('# ')) {
          return (
            <h3 key={idx} className="font-extrabold text-lg text-slate-900 dark:text-white mt-4 mb-2">
              {line.replace(/^#+\s/, '')}
            </h3>
          );
        }

        // Bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
          const content = line.trim().replace(/^[•\-*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-brand-500 font-bold mt-0.5">•</span>
              <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
            </div>
          );
        }

        // Empty line
        if (!line.trim()) {
          return <div key={idx} className="h-1" />;
        }

        // Regular paragraph with bold, italics, code formatting
        return (
          <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
        );
      })}
    </div>
  );
}

function formatInlineMarkdown(str) {
  if (!str) return '';
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-200/60 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
}

export default function AiAssistant() {
  const { user } = useAuth();
  const [lang, setLang] = useState('en'); // 'en' or 'so'
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingActionId, setConfirmingActionId] = useState(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [copiedIdx, setCopiedIdx] = useState(null);

  // Initialize messages from localStorage or welcome message
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('jile_ai_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // parse error fallback
      }
    }
    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        content: `👋 **Welcome to JILE Electronics AI Assistant!** / **Ku soo dhowow Kaaliyaha Garaadka AI!**

I can answer questions about any system module, analyze live sales, check debts, verify inventory levels, calculate profits, and prepare business actions with your confirmation.

💡 *You can ask in English or Somali. Click any suggested question below to get started!*`,
        actionProposal: null,
      },
    ];
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('jile_ai_chat_history', JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (messageText) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    setInput('');

    const newUserMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const nextConversation = [...messages, newUserMessage];
    setMessages(nextConversation);
    setLoading(true);

    try {
      const payload = {
        messages: nextConversation
          .filter((m) => m && m.id !== 'welcome-msg' && !m.isError && m.content)
          .map((m) => ({
            role: m.role,
            content: m.content,
          })),
      };

      const res = await api.post('/ai/chat', payload);
      const data = res.data.data;

      const aiResponse = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'No response generated.',
        actionProposal: data.actionProposal || null,
        provider: data.provider,
        model: data.model,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error('AI chat failed:', err);
      const errorMsg =
        err.response?.data?.message || 'Failed to connect to AI Assistant. Please check your network or try again.';
      toast.error(errorMsg);

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Error:** ${errorMsg}`,
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (msgId, actionProposal) => {
    if (!actionProposal || confirmingActionId) return;
    setConfirmingActionId(actionProposal.actionId);

    try {
      const res = await api.post('/ai/confirm-action', {
        actionId: actionProposal.actionId,
        token: actionProposal.token,
      });

      const resultData = res.data.data;
      toast.success(resultData.messageEn || 'Action executed successfully!');

      // Update message proposal status to confirmed
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === msgId && msg.actionProposal) {
            return {
              ...msg,
              actionProposal: {
                ...msg.actionProposal,
                confirmed: true,
                result: resultData,
              },
            };
          }
          return msg;
        })
      );
    } catch (err) {
      console.error('Action confirmation failed:', err);
      const errorMsg = err.response?.data?.message || 'Failed to confirm action. Please try again.';
      toast.error(errorMsg);
    } finally {
      setConfirmingActionId(null);
    }
  };

  const handleRejectAction = (msgId) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.actionProposal) {
          return {
            ...msg,
            actionProposal: {
              ...msg.actionProposal,
              rejected: true,
            },
          };
        }
        return msg;
      })
    );
    toast('Action proposal dismissed.', { icon: 'ℹ️' });
  };

  const handleClearChat = () => {
    if (window.confirm(lang === 'so' ? 'Ma hubtaa inaad tirto wada-sheekaysiga?' : 'Are you sure you want to clear conversation history?')) {
      const reset = [
        {
          id: 'welcome-msg',
          role: 'assistant',
          timestamp: new Date().toISOString(),
          content: `👋 **Welcome to JILE Electronics AI Assistant!** / **Ku soo dhowow Kaaliyaha Garaadka AI!**

I can answer questions about any system module, analyze live sales, check debts, verify inventory levels, calculate profits, and prepare business actions with your confirmation.

💡 *You can ask in English or Somali. Click any suggested question below to get started!*`,
          actionProposal: null,
        },
      ];
      setMessages(reset);
      localStorage.setItem('jile_ai_chat_history', JSON.stringify(reset));
      toast.success(lang === 'so' ? 'Wada-sheekaysigii waa la tiray' : 'Conversation history cleared');
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
    toast.success('Copied to clipboard');
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.get('/ai/audit-logs');
      setAuditLogs(res.data.data.items || res.data.data || []);
      setAuditModalOpen(true);
    } catch (err) {
      toast.error('Failed to load AI audit logs');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/25 ring-2 ring-brand-400/30">
            <Bot size={24} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>JILE AI Assistant</span>
                <span className="text-xs px-2 py-0.5 font-bold uppercase rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  Pro Engine
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {lang === 'so'
                ? 'Kaaliyaha garaadka leh ee iibka, kaydka, faa\'iidada & hawlgallada'
                : 'Intelligent business advisor for sales, inventory, profit & confirmed actions'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'so' : 'en')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm"
            title="Toggle prompt language"
          >
            <Languages size={15} className="text-brand-500" />
            <span>{lang === 'en' ? 'English' : 'Af-Soomaali'}</span>
          </button>

          {/* Audit Logs */}
          <button
            onClick={loadAuditLogs}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm"
            title="View AI action audit history"
          >
            <History size={15} className="text-slate-500" />
            <span className="hidden sm:inline">Audit Log</span>
          </button>

          {/* Clear History */}
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white transition-colors shadow-sm"
            title="Clear Chat History"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Suggested Questions Carousel / Grid */}
      <div className="pt-3 pb-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 pl-1">
            <Sparkles size={13} className="text-brand-500" />
            {lang === 'so' ? 'Talooyinka:' : 'Suggestions:'}
          </span>
          {SUGGESTIONS.filter((s) => !s.adminOnly || user?.role === 'admin').map((item) => {
            const Icon = item.icon;
            const prompt = lang === 'so' ? item.promptSo : item.promptEn;
            const label = lang === 'so' ? item.labelSo : item.labelEn;
            return (
              <button
                key={item.id}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:bg-brand-950/40 dark:hover:text-brand-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Icon size={12} className="text-brand-500" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 py-4 pr-2">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const proposal = msg.actionProposal;

          return (
            <div key={msg.id || idx} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md">
                  <Bot size={18} />
                </div>
              )}

              <div
                className={`group relative max-w-2xl rounded-2xl p-4 shadow-sm transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-brand-600/20'
                    : msg.isError
                    ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-900/40'
                    : 'bg-white text-slate-800 border border-slate-200/80 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800'
                }`}
              >
                {/* Header row for timestamp & copy */}
                <div className="flex items-center justify-between text-[11px] mb-1.5 opacity-70">
                  <span className="font-semibold">{isUser ? user?.name || 'You' : 'JILE AI Assistant'}</span>
                  <div className="flex items-center gap-1.5">
                    {msg.timestamp && (
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity"
                      title="Copy message"
                    >
                      {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* Message Content */}
                <div className="overflow-hidden">
                  {isUser ? (
                    <p className="text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MarkdownRenderer text={msg.content} />
                  )}
                </div>

                {/* ACTION PROPOSAL INTERACTIVE CARD */}
                {proposal && (
                  <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-900/60 dark:bg-brand-950/20 text-slate-800 dark:text-slate-200">
                    <div className="flex items-center justify-between border-b border-brand-200/60 dark:border-brand-900/60 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-brand-500 p-1.5 text-white">
                          <Shield size={16} />
                        </span>
                        <div>
                          <p className="font-bold text-xs uppercase tracking-wider text-brand-700 dark:text-brand-300">
                            {lang === 'so' ? proposal.titleSo : proposal.titleEn}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {lang === 'so' ? proposal.summarySo : proposal.summaryEn}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        Pending Approval
                      </span>
                    </div>

                    {/* Proposal Details Table/List */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-white/70 dark:bg-slate-900/70 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 mb-3">
                      {Object.entries(proposal.details || {}).map(([key, value]) => {
                        if (typeof value === 'object' && value !== null) return null;
                        return (
                          <div key={key} className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">{key}</span>
                            <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                              {typeof value === 'number' && key.toLowerCase().includes('price')
                                ? `$${value.toFixed(2)}`
                                : String(value)}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Confirmation Buttons */}
                    {proposal.confirmed ? (
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-100 p-2.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span>
                          {lang === 'so'
                            ? proposal.result?.messageSo || 'Tallaabada si guul leh ayaa loo fuliyay!'
                            : proposal.result?.messageEn || 'Action was approved and executed successfully!'}
                        </span>
                      </div>
                    ) : proposal.rejected ? (
                      <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-2 text-xs text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        <XCircle size={16} />
                        <span>{lang === 'so' ? 'Tallaabadan waa la laalay.' : 'Action was rejected by user.'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleRejectAction(msg.id)}
                          disabled={confirmingActionId === proposal.actionId}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                          {lang === 'so' ? 'Jooji (Cancel)' : 'Cancel'}
                        </button>
                        <button
                          onClick={() => handleConfirmAction(msg.id, proposal)}
                          disabled={confirmingActionId === proposal.actionId}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {confirmingActionId === proposal.actionId ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>{lang === 'so' ? 'La fulinayaa...' : 'Executing...'}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={14} />
                              <span>{lang === 'so' ? 'Xaqiiji oo Fuli' : 'Approve & Execute'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white font-bold text-xs shadow-md">
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md">
              <Bot size={18} />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-500 animate-bounce"></span>
                <span className="h-2 w-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-2 w-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-1">
                {lang === 'so' ? 'AI-gu wuxuu falanqaynayaa xogta...' : 'AI is analyzing live data...'}
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box Footer */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              lang === 'so'
                ? "Weydii su'aal kasta oo ku saabsan nidaamka ama xisaabaadka... (Riix Enter si aad u dirto)"
                : 'Ask any question about system modules, sales, inventory or actions... (Press Enter to send)'
            }
            rows={1}
            disabled={loading}
            className="w-full resize-none rounded-2xl border border-slate-300 bg-white py-3 pl-4 pr-24 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-500 shadow-sm"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2.5 flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 text-xs font-bold text-white shadow-md shadow-brand-500/25 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{lang === 'so' ? 'Dir' : 'Send'}</span>
            <Send size={14} />
          </button>
        </form>
        <p className="text-[11px] text-center text-slate-400 mt-2">
          {lang === 'so'
            ? 'Kaaliyaha AI wuxuu ku xiran yahay xogta dhabta ah ee MongoDB. Tallaabooyinka qorista waxay u baahan yihiin xaqiijin.'
            : 'AI Assistant connects to verified MongoDB records. Write actions require explicit user confirmation before executing.'}
        </p>
      </div>

      {/* Audit Log Modal */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-brand-100 p-2 text-brand-600 dark:bg-brand-950/80 dark:text-brand-400">
                  <History size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Action Audit Trail</h3>
                  <p className="text-xs text-slate-500">History of confirmed business actions executed via AI</p>
                </div>
              </div>
              <button
                onClick={() => setAuditModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No AI actions have been recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log._id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white capitalize">
                        {log.actionType.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                        }`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{log.actionSummary}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                      <span>User: {log.userEmail || log.user?.email || 'Staff'}</span>
                      <span>{formatDateTime(log.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

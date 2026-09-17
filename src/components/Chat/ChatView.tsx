import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../types';
import { api } from '../../services/api';
import { VisualComponent } from '../Common/VisualComponent';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Code,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const ChatView: React.FC = () => {
  const { user } = useAuth();
  const {
    selectedBusiness,
    selectedPersona,
    selectedDataset,
    activeConversationId,
    setActiveConversationId,
    setCurrentView
  } = useWorkspace();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSqlForMsgId, setShowSqlForMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load active conversation messages or show initial welcome
  useEffect(() => {
    async function loadConv() {
      if (activeConversationId) {
        try {
          const res = await api.getConversationDetails(activeConversationId);
          setMessages(res.messages);
        } catch (e) {
          console.warn('Failed to load conversation details', e);
        }
      } else {
        // Welcome message tuned to persona
        setMessages([
          {
            message_id: 'welcome-0',
            conversation_id: 'init',
            role: 'assistant',
            content: `### Welcome to **Enterprise Analytics AI**

I am initialized for **${selectedPersona?.name}** at **${selectedBusiness?.business_name}**.
Connected BigQuery dataset: \`${selectedDataset?.name}\`.

**Persona Scope:**
${selectedPersona?.description}

Ask a data question below to generate persona-aware insights or explore suggested prompts.`,
            suggested_followups: selectedPersona?.default_questions || [
              'What was our total revenue this quarter?',
              'What is our customer retention rate across mobile and broadband?',
              'Show executive overview of strategic pipeline goals.'
            ],
            provider: 'development_fallback',
            created_at: new Date().toISOString()
          }
        ]);
      }
    }
    loadConv();
  }, [activeConversationId, selectedPersona, selectedBusiness, selectedDataset]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    setInputText('');
    setLoading(true);

    // Optimistic user message
    const tempUserMsg: Message = {
      message_id: `temp-${Date.now()}`,
      conversation_id: activeConversationId || 'temp',
      role: 'user',
      content: query,
      provider: 'development_fallback',
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.sendMessage({
        message: query,
        conversation_id: activeConversationId || undefined,
        user_id: user?.id || 'usr-anon',
        persona_id: selectedPersona?.id || 'ceo',
        business_id: selectedBusiness?.business_id || 'vf-ireland',
        dataset_id: selectedDataset?.dataset_id || 'KarthikRudrapati'
      });

      if (!activeConversationId) {
        setActiveConversationId(res.conversation_id);
      }

      setMessages((prev) => [...prev.slice(0, -1), res.user_message, res.response]);
    } catch (err: any) {
      const errorMsg: Message = {
        message_id: `err-${Date.now()}`,
        conversation_id: activeConversationId || 'err',
        role: 'assistant',
        content: `⚠️ **Analytics Error:** ${err.message || 'Failed to process analytics query'}`,
        provider: 'development_fallback',
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050a12] overflow-hidden">
      {/* Top Context Breadcrumb */}
      <div className="px-5 py-2.5 bg-[#0b101c]/90 border-b border-[#1b263c] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#516c91]">Active Thread:</span>
          <span className="font-semibold text-white">
            {selectedPersona?.name} Analytics Workspace
          </span>
          <span className="text-[#1b263c]">•</span>
          <span className="text-[#8ba8d1] font-mono text-[11px]">
            {selectedDataset?.dataset_id}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#516c91]">
          <span>Enforcing Rule 30 (No unsolicited charts)</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.message_id}
              className={`flex gap-3.5 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                  isUser
                    ? 'bg-[#1b263c] text-white border border-[#344967]'
                    : 'gradient-brand text-white shadow-md shadow-red-500/20'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4 text-[#8ba8d1]" /> : <Bot className="w-4 h-4 text-white" />}
              </div>

              {/* Message Bubble Content */}
              <div
                className={`flex-1 rounded-2xl p-4.5 border ${
                  isUser
                    ? 'bg-[#101a2d] border-[#1b263c] text-white'
                    : 'bg-[#0b101c] border-[#1b263c] text-white shadow-xl'
                }`}
              >
                {/* Provider Tag (Doc Rule 50, 51: Never silently pretend fallback is Gemini) */}
                {!isUser && m.provider && (
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#1b263c]/50 text-[10px]">
                    <span className="text-[#516c91] font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#d50072]" />
                      Intent: <span className="text-[#00d8ff] uppercase">{m.intent || 'conversation'}</span>
                    </span>
                    <span className="text-[#8ba8d1] font-mono">
                      Engine: {m.provider === 'gemini' ? 'Vertex AI Gemini 2.5' : 'Development Deterministic Engine'}
                    </span>
                  </div>
                )}

                {/* Markdown text representation */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
                  {m.content}
                </div>

                {/* Dynamic KPIs Scoreboard if generated (Doc Page 21, 26) */}
                {m.kpis && m.kpis.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#1b263c] grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {m.kpis.map((kpi, idx) => (
                      <div key={idx} className="bg-[#101a2d] p-2.5 rounded-xl border border-[#1b263c]">
                        <span className="text-[10px] uppercase font-bold text-[#8ba8d1] block truncate">{kpi.label}</span>
                        <span className="text-base font-extrabold font-display text-white">{kpi.value}</span>
                        {kpi.change && (
                          <span className="text-[10px] font-semibold text-[#28e98c] block mt-0.5">{kpi.change}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Dynamic Visualization if explicitly requested (Doc Page 21, 22) */}
                {m.visualization && (
                  <div className="mt-4 pt-3 border-t border-[#1b263c]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#d50072]" />
                        <span className="text-xs font-bold text-white">{m.visualization.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentView('builder')}
                        className="text-[11px] text-[#00d8ff] hover:underline flex items-center gap-1"
                      >
                        <span>Open in Builder</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="p-3 bg-[#101a2d] rounded-xl border border-[#1b263c]">
                      <VisualComponent config={m.visualization} data={m.visualization.data} height={220} />
                    </div>
                  </div>
                )}

                {/* SQL execution inspector */}
                {m.sql && (
                  <div className="mt-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSqlForMsgId(showSqlForMsgId === m.message_id ? null : m.message_id)}
                      className="text-[11px] text-[#516c91] hover:text-[#8ba8d1] flex items-center gap-1.5 font-mono"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>{showSqlForMsgId === m.message_id ? 'Hide BigQuery SQL' : 'View BigQuery SQL'}</span>
                      {showSqlForMsgId === m.message_id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {showSqlForMsgId === m.message_id && (
                      <div className="mt-2 p-2.5 bg-[#050a12] border border-[#1b263c] rounded-lg font-mono text-xs text-[#28e98c] overflow-x-auto">
                        <pre>{m.sql}</pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Suggested follow-up prompt chips (Doc Page 18, 42) */}
                {m.suggested_followups && m.suggested_followups.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#1b263c]/60">
                    <span className="text-[10px] uppercase font-bold text-[#516c91] tracking-wider block mb-2">
                      Suggested Follow-Ups:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {m.suggested_followups.map((sf, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(sf)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#101a2d] hover:bg-[#1b263c] text-[#8ba8d1] hover:text-white border border-[#1b263c] hover:border-[#344967] transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                        >
                          <span>{sf}</span>
                          <ArrowRight className="w-3 h-3 shrink-0 text-[#d50072]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3.5 max-w-xl mr-auto">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-white">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-[#0b101c] border border-[#1b263c] rounded-2xl p-4 text-xs text-[#8ba8d1] flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#d50072] animate-ping" />
              <span>Analyzing BigQuery schema & formulating insights...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <div className="p-4 bg-[#0b101c] border-t border-[#1b263c]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative max-w-4xl mx-auto flex items-center"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask ${selectedPersona?.name} analytics question, e.g. "What is our customer retention rate?"`}
            className="w-full bg-[#101a2d] border border-[#1b263c] rounded-2xl pl-4 pr-12 py-3 text-sm text-white placeholder-[#516c91] focus:outline-none focus:border-[#d50072] focus:ring-1 focus:ring-[#d50072] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="absolute right-2 p-2 rounded-xl gradient-brand text-white hover:opacity-90 disabled:opacity-30 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[11px] text-[#516c91] text-center mt-2">
          Enterprise Analytics AI queries read-only BigQuery views • Follows strict anti-hallucination policies
        </p>
      </div>
    </div>
  );
};

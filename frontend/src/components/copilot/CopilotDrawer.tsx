import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Package,
  Layers,
  CornerDownLeft,
} from 'lucide-react';
import api from '../../api/client';
import { CopilotMessageResponse } from '../../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  actionButton?: CopilotMessageResponse['actionButton'];
  preparedAction?: CopilotMessageResponse['preparedAction'];
  suggestedFollowUps?: string[];
}

interface CopilotDrawerProps {
  onOpenTransferModal?: (prefill?: any) => void;
  onOpenReceiptModal?: (prefill?: any) => void;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  onOpenTransferModal,
  onOpenReceiptModal,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Hello! I'm **StockSense Copilot**.\n\nAsk me anything about your inventory, warehouse stock levels, pending operations, or how to use the platform.",
      timestamp: new Date(),
      suggestedFollowUps: [
        'Why do I need to reorder steel rods?',
        'How do I create a receipt?',
        'Which products are low in stock?',
        'Show today\'s deliveries',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await api.post('/copilot/chat', { message: query });
      const data: CopilotMessageResponse = res.data.data;

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.message,
        timestamp: new Date(),
        actionButton: data.actionButton,
        preparedAction: data.preparedAction,
        suggestedFollowUps: data.suggestedFollowUps,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const fallbackMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        sender: 'assistant',
        text: 'I could not reach the intelligence service right now. You can continue using StockSense normally or check your network connection.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionButtonClick = (actionButton: CopilotMessageResponse['actionButton']) => {
    if (!actionButton) return;

    if (actionButton.actionType === 'NAVIGATE' && actionButton.path) {
      navigate(actionButton.path);
      // On mobile close drawer, on desktop leave accessible
      if (window.innerWidth < 768) setIsOpen(false);
    }
  };

  const handleReviewPreparedAction = (preparedAction: CopilotMessageResponse['preparedAction']) => {
    if (!preparedAction) return;

    if (preparedAction.actionType === 'TRANSFER') {
      navigate('/transfers');
      if (onOpenTransferModal) {
        onOpenTransferModal(preparedAction.fields);
      }
      if (window.innerWidth < 768) setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl border border-slate-700/80 transition-all duration-200 active:scale-95 group select-none"
        title="Open StockSense Copilot Assistant"
      >
        <div className="w-6 h-6 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-400">
          <Bot className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold tracking-tight">StockSense Copilot</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </button>

      {/* Floating Copilot Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>StockSense Copilot</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-emerald-300">
                    Live Assistant
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Ask about inventory, forecasts, or workflows
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2`}>
                  {/* Bubble Content */}
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brand-600 text-white rounded-br-none shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-none shadow-sm whitespace-pre-line'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Prepared Action Card (e.g. for Transfer preparation) */}
                  {msg.preparedAction && (
                    <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2 shadow-md">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Action Prepared</span>
                      </div>
                      <div className="text-xs font-semibold text-white">{msg.preparedAction.title}</div>
                      <div className="text-[11px] text-slate-300">{msg.preparedAction.summary}</div>
                      <div className="pt-2 border-t border-slate-800 flex gap-2">
                        <button
                          onClick={() => handleReviewPreparedAction(msg.preparedAction)}
                          className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-center transition-colors"
                        >
                          Review & Execute Transfer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Button Navigation */}
                  {msg.actionButton && (
                    <button
                      onClick={() => handleActionButtonClick(msg.actionButton)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 rounded-xl border border-brand-200 dark:border-brand-800 transition-colors shadow-subtle"
                    >
                      <span>{msg.actionButton.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Suggested Follow-up Quick Pills */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedFollowUps.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(prompt)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors text-left"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-slate-400 text-xs pl-9">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium text-slate-500">Querying inventory databases...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask StockSense (e.g. 'Show low stock')..."
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white transition-all shadow-sm active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

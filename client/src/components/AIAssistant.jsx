import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Code2,
  AlertCircle,
  HelpCircle,
  Wrench,
  Zap,
  ArrowDownToLine,
  Trash2,
} from 'lucide-react';
import { aiApi } from '../api/aiApi.js';

const ACTIONS = [
  { id: 'generate', label: 'Generate', icon: Sparkles, desc: 'Generate new code from prompt' },
  { id: 'explain', label: 'Explain', icon: HelpCircle, desc: 'Explain current code step-by-step' },
  { id: 'debug', label: 'Debug', icon: Wrench, desc: 'Analyze errors and fix bugs' },
  { id: 'improve', label: 'Improve', icon: Zap, desc: 'Refactor and optimize code' },
  { id: 'ask', label: 'Ask AI', icon: Code2, desc: 'General programming assistance' },
];

export default function AIAssistant({ activeFile, currentCode, onInsertCode }) {
  const [selectedAction, setSelectedAction] = useState('generate');
  const [prompt, setPrompt] = useState('');
  const [includeCode, setIncludeCode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [configNotice, setConfigNotice] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() && !includeCode) return;

    const userEntry = {
      id: Date.now(),
      role: 'user',
      action: selectedAction,
      prompt: prompt.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversation((prev) => [...prev, userEntry]);
    setPrompt('');
    setLoading(true);
    setConfigNotice(null);

    try {
      const data = await aiApi.assist({
        action: selectedAction,
        prompt: userEntry.prompt,
        code: includeCode ? currentCode : undefined,
        language: activeFile?.language,
      });

      if (data.success && data.reply) {
        const aiEntry = {
          id: Date.now() + 1,
          role: 'assistant',
          action: selectedAction,
          reply: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setConversation((prev) => [...prev, aiEntry]);
      }
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData && responseData.configured === false) {
        setConfigNotice(
          responseData.message ||
            'OpenAI API Key is not configured in server/.env. Add OPENAI_API_KEY to enable live AI assistance.'
        );
      } else {
        const errorEntry = {
          id: Date.now() + 1,
          role: 'assistant',
          isError: true,
          reply:
            responseData?.message ||
            'Failed to get response from AI service. Please check server logs and configuration.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setConversation((prev) => [...prev, errorEntry]);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const extractCodeBlock = (markdown) => {
    const match = markdown.match(/```(?:\w+)?\n([\s\S]*?)```/);
    return match ? match[1] : markdown;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 select-none">
      {/* Top Banner / Actions */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <Sparkles size={14} />
            <span>AI Coding Assistant</span>
          </div>
          {conversation.length > 0 && (
            <button
              onClick={() => setConversation([])}
              className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
              title="Clear chat history"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Action pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {ACTIONS.map((act) => {
            const Icon = act.icon;
            const isSelected = selectedAction === act.id;
            return (
              <button
                key={act.id}
                onClick={() => setSelectedAction(act.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
                title={act.desc}
              >
                <Icon size={12} />
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuration Notice if API key missing */}
      {configNotice && (
        <div className="m-3 p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-400" />
          <div>
            <div className="font-semibold mb-1">AI Setup Notice</div>
            <p className="text-amber-200/80 leading-relaxed">{configNotice}</p>
          </div>
        </div>
      )}

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {conversation.length === 0 && !configNotice && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs space-y-2">
            <Sparkles size={24} className="text-indigo-400/50" />
            <p className="font-medium text-slate-400">Ready to assist your coding session.</p>
            <p className="text-[11px] max-w-xs leading-relaxed">
              Ask questions, generate functions, debug runtime errors, or optimize your code in real time.
            </p>
          </div>
        )}

        {conversation.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col text-xs rounded-lg p-3 ${
              msg.role === 'user'
                ? 'bg-slate-900 border border-slate-800 text-slate-200'
                : msg.isError
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                : 'bg-indigo-950/30 border border-indigo-900/40 text-slate-100'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5 opacity-70 text-[10px] uppercase font-mono">
              <span className="font-semibold">
                {msg.role === 'user' ? `You (${msg.action})` : 'CoDeva AI'}
              </span>
              <span>{msg.timestamp}</span>
            </div>

            <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed select-text">
              {msg.role === 'user' ? msg.prompt : msg.reply}
            </div>

            {msg.role === 'assistant' && !msg.isError && (
              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => copyToClipboard(msg.reply, msg.id)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors"
                >
                  {copiedId === msg.id ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {onInsertCode && (
                  <button
                    onClick={() => onInsertCode(extractCodeBlock(msg.reply))}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    title="Insert extracted code snippet directly into editor"
                  >
                    <ArrowDownToLine size={12} />
                    <span>Insert in Editor</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-indigo-300 font-mono animate-pulse">
            <Sparkles size={14} className="animate-spin text-indigo-400" />
            <span>CoDeva AI is thinking...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCode}
              onChange={(e) => setIncludeCode(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Include current file as context ({activeFile?.name || 'file'})</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={
              selectedAction === 'generate'
                ? 'e.g. Write a function to reverse a linked list...'
                : selectedAction === 'debug'
                ? 'e.g. Why am I getting an index error?'
                : 'Ask AI anything about this code...'
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            className="input-field text-xs py-1.5 flex-1"
          />
          <button
            type="submit"
            disabled={loading || (!prompt.trim() && !includeCode)}
            className="btn btn-primary btn-sm px-3 shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}

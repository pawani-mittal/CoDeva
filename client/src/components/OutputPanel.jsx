import React, { useState } from 'react';
import {
  Play,
  Terminal,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
} from 'lucide-react';
import { executeApi } from '../api/executeApi.js';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript (Node.js)' },
  { id: 'python', label: 'Python 3' },
  { id: 'cpp', label: 'C++ (GCC)' },
  { id: 'java', label: 'Java (OpenJDK)' },
];

export default function OutputPanel({ currentCode, activeFile }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return activeFile?.language === 'python' ? 'python' : 'javascript';
  });
  const [stdin, setStdin] = useState('');
  const [activeTab, setActiveTab] = useState('output'); // 'output' | 'input'
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleRun = async () => {
    if (!currentCode || !currentCode.trim()) {
      setErrorMsg('No code to execute.');
      return;
    }

    setExecuting(true);
    setResult(null);
    setErrorMsg(null);
    setActiveTab('output');

    try {
      const data = await executeApi.execute({
        code: currentCode,
        language: selectedLanguage,
        stdin,
      });

      if (data.success) {
        setResult(data);
      } else {
        setErrorMsg(data.message || 'Execution failed.');
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          'Failed to connect to execution provider. Check server configuration.'
      );
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div
      className={`border-t border-slate-800 bg-slate-950 flex flex-col transition-all duration-200 ${
        isExpanded ? 'h-64' : 'h-10'
      }`}
    >
      {/* Header Bar */}
      <div className="h-10 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <Terminal size={14} className="text-indigo-400" />
            <span>Terminal & Execution</span>
          </div>

          {/* Sub-tabs */}
          {isExpanded && (
            <div className="flex items-center gap-1 ml-4 border-l border-slate-800 pl-4">
              <button
                onClick={() => setActiveTab('output')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  activeTab === 'output'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Console Output
              </button>
              <button
                onClick={() => setActiveTab('input')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  activeTab === 'input'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Standard Input (stdin)
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Language selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={executing}
            className="bg-slate-950 text-xs text-slate-300 border border-slate-700 rounded px-2 py-1 outline-none font-mono"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>

          {/* Run Code Button */}
          <button
            onClick={handleRun}
            disabled={executing}
            className="btn btn-primary btn-sm flex items-center gap-1.5 py-1 px-3 text-xs"
          >
            {executing ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={13} className="fill-current" />
                <span>Run</span>
              </>
            )}
          </button>

          {/* Collapse/Expand button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white p-1"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Panel Content (only when expanded) */}
      {isExpanded && (
        <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-slate-200 bg-[#0d1117]">
          {activeTab === 'input' ? (
            <div className="h-full flex flex-col">
              <label className="text-slate-400 text-[11px] mb-1 font-sans">
                Enter input data passed to program via standard input:
              </label>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Type stdin values here..."
                className="flex-1 w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-slate-200 outline-none resize-none focus:border-indigo-500"
              />
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Metrics header if result available */}
              {result && (
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px]">
                  <div className="flex items-center gap-2">
                    {result.isError ? (
                      <span className="flex items-center gap-1 text-rose-400">
                        <AlertCircle size={14} />
                        <span>Status: {result.status || 'Runtime Error'}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 size={14} />
                        <span>Status: {result.status || 'Success'}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{result.time}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Cpu size={12} />
                      <span>{result.memory}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Standard Output / Errors */}
              {executing ? (
                <div className="flex items-center gap-2 text-indigo-400 font-mono py-4">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting code to execution engine and awaiting stdout...</span>
                </div>
              ) : errorMsg ? (
                <div className="text-rose-400 whitespace-pre-wrap">{errorMsg}</div>
              ) : result ? (
                <div className="space-y-2 whitespace-pre-wrap overflow-x-auto">
                  {result.stdout && (
                    <div className="text-slate-200 leading-relaxed">{result.stdout}</div>
                  )}
                  {result.compile_output && (
                    <div className="text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                      {result.compile_output}
                    </div>
                  )}
                  {result.stderr && (
                    <div className="text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                      {result.stderr}
                    </div>
                  )}
                  {!result.stdout && !result.stderr && !result.compile_output && (
                    <div className="text-slate-500 italic">Program exited with no output.</div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic">
                  Click 'Run' to execute the code using Judge0.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Users,
  Sparkles,
  Play,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Terminal,
  FileCode,
  Zap,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-6">
          <Sparkles size={14} className="text-indigo-400" />
          <span>Real-Time Collaboration + AI-Powered IDE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Code Together in Real Time with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
            Intelligent AI Assistance
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 mb-8 leading-relaxed">
          CoDeva brings multiple developers into a single collaborative workspace.
          Powered by conflict-free Yjs document synchronization, integrated OpenAI assistance,
          cloud-grade code execution, and real-time room chat.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register" className="btn btn-primary py-2.5 px-6 text-sm w-full sm:w-auto">
            <span>Get Started for Free</span>
            <ArrowRight size={16} />
          </Link>
          <a href="#features" className="btn btn-secondary py-2.5 px-6 text-sm w-full sm:w-auto">
            Explore Features
          </a>
        </div>

        {/* IDE Preview Mockup */}
        <div className="mt-14 rounded-xl border border-slate-800 bg-slate-900/60 shadow-2xl p-2 max-w-4xl mx-auto overflow-hidden">
          <div className="h-8 bg-slate-950 rounded-t-lg border-b border-slate-800 flex items-center justify-between px-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-[11px] font-mono text-slate-400">codeva-session • main.py</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
              2 Users Connected
            </span>
          </div>

          <div className="bg-[#1e1e1e] p-4 text-left font-mono text-xs text-slate-300 space-y-1 overflow-x-auto">
            <p className="text-slate-500"># CoDeva Collaborative IDE</p>
            <p><span className="text-purple-400">def</span> <span className="text-blue-400">solve_graph</span>(nodes, edges):</p>
            <p className="pl-4 text-emerald-400">"""Collaboratively implemented graph traversal algorithm"""</p>
            <p className="pl-4">visited = set()</p>
            <p className="pl-4"><span className="text-purple-400">for</span> node <span className="text-purple-400">in</span> nodes:</p>
            <p className="pl-8 text-amber-300"># Collaborator Alice is currently editing line 7...</p>
            <p className="pl-8">visited.add(node)</p>
            <p className="pl-4"><span className="text-purple-400">return</span> list(visited)</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-900">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Engineered for Modern Engineering Teams & Students
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Everything you need for seamless pair programming, academic labs, and software development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Users size={20} />
            </div>
            <h3 className="text-base font-semibold mb-2">Real-Time Yjs Collaboration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Conflict-free CRDT synchronization ensures concurrent edits never overwrite each other.
              Live cursor decorations show exactly where teammates are coding.
            </p>
          </div>

          <div className="card hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <Sparkles size={20} />
            </div>
            <h3 className="text-base font-semibold mb-2">OpenAI-Powered Assistant</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate algorithms, explain complex logic, debug runtime exceptions, and refactor code directly inside the IDE panel with 1-click insertion.
            </p>
          </div>

          <div className="card hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Play size={20} />
            </div>
            <h3 className="text-base font-semibold mb-2">Cloud Code Execution</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compile and run Python, JavaScript, C++, and Java via Judge0 backend integration. View stdout, stderr, execution time, and memory limits in real time.
            </p>
          </div>

          <div className="card hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-base font-semibold mb-2">Integrated Room Chat</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Discuss architecture, share thoughts, and debug together with MongoDB-persisted real-time chat attached to each coding room.
            </p>
          </div>

          <div className="card hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
              <FileCode size={20} />
            </div>
            <h3 className="text-base font-semibold mb-2">Persistent File Management</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create, rename, switch, and delete files with automatic debounced saving. Reopen your project anytime and pick up right where you left off.
            </p>
          </div>

          <div className="card hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-semibold mb-2">Secure Authentication</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bcryptjs password hashing, JSON Web Tokens (JWT), role-based permissions, and rate limiting ensure user privacy and safe collaboration.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center border-t border-slate-900">
        <h2 className="text-2xl font-bold text-white mb-10">How CoDeva Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-indigo-500/40 text-indigo-400 font-bold text-lg flex items-center justify-center mb-3 font-mono">
              1
            </div>
            <h3 className="font-semibold text-sm mb-1">Create or Join a Room</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Generate a unique shareable room ID or join an existing session in one click.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-indigo-500/40 text-indigo-400 font-bold text-lg flex items-center justify-center mb-3 font-mono">
              2
            </div>
            <h3 className="font-semibold text-sm mb-1">Code Simultaneously</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Type concurrently with peers using Monaco and Yjs. Ask the AI assistant for code suggestions anytime.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-indigo-500/40 text-indigo-400 font-bold text-lg flex items-center justify-center mb-3 font-mono">
              3
            </div>
            <h3 className="font-semibold text-sm mb-1">Execute & Iterate</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Pass test inputs, compile, execute, and verify program output instantly in the bottom terminal.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-indigo-400" />
            <span className="font-bold text-slate-300">CoDeva</span>
            <span>— Academic Full-Stack Software Engineering Project</span>
          </div>
          <div>Built with React, Monaco, Yjs, Socket.IO, Express, and MongoDB.</div>
        </div>
      </footer>
    </div>
  );
}

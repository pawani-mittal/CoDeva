import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

export default function Navbar({ roomId, roomName }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur px-4 flex items-center justify-between z-20 select-none">
      <div className="flex items-center gap-4">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 text-decoration-none">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Code2 size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
            CoDeva
          </span>
        </Link>

        {roomId && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Room:</span>
            <span className="text-sm font-medium text-slate-200">{roomName || roomId}</span>
            <span className="text-xs font-mono bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">
              {roomId}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {roomId && (
              <Link
                to="/dashboard"
                className="btn btn-secondary btn-sm flex items-center gap-1.5 text-slate-300 hover:text-white"
                title="Go to Dashboard"
              >
                <LayoutDashboard size={14} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            )}

            {/* Socket status indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-900 border border-slate-800"
              title={connected ? 'Real-time sync connected' : 'Connecting to real-time server...'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-slate-400 font-mono text-[11px] hidden md:inline">
                {connected ? 'LIVE' : 'SYNCING'}
              </span>
            </div>

            {/* User Profile info */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : <User size={14} />}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-medium text-slate-200 leading-tight">{user?.name}</span>
                <span className="text-[10px] text-slate-500 leading-tight truncate max-w-[120px]">
                  {user?.email}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-secondary btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

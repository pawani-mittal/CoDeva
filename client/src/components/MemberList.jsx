import React from 'react';
import { Users, Crown, Circle, FileText } from 'lucide-react';

function getAvatarColor(name = '') {
  const colors = [
    'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    'bg-purple-500/20 text-purple-300 border-purple-500/40',
    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    'bg-amber-500/20 text-amber-300 border-amber-500/40',
    'bg-rose-500/20 text-rose-300 border-rose-500/40',
    'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function MemberList({ members = [], roomOwnerId, files = [] }) {
  const getFileName = (fileId) => {
    if (!fileId) return null;
    const f = files.find((item) => item.id === fileId);
    return f ? f.name : null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Active Members
          </span>
        </div>
        <span className="badge badge-indigo text-[11px] font-mono">
          {members.length} {members.length === 1 ? 'member' : 'members'} online
        </span>
      </div>

      {/* Member Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {members.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            Connecting to presence service...
          </div>
        ) : (
          members.map((member) => {
            const isOwner = member.userId === roomOwnerId;
            const activeFileName = getFileName(member.activeFileId);

            return (
              <div
                key={member.userId}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${getAvatarColor(
                        member.name
                      )}`}
                    >
                      {member.name ? member.name.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    {/* Online status indicator */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                  </div>

                  {/* Name and active file */}
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {member.name}
                      </span>
                      {isOwner && (
                        <span
                          className="text-amber-400 shrink-0"
                          title="Room Owner"
                        >
                          <Crown size={12} />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      {activeFileName ? (
                        <span className="flex items-center gap-1 text-indigo-300 truncate">
                          <FileText size={10} />
                          <span className="truncate">{activeFileName}</span>
                        </span>
                      ) : (
                        <span>Viewing files</span>
                      )}
                      {member.connectedTabs > 1 && (
                        <span className="text-slate-500">({member.connectedTabs} tabs)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status pill */}
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Online
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  FileCode,
  FilePlus,
  Trash2,
  Edit2,
  FolderTree,
  Share2,
  Check,
  ChevronRight,
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog.jsx';

function getFileIconColor(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'text-amber-400';
    case 'ts':
    case 'tsx':
      return 'text-blue-400';
    case 'py':
      return 'text-emerald-400';
    case 'cpp':
    case 'c':
      return 'text-sky-400';
    case 'java':
      return 'text-orange-400';
    case 'json':
      return 'text-yellow-300';
    case 'html':
      return 'text-rose-400';
    case 'css':
      return 'text-indigo-400';
    default:
      return 'text-slate-400';
  }
}

export default function FileExplorer({
  roomId,
  roomName,
  files,
  activeFile,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitCreate = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName('');
    setIsCreating(false);
  };

  const startRename = (file, e) => {
    e.stopPropagation();
    setEditingFileId(file.id);
    setRenameValue(file.name);
  };

  const submitRename = (fileId) => {
    if (renameValue.trim()) {
      onRenameFile(fileId, renameValue.trim());
    }
    setEditingFileId(null);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      setDeleteLoading(true);
      await onDeleteFile(fileToDelete.id);
      setFileToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <aside className="w-64 h-full border-r border-slate-800 bg-slate-950 flex flex-col select-none shrink-0">
      {/* Header / Room info */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <FolderTree size={16} className="text-indigo-400 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 truncate">
            {roomName || 'Project Files'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyLink}
            className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800/60 rounded transition-colors"
            title="Copy Room Link to Invite Collaborators"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded transition-colors"
            title="Create New File"
          >
            <FilePlus size={14} />
          </button>
        </div>
      </div>

      {/* Files list */}
      <div className="flex-1 overflow-y-auto py-2">
        {isCreating && (
          <form onSubmit={submitCreate} className="px-3 py-1">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-indigo-500/50 rounded px-2 py-1">
              <FileCode size={14} className="text-indigo-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="filename.ext"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onBlur={() => {
                  if (!newFileName.trim()) setIsCreating(false);
                }}
                className="w-full bg-transparent text-xs text-slate-100 outline-none font-mono"
              />
            </div>
          </form>
        )}

        {files.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-slate-500">
            No files in this project yet.
          </div>
        ) : (
          <div className="flex flex-col space-y-0.5 px-2">
            {files.map((file) => {
              const isActive = activeFile?.id === file.id;
              const isEditing = editingFileId === file.id;

              return (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors text-xs font-mono ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-200 font-medium border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    <FileCode size={14} className={getFileIconColor(file.name)} />
                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => submitRename(file.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitRename(file.id);
                          if (e.key === 'Escape') setEditingFileId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-900 text-xs text-white border border-indigo-500 rounded px-1 outline-none w-28"
                      />
                    ) : (
                      <span className="truncate">{file.name}</span>
                    )}
                  </div>

                  {/* Actions (visible on hover) */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startRename(file, e)}
                        className="p-1 hover:text-indigo-300 rounded"
                        title="Rename file"
                      >
                        <Edit2 size={12} />
                      </button>
                      {files.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFileToDelete(file);
                          }}
                          className="p-1 hover:text-rose-400 rounded"
                          title="Delete file"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!fileToDelete}
        title="Delete File"
        message={`Are you sure you want to permanently delete "${fileToDelete?.name}"? This action will sync to all connected peers.`}
        confirmLabel="Delete File"
        isDanger={true}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setFileToDelete(null)}
      />
    </aside>
  );
}

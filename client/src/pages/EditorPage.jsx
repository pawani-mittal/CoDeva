import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Users,
  MessageSquare,
  SidebarClose,
  SidebarOpen,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import FileExplorer from '../components/FileExplorer.jsx';
import CodeEditor from '../components/CodeEditor.jsx';
import AIAssistant from '../components/AIAssistant.jsx';
import MemberList from '../components/MemberList.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import OutputPanel from '../components/OutputPanel.jsx';
import { roomApi } from '../api/roomApi.js';
import { fileApi } from '../api/fileApi.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function EditorPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  // State
  const [room, setRoom] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [currentCode, setCurrentCode] = useState('');
  const [members, setMembers] = useState([]);
  const [collaboratorCursors, setCollaboratorCursors] = useState({});
  const [rightPanelTab, setRightPanelTab] = useState('ai'); // 'ai' | 'members' | 'chat'
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load Room and Files data
  const loadRoomData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch room details
      const roomRes = await roomApi.getRoom(roomId);
      if (!roomRes.success || !roomRes.room) {
        setError('Room not found or access denied.');
        return;
      }
      setRoom(roomRes.room);

      // Fetch files
      const filesRes = await fileApi.getFiles(roomId);
      if (filesRes.success && Array.isArray(filesRes.files)) {
        setFiles(filesRes.files);
        if (filesRes.files.length > 0) {
          const defaultFile = filesRes.files.find((f) => f.isDefault) || filesRes.files[0];
          setActiveFile(defaultFile);
          setCurrentCode(defaultFile.content || '');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workspace.');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadRoomData();
  }, [loadRoomData]);

  // Socket.IO Room Joining & Real-time Listeners
  useEffect(() => {
    if (!socket || !roomId) return;

    // Join room over socket
    socket.emit('room:join', { roomId }, (response) => {
      if (!response?.success) {
        console.warn('[Socket] Failed to join room:', response?.message);
      }
    });

    // Listen for presence updates
    const handlePresence = ({ roomId: rId, members: updatedMembers }) => {
      if (rId === roomId && Array.isArray(updatedMembers)) {
        setMembers(updatedMembers);
      }
    };

    // Listen for cursor updates
    const handleCursor = ({ roomId: rId, fileId, position, user: remoteUser }) => {
      if (rId === roomId && remoteUser) {
        setCollaboratorCursors((prev) => ({
          ...prev,
          [remoteUser.id]: {
            fileId,
            position,
            user: remoteUser,
          },
        }));
      }
    };

    // Listen for peer file events
    const handleFileCreated = ({ roomId: rId, file }) => {
      if (rId === roomId && file) {
        setFiles((prev) => (prev.some((f) => f.id === file.id) ? prev : [...prev, file]));
      }
    };

    const handleFileDeleted = ({ roomId: rId, fileId }) => {
      if (rId === roomId && fileId) {
        setFiles((prev) => {
          const remaining = prev.filter((f) => f.id !== fileId);
          if (activeFile?.id === fileId && remaining.length > 0) {
            setActiveFile(remaining[0]);
            setCurrentCode(remaining[0].content || '');
          }
          return remaining;
        });
      }
    };

    const handleFileRenamed = ({ roomId: rId, file }) => {
      if (rId === roomId && file) {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, name: file.name, language: file.language } : f))
        );
        if (activeFile?.id === file.id) {
          setActiveFile((prev) => ({ ...prev, name: file.name, language: file.language }));
        }
      }
    };

    socket.on('presence:update', handlePresence);
    socket.on('cursor:update', handleCursor);
    socket.on('file:created', handleFileCreated);
    socket.on('file:deleted', handleFileDeleted);
    socket.on('file:renamed', handleFileRenamed);

    return () => {
      socket.off('presence:update', handlePresence);
      socket.off('cursor:update', handleCursor);
      socket.off('file:created', handleFileCreated);
      socket.off('file:deleted', handleFileDeleted);
      socket.off('file:renamed', handleFileRenamed);
    };
  }, [socket, roomId, activeFile?.id]);

  // File Operations
  const handleSelectFile = (file) => {
    setActiveFile(file);
    setCurrentCode(file.content || '');
  };

  const handleCreateFile = async (name) => {
    try {
      const data = await fileApi.createFile(roomId, name, '');
      if (data.success && data.file) {
        setFiles((prev) => [...prev, data.file]);
        setActiveFile(data.file);
        setCurrentCode('');
        if (socket) {
          socket.emit('file:created', { roomId, file: data.file });
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create file.');
    }
  };

  const handleRenameFile = async (fileId, newName) => {
    try {
      const data = await fileApi.renameFile(roomId, fileId, newName);
      if (data.success && data.file) {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, name: data.file.name, language: data.file.language } : f))
        );
        if (activeFile?.id === fileId) {
          setActiveFile((prev) => ({ ...prev, name: data.file.name, language: data.file.language }));
        }
        if (socket) {
          socket.emit('file:renamed', { roomId, file: data.file });
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rename file.');
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const data = await fileApi.deleteFile(roomId, fileId);
      if (data.success) {
        const remaining = files.filter((f) => f.id !== fileId);
        setFiles(remaining);
        if (activeFile?.id === fileId && remaining.length > 0) {
          setActiveFile(remaining[0]);
          setCurrentCode(remaining[0].content || '');
        }
        if (socket) {
          socket.emit('file:deleted', { roomId, fileId });
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete file.');
    }
  };

  const handleSaveFile = async (fileId, codeToSave) => {
    try {
      await fileApi.updateFile(roomId, fileId, codeToSave);
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, content: codeToSave } : f))
      );
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  };

  // Insert code generated by AI Assistant
  const handleInsertCode = (codeSnippet) => {
    setCurrentCode(codeSnippet);
    if (activeFile) {
      handleSaveFile(activeFile.id, codeSnippet);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={32} className="animate-spin text-indigo-500 mb-3" />
        <span className="text-xs font-mono">Initializing CoDeva Workspace & Sync Engine...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-4">
        <AlertCircle size={40} className="text-rose-500 mb-3" />
        <h2 className="text-lg font-semibold mb-1">Unable to Open Workspace</h2>
        <p className="text-xs text-slate-400 mb-6 text-center max-w-md">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-sm">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Navigation */}
      <Navbar roomId={room?.roomId} roomName={room?.name} />

      {/* Main IDE Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: File Explorer */}
        <FileExplorer
          roomId={roomId}
          roomName={room?.name}
          files={files}
          activeFile={activeFile}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
        />

        {/* Center: Editor + Bottom Execution Panel */}
        <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-800">
          <div className="flex-1 h-[calc(100%-16rem)] overflow-hidden">
            {activeFile ? (
              <CodeEditor
                key={activeFile.id}
                roomId={roomId}
                file={activeFile}
                collaboratorCursors={collaboratorCursors}
                onSave={handleSaveFile}
                onCodeChange={(newVal) => setCurrentCode(newVal)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Select or create a file to start coding.
              </div>
            )}
          </div>

          {/* Bottom Execution Panel */}
          <OutputPanel currentCode={currentCode} activeFile={activeFile} />
        </div>

        {/* Right Sidebar: AI / Members / Chat */}
        <div
          className={`h-full border-l border-slate-800 bg-slate-950 flex flex-col transition-all duration-150 shrink-0 select-none ${
            isRightPanelOpen ? 'w-80' : 'w-12'
          }`}
        >
          {/* Tabs bar */}
          <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-2">
            {isRightPanelOpen ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRightPanelTab('ai')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    rightPanelTab === 'ai'
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="AI Coding Assistant"
                >
                  <Sparkles size={13} />
                  <span>AI</span>
                </button>

                <button
                  onClick={() => setRightPanelTab('members')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors relative ${
                    rightPanelTab === 'members'
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Active Members"
                >
                  <Users size={13} />
                  <span>Members</span>
                  {members.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>

                <button
                  onClick={() => setRightPanelTab('chat')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    rightPanelTab === 'chat'
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Room Chat"
                >
                  <MessageSquare size={13} />
                  <span>Chat</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-2 w-full">
                <button
                  onClick={() => {
                    setIsRightPanelOpen(true);
                    setRightPanelTab('ai');
                  }}
                  className="p-1.5 text-slate-400 hover:text-indigo-400"
                  title="AI Assistant"
                >
                  <Sparkles size={16} />
                </button>
                <button
                  onClick={() => {
                    setIsRightPanelOpen(true);
                    setRightPanelTab('members');
                  }}
                  className="p-1.5 text-slate-400 hover:text-indigo-400"
                  title="Members"
                >
                  <Users size={16} />
                </button>
                <button
                  onClick={() => {
                    setIsRightPanelOpen(true);
                    setRightPanelTab('chat');
                  }}
                  className="p-1.5 text-slate-400 hover:text-indigo-400"
                  title="Chat"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            )}

            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className="p-1 text-slate-400 hover:text-white"
              title={isRightPanelOpen ? 'Collapse side panel' : 'Expand side panel'}
            >
              {isRightPanelOpen ? <SidebarClose size={15} /> : <SidebarOpen size={15} />}
            </button>
          </div>

          {/* Panel Body */}
          {isRightPanelOpen && (
            <div className="flex-1 overflow-hidden">
              {rightPanelTab === 'ai' && (
                <AIAssistant
                  activeFile={activeFile}
                  currentCode={currentCode}
                  onInsertCode={handleInsertCode}
                />
              )}
              {rightPanelTab === 'members' && (
                <MemberList
                  members={members}
                  roomOwnerId={room?.owner?._id || room?.owner?.id}
                  files={files}
                />
              )}
              {rightPanelTab === 'chat' && <ChatPanel roomId={roomId} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

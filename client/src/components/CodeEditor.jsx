import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { useSocket } from '../context/SocketContext.jsx';
import { Check, Cloud, Loader2 } from 'lucide-react';

export default function CodeEditor({
  roomId,
  file,
  onSave,
  onCodeChange,
  collaboratorCursors = {},
}) {
  const { socket } = useSocket();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const ydocRef = useRef(null);
  const ytextRef = useRef(null);
  const decorationsRef = useRef([]);
  const isApplyingRemoteRef = useRef(false);

  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'syncing'

  // Map file language to monaco language
  const getMonacoLanguage = (lang) => {
    switch (lang) {
      case 'javascript':
        return 'javascript';
      case 'typescript':
        return 'typescript';
      case 'python':
        return 'python';
      case 'cpp':
      case 'c':
        return 'cpp';
      case 'java':
        return 'java';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'markdown':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  // Setup Monaco & Yjs collaboration for current file
  useEffect(() => {
    if (!file || !socket) return;

    // Create fresh Y.Doc for this file session
    const doc = new Y.Doc();
    const yText = doc.getText('monaco');
    ydocRef.current = doc;
    ytextRef.current = yText;

    setSyncStatus('syncing');

    // 1. Initial Handshake: Request sync step 1 from server
    const stateVector = Y.encodeStateVector(doc);
    socket.emit('doc:sync-step-1', {
      roomId,
      fileId: file.id,
      stateVector: Array.from(stateVector),
    });

    // 2. Receive missing updates from server
    const handleSyncStep2 = ({ roomId: rId, fileId: fId, update }) => {
      if (rId === roomId && fId === file.id && update) {
        try {
          isApplyingRemoteRef.current = true;
          Y.applyUpdate(doc, new Uint8Array(update), 'server');

          if (editorRef.current) {
            const currentEditorValue = editorRef.current.getValue();
            const yValue = yText.toString();
            if (currentEditorValue !== yValue) {
              editorRef.current.setValue(yValue);
            }
          }
        } finally {
          isApplyingRemoteRef.current = false;
          setSyncStatus('synced');
        }
      }
    };

    // 3. Receive ongoing remote updates from collaborators
    const handleDocUpdate = ({ roomId: rId, fileId: fId, update, origin }) => {
      if (rId === roomId && fId === file.id && update && origin !== socket.id) {
        try {
          isApplyingRemoteRef.current = true;
          Y.applyUpdate(doc, new Uint8Array(update), 'remote');

          if (editorRef.current) {
            const currentEditorValue = editorRef.current.getValue();
            const yValue = yText.toString();
            if (currentEditorValue !== yValue) {
              // Preserve cursor position during remote update
              const position = editorRef.current.getPosition();
              editorRef.current.setValue(yValue);
              if (position) {
                editorRef.current.setPosition(position);
              }
            }
          }
        } finally {
          isApplyingRemoteRef.current = false;
          setSyncStatus('synced');
        }
      }
    };

    socket.on('doc:sync-step-2', handleSyncStep2);
    socket.on('doc:update', handleDocUpdate);

    // Notify peers that this file is now active for this user
    socket.emit('file:active', { roomId, fileId: file.id });

    return () => {
      socket.off('doc:sync-step-2', handleSyncStep2);
      socket.off('doc:update', handleDocUpdate);
      doc.destroy();
    };
  }, [file?.id, roomId, socket]);

  // Handle local editor mounts
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Apply file initial content if doc is empty
    if (file?.content && (!ytextRef.current || ytextRef.current.toString() === '')) {
      editor.setValue(file.content);
    }

    // Broadcast cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (socket && roomId && file) {
        socket.emit('cursor:update', {
          roomId,
          fileId: file.id,
          position: {
            lineNumber: e.position.lineNumber,
            column: e.position.column,
          },
        });
      }
    });

    // Keyboard shortcut: Ctrl+S / Cmd+S manual save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave && file) {
        onSave(file.id, editor.getValue());
      }
    });
  };

  // Handle local content modifications
  const handleEditorChange = (value) => {
    if (onCodeChange) {
      onCodeChange(value);
    }

    if (isApplyingRemoteRef.current) {
      return;
    }

    const doc = ydocRef.current;
    const yText = ytextRef.current;

    if (doc && yText) {
      setSyncStatus('syncing');

      // Replace Y.Text content
      doc.transact(() => {
        const currentLength = yText.length;
        yText.delete(0, currentLength);
        yText.insert(0, value || '');
      }, 'local');

      // Send update to server
      const update = Y.encodeStateAsUpdate(doc);
      if (socket && roomId && file) {
        socket.emit('doc:update', {
          roomId,
          fileId: file.id,
          update: Array.from(update),
        });
      }

      setSyncStatus('synced');
    }
  };

  // Render collaborator remote cursors in Monaco
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const newDecorations = [];

    Object.entries(collaboratorCursors).forEach(([userId, cursorData]) => {
      if (cursorData.fileId === file?.id && cursorData.position) {
        const { lineNumber, column } = cursorData.position;
        newDecorations.push({
          range: new monaco.Range(lineNumber, column, lineNumber, column),
          options: {
            className: 'collaborator-cursor',
            hoverMessage: { value: `Collaborator: ${cursorData.user?.name || 'Peer'}` },
          },
        });
      }
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [collaboratorCursors, file?.id]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] overflow-hidden">
      {/* File Tab Bar & Sync Status */}
      <div className="h-9 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-3 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1e1e1e] text-slate-200 text-xs font-mono rounded-t border-t border-x border-slate-700">
            <span>{file?.name || 'Untitled'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time Document Sync Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            {syncStatus === 'syncing' ? (
              <>
                <Loader2 size={12} className="animate-spin text-indigo-400" />
                <span className="text-indigo-300">Syncing...</span>
              </>
            ) : (
              <>
                <Cloud size={12} className="text-emerald-400" />
                <span className="text-slate-400">Yjs Synced</span>
              </>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Ctrl+S to save
          </div>
        </div>
      </div>

      {/* Main Monaco Workspace */}
      <div className="flex-1 h-[calc(100%-2.25rem)] relative">
        <Editor
          height="100%"
          language={getMonacoLanguage(file?.language)}
          defaultValue={file?.content || ''}
          theme="vs-dark"
          options={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            lineHeight: 20,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            formatOnPaste: true,
            formatOnType: true,
            renderWhitespace: 'selection',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
          }}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
        />
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ChatPanel({ roomId }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!socket || !roomId) return;

    // Receive chat history from server upon room join
    const handleHistory = ({ roomId: rId, messages: history }) => {
      if (rId === roomId && Array.isArray(history)) {
        setMessages(history);
        setTimeout(scrollToBottom, 100);
      }
    };

    // Receive live incoming messages
    const handleNewMessage = ({ roomId: rId, message }) => {
      if (rId === roomId && message) {
        setMessages((prev) => [...prev, message]);
        setTimeout(scrollToBottom, 50);
      }
    };

    socket.on('chat:history', handleHistory);
    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.off('chat:history', handleHistory);
      socket.off('chat:message', handleNewMessage);
    };
  }, [socket, roomId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || !socket || sending) return;

    setSending(true);
    socket.emit('chat:send', { roomId, content }, (res) => {
      setSending(false);
      if (res?.success) {
        setInputText('');
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Room Chat
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Real-time</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs space-y-1">
            <MessageSquare size={20} className="text-slate-600 mb-1" />
            <p>No messages yet in this room.</p>
            <p className="text-[11px] text-slate-600">Send a greeting to start collaborating!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?.id === user?.id || msg.sender?._id === user?.id;
            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id || msg._id || Math.random()}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400 font-mono">
                  <span className="font-semibold text-slate-300">
                    {isMe ? 'You' : msg.sender?.name || 'Collaborator'}
                  </span>
                  <span>•</span>
                  <span>{timeStr}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed select-text ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message to collaborators..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
            className="input-field text-xs py-1.5 flex-1"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="btn btn-primary btn-sm px-3 shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}

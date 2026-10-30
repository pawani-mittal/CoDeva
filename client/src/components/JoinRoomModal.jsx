import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, X } from 'lucide-react';
import { roomApi } from '../api/roomApi.js';

export default function JoinRoomModal({ isOpen, onClose }) {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanId = roomId.trim();
    if (!cleanId) {
      setError('Please enter a valid Room ID.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await roomApi.joinRoom(cleanId);
      if (data.success) {
        onClose();
        navigate(`/room/${cleanId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Room not found. Please verify the Room ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <LogIn size={18} />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Join Existing Room</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Room Identifier <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. k7b9Z_xQ12"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="input-field font-mono"
              autoFocus
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Enter the unique Room ID shared by the room creator or collaborator.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

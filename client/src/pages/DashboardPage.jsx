import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  LogIn,
  Search,
  Users,
  Code2,
  Trash2,
  Crown,
  Calendar,
  ExternalLink,
  FolderCode,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import CreateRoomModal from '../components/CreateRoomModal.jsx';
import JoinRoomModal from '../components/JoinRoomModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { roomApi } from '../api/roomApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomApi.getUserRooms();
      if (data.success && Array.isArray(data.rooms)) {
        setRooms(data.rooms);
      }
    } catch (err) {
      console.error('Failed to load user rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      setDeleteLoading(true);
      await roomApi.deleteRoom(roomToDelete.roomId);
      setRooms((prev) => prev.filter((r) => r.roomId !== roomToDelete.roomId));
      setRoomToDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete room.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-900">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {user?.name || 'Developer'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select an active coding room or start a new collaborative session.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
            >
              <LogIn size={15} />
              <span>Join Room</span>
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Create New Room</span>
            </button>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-6">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search rooms by name or Room ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 text-xs py-2"
            />
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'} found
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span>Loading coding rooms from database...</span>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30 p-8">
            <FolderCode size={36} className="text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300 mb-1">No coding rooms found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              {searchQuery
                ? `No rooms match your filter "${searchQuery}".`
                : 'You have not joined or created any coding rooms yet. Create your first room to get started!'}
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Create First Room</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => navigate(`/room/${room.roomId}`)}
                className="card bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {room.name}
                    </h3>

                    {room.isOwner ? (
                      <span className="badge badge-indigo text-[10px] shrink-0 flex items-center gap-1">
                        <Crown size={10} className="text-amber-400" />
                        <span>Owner</span>
                      </span>
                    ) : (
                      <span className="badge badge-green text-[10px] shrink-0">Member</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {room.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-950 px-2 py-0.5 rounded text-indigo-300 border border-slate-800">
                      {room.roomId}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Users size={12} />
                      <span>{room.membersCount}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {room.isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoomToDelete(room);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                        title="Delete Room"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <ExternalLink size={13} className="text-slate-500 group-hover:text-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onRoomCreated={(newRoom) => setRooms((prev) => [newRoom, ...prev])}
      />
      <JoinRoomModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      <ConfirmDialog
        isOpen={!!roomToDelete}
        title="Delete Coding Room"
        message={`Are you sure you want to permanently delete room "${roomToDelete?.name}"? All files, messages, and document history will be erased.`}
        confirmLabel="Delete Room"
        isDanger={true}
        loading={deleteLoading}
        onConfirm={handleDeleteRoom}
        onCancel={() => setRoomToDelete(null)}
      />
    </div>
  );
}

import { apiClient } from './client.js';

export const roomApi = {
  async createRoom(name, description, language) {
    const res = await apiClient.post('/rooms', { name, description, language });
    return res.data;
  },

  async getUserRooms() {
    const res = await apiClient.get('/rooms');
    return res.data;
  },

  async getRoom(roomId) {
    const res = await apiClient.get(`/rooms/${roomId}`);
    return res.data;
  },

  async joinRoom(roomId) {
    const res = await apiClient.post(`/rooms/${roomId}/join`);
    return res.data;
  },

  async deleteRoom(roomId) {
    const res = await apiClient.delete(`/rooms/${roomId}`);
    return res.data;
  },
};

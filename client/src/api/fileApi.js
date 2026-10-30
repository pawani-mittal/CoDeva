import { apiClient } from './client.js';

export const fileApi = {
  async getFiles(roomId) {
    const res = await apiClient.get(`/rooms/${roomId}/files`);
    return res.data;
  },

  async createFile(roomId, name, content) {
    const res = await apiClient.post(`/rooms/${roomId}/files`, { name, content });
    return res.data;
  },

  async getFile(roomId, fileId) {
    const res = await apiClient.get(`/rooms/${roomId}/files/${fileId}`);
    return res.data;
  },

  async updateFile(roomId, fileId, content, language) {
    const res = await apiClient.put(`/rooms/${roomId}/files/${fileId}`, { content, language });
    return res.data;
  },

  async renameFile(roomId, fileId, name) {
    const res = await apiClient.patch(`/rooms/${roomId}/files/${fileId}/rename`, { name });
    return res.data;
  },

  async deleteFile(roomId, fileId) {
    const res = await apiClient.delete(`/rooms/${roomId}/files/${fileId}`);
    return res.data;
  },
};

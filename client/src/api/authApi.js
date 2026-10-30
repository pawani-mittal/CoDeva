import { apiClient } from './client.js';

export const authApi = {
  async register(name, email, password) {
    const res = await apiClient.post('/auth/register', { name, email, password });
    return res.data;
  },

  async login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  async logout() {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },
};

import { apiClient } from './client.js';

export const executeApi = {
  async execute({ code, language, stdin }) {
    const res = await apiClient.post('/execute', {
      code,
      language,
      stdin,
    });
    return res.data;
  },
};

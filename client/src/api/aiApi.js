import { apiClient } from './client.js';

export const aiApi = {
  async assist({ action, prompt, code, language, errorContext }) {
    const res = await apiClient.post('/ai/assist', {
      action,
      prompt,
      code,
      language,
      errorContext,
    });
    return res.data;
  },
};

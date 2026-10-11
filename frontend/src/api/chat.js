import { apiRequest } from './client';

export const chatApi = {
  listSessions: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/chat/sessions`);
  },

  createSession: async (workspaceId, title = 'New Research Session') => {
    return apiRequest(`/workspaces/${workspaceId}/chat/sessions`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  getSession: async (sessionId) => {
    return apiRequest(`/chat/sessions/${sessionId}`);
  },

  sendMessage: async (sessionId, content) => {
    return apiRequest(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  deleteSession: async (sessionId) => {
    return apiRequest(`/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },
};

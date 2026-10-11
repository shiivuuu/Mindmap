import { apiRequest } from './client';

export const workspacesApi = {
  list: async () => {
    return apiRequest('/workspaces');
  },

  get: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}`);
  },

  create: async (title, description = '') => {
    return apiRequest('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  },

  update: async (workspaceId, data) => {
    return apiRequest(`/workspaces/${workspaceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });
  },
};

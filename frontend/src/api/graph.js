import { apiRequest } from './client';

export const graphApi = {
  getGraph: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/graph`);
  },

  createNode: async (workspaceId, data) => {
    return apiRequest(`/workspaces/${workspaceId}/graph/nodes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateNode: async (nodeId, data) => {
    return apiRequest(`/graph/nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  createEdge: async (workspaceId, data) => {
    return apiRequest(`/workspaces/${workspaceId}/graph/edges`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

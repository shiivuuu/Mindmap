import { apiRequest } from './client';

export const analyticsApi = {
  getAnalytics: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/analytics`);
  },
};

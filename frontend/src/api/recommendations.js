import { apiRequest } from './client';

export const recommendationsApi = {
  getLearningPath: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/learning-path`);
  },
};

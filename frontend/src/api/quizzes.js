import { apiRequest } from './client';

export const quizzesApi = {
  getQuestions: async (workspaceId, conceptId = null, limit = 20) => {
    let url = `/workspaces/${workspaceId}/quizzes?limit=${limit}`;
    if (conceptId) url += `&concept_id=${conceptId}`;
    return apiRequest(url);
  },

  generateQuestions: async (workspaceId, conceptId = null, count = 3) => {
    return apiRequest(`/workspaces/${workspaceId}/quizzes/generate`, {
      method: 'POST',
      body: JSON.stringify({ concept_id: conceptId, count }),
    });
  },

  submitAttempt: async (workspaceId, answers) => {
    return apiRequest(`/workspaces/${workspaceId}/quizzes/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  getHistory: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/quizzes/history`);
  },
};

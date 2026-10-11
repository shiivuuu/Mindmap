import { apiRequest } from './client';

export const documentsApi = {
  list: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/documents`);
  },

  getDetails: async (documentId) => {
    return apiRequest(`/documents/${documentId}`);
  },

  upload: async (workspaceId, file, title = '') => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    return apiRequest(`/workspaces/${workspaceId}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
  },

  reprocess: async (documentId) => {
    return apiRequest(`/documents/${documentId}/reprocess`, {
      method: 'POST',
    });
  },

  delete: async (documentId) => {
    return apiRequest(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  },
};

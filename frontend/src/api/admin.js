import { apiRequest } from './client';

export const adminApi = {
  getOverview: async () => {
    return apiRequest('/admin/overview');
  },

  getUsers: async () => {
    return apiRequest('/admin/users');
  },

  getDocuments: async () => {
    return apiRequest('/admin/documents');
  },

  reindex: async () => {
    return apiRequest('/admin/reindex', {
      method: 'POST',
    });
  },

  updateRole: async (userId, role) => {
    return apiRequest(`/admin/users/${userId}/role?role=${role}`, {
      method: 'PUT',
    });
  },
};

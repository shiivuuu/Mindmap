import React, { createContext, useContext, useState, useEffect } from 'react';
import { workspacesApi } from '../api/workspaces';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkspaces = async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      return;
    }
    setLoading(true);
    try {
      const list = await workspacesApi.list();
      setWorkspaces(list);
      if (list.length > 0) {
        // Restore saved workspace or pick first
        const savedId = localStorage.getItem('mindmesh_active_workspace');
        const found = list.find(w => w.id === savedId);
        const active = found || list[0];
        setCurrentWorkspace(active);
        localStorage.setItem('mindmesh_active_workspace', active.id);
      } else {
        setCurrentWorkspace(null);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [isAuthenticated]);

  const switchWorkspace = (workspaceId) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws) {
      setCurrentWorkspace(ws);
      localStorage.setItem('mindmesh_active_workspace', ws.id);
    }
  };

  const createWorkspace = async (title, description) => {
    const created = await workspacesApi.create(title, description);
    await fetchWorkspaces();
    setCurrentWorkspace(created);
    localStorage.setItem('mindmesh_active_workspace', created.id);
    return created;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        loading,
        switchWorkspace,
        createWorkspace,
        refreshWorkspaces: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}

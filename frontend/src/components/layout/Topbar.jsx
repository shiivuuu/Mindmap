import React, { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  Plus,
  ChevronDown,
  Layers,
  Sparkles,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function Topbar({ setMobileOpen, pageTitle = 'Dashboard' }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { workspaces, currentWorkspace, switchWorkspace, createWorkspace } = useWorkspace();
  
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [newWsTitle, setNewWsTitle] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [creatingWs, setCreatingWs] = useState(false);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsTitle.trim()) return;
    setCreatingWs(true);
    try {
      await createWorkspace(newWsTitle.trim(), newWsDesc.trim());
      setShowNewWorkspaceModal(false);
      setNewWsTitle('');
      setNewWsDesc('');
    } catch (err) {
      alert(err.message || 'Failed to create workspace');
    } finally {
      setCreatingWs(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 border-b bg-[#0B0F19]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-slate-800/80">
      {/* Left: Mobile hamburger & Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-slate-400 rounded-lg lg:hidden hover:text-white hover:bg-slate-800/60"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>MindMesh AI</span>
            <span>/</span>
            <span className="text-violet-400 font-medium capitalize">{pageTitle}</span>
          </div>
          <h1 className="text-base font-semibold text-white tracking-tight">{pageTitle}</h1>
        </div>
      </div>

      {/* Right Controls: Workspace Selector, Search, Notifications, Theme, Profile */}
      <div className="flex items-center gap-3">
        {/* Workspace Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/60 text-slate-200 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[130px] truncate">{currentWorkspace?.title || 'Select Subject'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {workspaceDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setWorkspaceDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-20 w-64 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                  Switch Subject
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        switchWorkspace(ws.id);
                        setWorkspaceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl text-xs transition-colors ${
                        currentWorkspace?.id === ws.id
                          ? 'bg-violet-600/20 text-violet-300 font-medium border border-violet-500/30'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="truncate">{ws.title}</span>
                      {currentWorkspace?.id === ws.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="pt-1.5 mt-1 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      setWorkspaceDropdownOpen(false);
                      setShowNewWorkspaceModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Subject</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500 shadow-glow-violet" />
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-20 w-80 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-white">System Notifications</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">2 New</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <p className="font-medium text-slate-200">Knowledge Graph Updated</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Evidence extracted for 5 core concepts and 4 prerequisite edges.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <p className="font-medium text-slate-200">Spaced Repetition Review</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Queue concepts scheduled for revision to consolidate long-term recall.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>
      </div>

      {/* New Workspace Modal */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Create Subject Workspace</h3>
            <p className="text-xs text-slate-400 mb-4">Workspaces isolate your uploaded documents, knowledge graphs, and quiz assessments.</p>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Subject / Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems, Machine Learning"
                  value={newWsTitle}
                  onChange={(e) => setNewWsTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Notes, textbook chapters, or topics covered..."
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewWorkspaceModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWs || !newWsTitle.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-glow-violet transition-all disabled:opacity-50"
                >
                  {creatingWs ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

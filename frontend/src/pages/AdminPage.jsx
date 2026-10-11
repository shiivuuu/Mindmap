import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  FileText,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import { adminApi } from '../api/admin';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [ovData, uData, dData] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getUsers(),
        adminApi.getDocuments(),
      ]);
      setOverview(ovData);
      setUsers(uData || []);
      setDocuments(dData || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await adminApi.reindex();
      setMessage({ type: 'success', text: `Re-indexing completed. Reindexed ${res.reindexed_count} chunks.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Reindexing failed' });
    } finally {
      setReindexing(false);
    }
  };

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    try {
      await adminApi.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err.message || 'Failed to update role');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Root Administration Console</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">System Infrastructure & Auditing</h2>
        </div>

        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
          <span>{reindexing ? 'Re-indexing Vectors...' : 'Re-index All Vectors'}</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 border ${
          message.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton count={3} className="h-32" />
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="REGISTERED USERS"
              value={overview?.total_users || 0}
              icon={Users}
              color="violet"
            />
            <StatCard
              title="TOTAL WORKSPACES"
              value={overview?.total_workspaces || 0}
              icon={Layers}
              color="cyan"
            />
            <StatCard
              title="INDEXED CHUNKS"
              value={overview?.total_chunks || 0}
              icon={Database}
              color="emerald"
            />
            <StatCard
              title="GRAPH CONCEPTS"
              value={overview?.total_concepts || 0}
              subtitle={`${overview?.total_edges || 0} edges`}
              icon={Sparkles}
              color="amber"
            />
          </div>

          {/* Users Table */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-card space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Registered Platform Users ({users.length})
            </h3>

            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Workspaces</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="p-4 font-semibold text-white">{u.full_name}</td>
                      <td className="p-4 font-mono text-slate-400">{u.email}</td>
                      <td className="p-4">
                        <Badge variant={u.role === 'admin' ? 'violet' : 'cyan'}>{u.role}</Badge>
                      </td>
                      <td className="p-4">{u.workspaces_count}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleRoleToggle(u.id, u.role)}
                          className="text-violet-400 hover:text-violet-300 font-medium"
                        >
                          Switch to {u.role === 'admin' ? 'Student' : 'Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

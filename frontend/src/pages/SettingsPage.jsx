import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Palette,
  Cpu,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../api/auth';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const payload = { full_name: fullName };
      if (password) payload.password = password;
      await authApi.updateProfile(payload);
      setMessage({ type: 'success', text: 'Profile successfully updated.' });
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Platform & Account Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal profile, security credentials, and cognitive engine configurations.
        </p>
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

      {/* Profile Form */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-card space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800/80">
          <User className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Account Information
          </h3>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/30 border border-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">New Password (Optional)</label>
              <input
                type="password"
                placeholder="Leave blank to keep unchanged"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-glow-violet transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Profile Details'}
            </button>
          </div>
        </form>
      </div>

      {/* Theme Preferences */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800/80">
          <Palette className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Appearance & Interface Theme
          </h3>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-white">Visual Mode</p>
            <p className="text-[11px] text-slate-400">Current theme: <strong className="capitalize">{theme}</strong></p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>

      {/* AI Engine & Grounding Architecture */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800/80">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Cognitive & AI Architecture Status
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">RAG Retrieval Pipeline</span>
              <span className="text-[11px] text-slate-400">Vector search with graph neighbor expansion</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold text-[10px]">
              ACTIVE & GROUNDED
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Learner Mastery Algorithm</span>
              <span className="text-[11px] text-slate-400">Rolling Bayesian score + Spaced repetition intervals</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-semibold text-[10px]">
              OPERATIONAL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'violet' }) {
  const colorMap = {
    violet: {
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      icon: 'text-violet-400',
      glow: 'shadow-glow-violet',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      icon: 'text-cyan-400',
      glow: 'shadow-glow-cyan',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400',
      glow: '',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: 'text-amber-400',
      glow: '',
    },
  };

  const scheme = colorMap[color] || colorMap.violet;

  return (
    <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-card hover:border-slate-700/80 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 tracking-wide">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl ${scheme.bg} ${scheme.border} border`}>
            <Icon className={`w-4 h-4 ${scheme.icon}`} />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

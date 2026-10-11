import React from 'react';

export default function Badge({ variant = 'default', children, className = '' }) {
  const variantStyles = {
    // Mastery Statuses
    mastered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    learning: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    struggling: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    unstarted: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    
    // Difficulty
    beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    advanced: 'bg-purple-500/10 text-purple-400 border-purple-500/20',

    // Document Processing Status
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    processing: 'bg-violet-500/10 text-violet-400 border-violet-500/20 animate-pulse',
    queued: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',

    // Priorities
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',

    default: 'bg-slate-800 text-slate-300 border-slate-700',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };

  const style = variantStyles[variant.toLowerCase()] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border tracking-wide uppercase ${style} ${className}`}
    >
      {children}
    </span>
  );
}

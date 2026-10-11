import React from 'react';

export function LoadingSkeleton({ count = 3, className = 'h-24' }) {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-full rounded-2xl bg-slate-900/60 border border-slate-800/60 animate-pulse ${className}`}
        />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80">
      {Icon && (
        <div className="p-4 mb-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
      <p className="max-w-md mt-1 text-xs text-slate-400">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-glow-violet transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

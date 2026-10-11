import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sparkles, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';

function CustomConceptNode({ data, selected }) {
  const { name, category, difficulty, masteryScore = 0, status = 'unstarted' } = data;

  const masteryPct = Math.round(masteryScore * 100);

  // Status colors
  const statusStyles = {
    mastered: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400',
    learning: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-400',
    struggling: 'border-rose-500/50 bg-rose-950/20 text-rose-400',
    unstarted: 'border-slate-700 bg-slate-900/90 text-slate-400',
  };

  const currentStatusStyle = statusStyles[status] || statusStyles.unstarted;

  return (
    <div
      className={`relative px-4 py-3 min-w-[200px] max-w-[260px] rounded-2xl border backdrop-blur-md transition-all duration-200 cursor-pointer shadow-card
        ${currentStatusStyle}
        ${selected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-950 shadow-glow-violet scale-105' : 'hover:border-slate-500'}
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-violet-400 !border-2 !border-slate-950"
      />

      {/* Header with Category and Mastery % */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
          {category || 'Concept'}
        </span>
        <div className="flex items-center gap-1 text-[11px] font-bold">
          <span className={status === 'mastered' ? 'text-emerald-400' : (status === 'struggling' ? 'text-rose-400' : 'text-cyan-400')}>
            {masteryPct}%
          </span>
        </div>
      </div>

      {/* Concept Name */}
      <div className="text-sm font-bold text-white tracking-tight line-clamp-2">
        {name}
      </div>

      {/* Bottom info: Difficulty and Status pill */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
        <span className="text-slate-400 capitalize">{difficulty || 'medium'}</span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800/80 text-slate-300">
          {status}
        </span>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-slate-950"
      />
    </div>
  );
}

export default memo(CustomConceptNode);

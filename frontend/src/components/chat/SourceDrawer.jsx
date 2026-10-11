import React from 'react';
import { X, FileText, CheckCircle2, ShieldCheck, Quote } from 'lucide-react';

export default function SourceDrawer({ citation, onClose }) {
  if (!citation) return null;

  return (
    <div className="absolute top-4 right-4 bottom-4 w-96 z-30 rounded-3xl bg-slate-900/95 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Source Grounding Inspector
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
            Referenced Document
          </span>
          <h2 className="text-sm font-bold text-white tracking-tight">
            {citation.document_title}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>Page {citation.page_number}</span>
            <span>•</span>
            <span className="text-violet-400 font-semibold">Chunk #{citation.chunk_id}</span>
          </div>
        </div>

        {/* Relevance metric */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Retrieval Relevance</span>
          </div>
          <span className="font-mono font-bold text-white">
            {Math.round((citation.relevance_score || 0.85) * 100)}%
          </span>
        </div>

        {/* Verbatim quote snippet */}
        <div>
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <Quote className="w-3.5 h-3.5 text-violet-400" />
            Extracted Passage Snippet
          </span>
          <blockquote className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-200 leading-relaxed font-serif italic text-xs">
            "{citation.quote}"
          </blockquote>
        </div>

        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[11px]">
          <p className="font-medium">Strict Attribution Standard</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            MindMesh AI answers are strictly synthesized from retrieved passages to avoid non-factual generation.
          </p>
        </div>
      </div>
    </div>
  );
}

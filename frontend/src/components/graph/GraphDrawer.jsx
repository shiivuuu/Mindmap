import React from 'react';
import { X, ExternalLink, HelpCircle, ArrowRight, ShieldCheck, FileText, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';

export default function GraphDrawer({ selectedNode, selectedEdge, onClose }) {
  const navigate = useNavigate();

  if (!selectedNode && !selectedEdge) return null;

  return (
    <div className="absolute top-4 right-4 bottom-4 w-96 z-20 rounded-3xl bg-slate-900/95 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-glow-violet" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {selectedNode ? 'Concept Inspector' : 'Relationship Provenance'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
        {selectedNode && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={selectedNode.data.status}>{selectedNode.data.status}</Badge>
                <Badge variant={selectedNode.data.difficulty}>{selectedNode.data.difficulty}</Badge>
                <span className="text-[11px] text-slate-400">{selectedNode.data.category}</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">{selectedNode.data.name}</h2>
            </div>

            {/* Mastery Progress */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex justify-between items-center mb-1.5 font-medium">
                <span className="text-slate-400">Mastery Score</span>
                <span className="text-white font-bold">{Math.round(selectedNode.data.masteryScore * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${Math.round(selectedNode.data.masteryScore * 100)}%` }}
                />
              </div>
            </div>

            {/* Summary */}
            {selectedNode.data.summary && (
              <div>
                <span className="font-semibold text-slate-300 block mb-1">Concept Summary</span>
                <p className="text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
                  {selectedNode.data.summary}
                </p>
              </div>
            )}

            {/* Aliases */}
            {selectedNode.data.aliases && selectedNode.data.aliases.length > 0 && (
              <div>
                <span className="font-semibold text-slate-300 block mb-1">Recognized Aliases</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.data.aliases.map((alias, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => navigate('/quizzes')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-glow-violet transition-all"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Practice Concept Quiz</span>
              </button>

              <button
                onClick={() => navigate('/chat')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Ask AI in Research Chat</span>
              </button>
            </div>
          </>
        )}

        {selectedEdge && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="cyan">{selectedEdge.data.relation_type}</Badge>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Link
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {selectedEdge.data.source_name} <ArrowRight className="inline w-3.5 h-3.5 text-slate-500 mx-1" /> {selectedEdge.data.target_name}
              </h2>
            </div>

            {/* Rationale */}
            {selectedEdge.data.rationale && (
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-300 block mb-1">Relationship Rationale</span>
                <p className="text-slate-400 leading-relaxed">
                  {selectedEdge.data.rationale}
                </p>
              </div>
            )}

            {/* Evidence Quote */}
            {selectedEdge.data.evidence_quote && (
              <div>
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-violet-400" />
                  Source Passage Evidence
                </span>
                <blockquote className="p-3.5 rounded-2xl bg-violet-950/10 border border-violet-500/20 text-slate-300 italic leading-relaxed font-serif">
                  "{selectedEdge.data.evidence_quote}"
                </blockquote>
              </div>
            )}

            {/* Confidence metric */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-slate-400">
              <span>Extraction Confidence</span>
              <span className="text-white font-mono font-semibold">
                {Math.round((selectedEdge.data.confidence || 0.85) * 100)}%
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

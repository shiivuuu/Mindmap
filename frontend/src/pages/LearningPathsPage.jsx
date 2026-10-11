import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  Layers,
  ChevronRight
} from 'lucide-react';
import { recommendationsApi } from '../api/recommendations';
import { useWorkspace } from '../context/WorkspaceContext';
import Badge from '../components/ui/Badge';
import { LoadingSkeleton, EmptyState } from '../components/ui/LoadingSkeleton';

export default function LearningPathsPage() {
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'milestones'

  useEffect(() => {
    if (currentWorkspace) {
      loadLearningPath();
    }
  }, [currentWorkspace]);

  const loadLearningPath = async () => {
    setLoading(true);
    try {
      const data = await recommendationsApi.getLearningPath(currentWorkspace.id);
      setLearningPath(data);
    } catch (err) {
      console.error('Failed to load learning path:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Adaptive Learning Roadmaps</h2>
          <p className="text-xs text-slate-400 mt-1">
            Prerequisite-aware cognitive sequencing computed for <strong>{currentWorkspace?.title}</strong>.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'queue' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Priority Queue
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'milestones' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Curriculum Milestones
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} className="h-32" />
      ) : !learningPath || learningPath.priority_queue.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No Learning Path Available"
          description="Upload documents to extract concepts and take quizzes to populate your personalized path."
          actionText="Upload Documents"
          onAction={() => navigate('/documents')}
        />
      ) : (
        <>
          {/* Priority Queue View */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              {learningPath.priority_queue.map((item) => (
                <div
                  key={item.concept_id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-card hover:border-slate-700/80 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center text-sm font-bold font-mono text-violet-400 shrink-0">
                      #{item.priority_rank}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.mastery_status}>{item.mastery_status}</Badge>
                        <Badge variant={item.difficulty_level}>{item.difficulty_level}</Badge>
                        <span className="text-[11px] text-slate-400">{item.category}</span>
                        {!item.prerequisites_met && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            <Lock className="w-3 h-3" /> Prerequisites Required
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white tracking-tight">
                        {item.concept_name}
                      </h3>

                      {/* Explanation Rationale */}
                      <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
                        <strong className="text-violet-400">Why recommended:</strong> {item.rationale}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Est. {item.estimated_study_minutes} minutes
                        </span>
                        <span>•</span>
                        <span>Priority Score: <strong className="text-slate-200 font-mono">{item.priority_score}</strong></span>
                        <span>•</span>
                        <span>Current Mastery: <strong className="text-cyan-400 font-mono">{Math.round(item.mastery_score * 100)}%</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col items-center gap-2 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => navigate('/quizzes')}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-glow-violet transition-all"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Take Quiz</span>
                    </button>
                    <button
                      onClick={() => navigate('/chat')}
                      className="w-full md:w-auto px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      Ask AI
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Curriculum Milestones View */}
          {activeTab === 'milestones' && (
            <div className="space-y-6">
              {learningPath.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-card space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{milestone.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{milestone.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Milestone Progress</span>
                      <p className="text-lg font-bold text-white font-mono">{milestone.progress_pct}%</p>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400"
                      style={{ width: `${milestone.progress_pct}%` }}
                    />
                  </div>

                  {/* Milestone concepts pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {milestone.concepts.map((c) => (
                      <div
                        key={c.concept_id}
                        className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">{c.concept_name}</p>
                          <span className="text-[10px] text-slate-400 capitalize">{c.difficulty_level}</span>
                        </div>
                        <span className="font-mono font-bold text-cyan-400">
                          {Math.round(c.mastery_score * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  Network,
  Compass,
  GraduationCap,
  FileText,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { recommendationsApi } from '../api/recommendations';
import { documentsApi } from '../api/documents';
import { analyticsApi } from '../api/analytics';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import UploadDropzoneModal from '../components/documents/UploadDropzoneModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [learningPath, setLearningPath] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      loadDashboardData();
    }
  }, [currentWorkspace]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [lpData, docsData, anaData] = await Promise.all([
        recommendationsApi.getLearningPath(currentWorkspace.id).catch(() => null),
        documentsApi.list(currentWorkspace.id).catch(() => []),
        analyticsApi.getAnalytics(currentWorkspace.id).catch(() => null),
      ]);
      setLearningPath(lpData);
      setDocuments(docsData || []);
      setAnalytics(anaData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextRec = learningPath?.next_recommended;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-slate-900 border border-violet-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-violet-600/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 font-mono">
                Academic Knowledge Hub
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
              <span className="text-xs text-slate-400 font-medium">{currentWorkspace?.title}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Scholar'}!
            </h1>
            <p className="max-w-xl text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Your curriculum knowledge graph is actively synchronized with uploaded lecture materials. Review your adaptive recommendations below.
            </p>
          </div>

          {/* Quick Stat Gauge */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-medium block">Overall Mastery</span>
              <span className="text-2xl font-bold text-white font-mono">
                {learningPath?.overall_mastery_pct || 0}%
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-glow-violet">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="CONCEPTS MAPPED"
          value={learningPath?.total_concepts || 0}
          subtitle={`${learningPath?.mastered_concepts || 0} mastered`}
          icon={Network}
          color="violet"
        />
        <StatCard
          title="AVERAGE MASTERY"
          value={`${learningPath?.overall_mastery_pct || 0}%`}
          subtitle="Rolling cognitive score"
          icon={GraduationCap}
          color="cyan"
        />
        <StatCard
          title="QUIZ ASSESSMENTS"
          value={analytics?.total_quizzes_taken || 0}
          subtitle="Tracked attempts"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="COURSE DOCUMENTS"
          value={documents.length}
          subtitle={`${documents.filter(d => d.status === 'completed').length} completed`}
          icon={FileText}
          color="amber"
        />
      </div>

      {/* Continue Learning / Next Recommendation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Step Focus (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Adaptive Next Recommendation
                </h3>
              </div>
              {nextRec && (
                <Badge variant={nextRec.urgency_label.toLowerCase()}>{nextRec.urgency_label}</Badge>
              )}
            </div>

            {nextRec ? (
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                      {nextRec.category}
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                      {nextRec.concept_name}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Current Mastery</span>
                    <span className="text-lg font-bold text-cyan-400 font-mono">
                      {Math.round(nextRec.mastery_score * 100)}%
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/20 text-xs text-slate-200 leading-relaxed">
                  <strong className="text-violet-300 font-semibold block mb-0.5">Recommendation Rationale:</strong>
                  {nextRec.rationale}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Est. {nextRec.estimated_study_minutes} mins
                  </span>
                  <span>•</span>
                  <span>Difficulty: <strong className="text-slate-300 capitalize">{nextRec.difficulty_level}</strong></span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Upload course notes or complete a quiz to unlock tailored recommendations.
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/quizzes')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-glow-violet transition-all"
            >
              <span>Practice Concept Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/learning-paths')}
              className="px-4 py-2.5 rounded-xl font-medium text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              View Full Learning Path
            </button>
          </div>
        </div>

        {/* Quick Actions Card (1 Col) */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Quick Actions
            </h3>

            <div className="space-y-2.5 text-xs">
              <button
                onClick={() => setShowUploadModal(true)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 text-left text-slate-200 transition-colors group"
              >
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">Upload Documents</p>
                  <p className="text-[11px] text-slate-400">Add PDF, notes, or slides</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/chat')}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 text-left text-slate-200 transition-colors group"
              >
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">Ask Grounded AI</p>
                  <p className="text-[11px] text-slate-400">Research with citations</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/graph')}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 text-left text-slate-200 transition-colors group"
              >
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">Explore Concept Graph</p>
                  <p className="text-[11px] text-slate-400">Navigate concept nodes</p>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Subject Workspace</span>
            <span className="font-semibold text-slate-200 truncate max-w-[120px]">{currentWorkspace?.title}</span>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadDropzoneModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={loadDashboardData}
      />
    </div>
  );
}

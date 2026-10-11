import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';
import { analyticsApi } from '../api/analytics';
import { useWorkspace } from '../context/WorkspaceContext';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import { LoadingSkeleton, EmptyState } from '../components/ui/LoadingSkeleton';

export default function AnalyticsPage() {
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace) {
      loadAnalytics();
    }
  }, [currentWorkspace]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getAnalytics(currentWorkspace.id);
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Performance & Mastery Analytics</h2>
        <p className="text-xs text-slate-400 mt-1">
          Detailed cognitive retention and score metrics for <strong>{currentWorkspace?.title}</strong>.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} className="h-32" />
      ) : !data ? (
        <EmptyState
          icon={BarChart3}
          title="No Analytics Available"
          description="Complete quizzes and explore learning paths to see your progress charts."
        />
      ) : (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="TOTAL CONCEPTS"
              value={data.total_concepts}
              subtitle="Mapped in graph"
              icon={Layers}
              color="violet"
            />
            <StatCard
              title="AVERAGE MASTERY"
              value={`${data.average_mastery_pct}%`}
              subtitle="Subject competence"
              icon={GraduationCap}
              color="cyan"
            />
            <StatCard
              title="QUIZZES COMPLETED"
              value={data.total_quizzes_taken}
              subtitle="Assessment attempts"
              icon={TrendingUp}
              color="emerald"
            />
            <StatCard
              title="REVIEWS DUE"
              value={data.reviews_due_count}
              subtitle="Spaced repetition intervals"
              icon={Clock}
              color="amber"
            />
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Mastery Bar Chart */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Concept Mastery by Curriculum Domain
                </span>
                <span className="text-[11px] text-slate-500 font-mono">0% to 100%</span>
              </div>

              <div className="h-64 w-full">
                {data.category_breakdown?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.category_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis dataKey="category" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '1rem', fontSize: '12px' }}
                        itemStyle={{ color: '#8B5CF6' }}
                      />
                      <Bar dataKey="average_mastery" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    No category data recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Quiz Performance Trends */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Quiz Score Performance Over Time
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Recent Attempts</span>
              </div>

              <div className="h-64 w-full">
                {data.performance_trend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.performance_trend} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '1rem', fontSize: '12px' }}
                        itemStyle={{ color: '#06B6D4' }}
                      />
                      <Area type="monotone" dataKey="score_pct" stroke="#06B6D4" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    No quiz attempts taken yet. Take a quiz to populate trend data.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Knowledge Gaps & Spaced Repetition Due */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Identified Knowledge Gaps */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-card space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Detected Knowledge Gaps
                </h3>
              </div>

              {data.knowledge_gaps?.length > 0 ? (
                <div className="space-y-2.5">
                  {data.knowledge_gaps.map((gap) => (
                    <div
                      key={gap.concept_id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-white">{gap.concept_name}</p>
                        <span className="text-[10px] text-slate-400">{gap.category} • {gap.attempts} attempts</span>
                      </div>
                      <Badge variant="struggling">{gap.mastery_score}% Mastery</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs py-4 text-center">
                  No critical knowledge gaps detected! Keep practicing.
                </p>
              )}
            </div>

            {/* Spaced Repetition Reviews */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-card space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Scheduled Spaced Repetition Reviews
                </h3>
              </div>

              {data.reviews_due?.length > 0 ? (
                <div className="space-y-2.5">
                  {data.reviews_due.map((rev) => (
                    <div
                      key={rev.concept_id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-white">{rev.concept_name}</span>
                      <span className="text-amber-400 text-[11px] font-medium">Review Scheduled Now</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs py-4 text-center">
                  All concepts are currently up-to-date with spaced intervals.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

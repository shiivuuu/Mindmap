import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Clock,
  Play,
  Layers,
  Calendar
} from 'lucide-react';
import { quizzesApi } from '../api/quizzes';
import { useWorkspace } from '../context/WorkspaceContext';
import Badge from '../components/ui/Badge';
import { LoadingSkeleton, EmptyState } from '../components/ui/LoadingSkeleton';
import QuizTakingModal from '../components/quizzes/QuizTakingModal';

export default function QuizzesPage() {
  const { currentWorkspace } = useWorkspace();
  const [questions, setQuestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      loadQuizzesData();
    }
  }, [currentWorkspace]);

  const loadQuizzesData = async () => {
    setLoading(true);
    try {
      const [qData, hData] = await Promise.all([
        quizzesApi.getQuestions(currentWorkspace.id, null, 25).catch(() => []),
        quizzesApi.getHistory(currentWorkspace.id).catch(() => []),
      ]);
      setQuestions(qData || []);
      setHistory(hData || []);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!currentWorkspace) return;
    setGenerating(true);
    try {
      await quizzesApi.generateQuestions(currentWorkspace.id, null, 3);
      loadQuizzesData();
    } catch (err) {
      alert(err.message || 'Failed to generate questions. Ensure concepts exist.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Assessments & Mastery Quizzes</h2>
          <p className="text-xs text-slate-400 mt-1">
            Grounded practice questions for <strong>{currentWorkspace?.title}</strong> that update your mastery estimates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateQuestions}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs text-violet-300 bg-violet-950/40 border border-violet-500/30 hover:bg-violet-900/40 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>{generating ? 'Generating Questions...' : 'Generate AI Questions'}</span>
          </button>

          <button
            onClick={() => setQuizModalOpen(true)}
            disabled={questions.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-glow-violet transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>Take Adaptive Quiz</span>
          </button>
        </div>
      </div>

      {/* Available Questions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Available Assessment Questions ({questions.length})
          </span>
          <span className="text-xs text-slate-500">Curated from uploaded course material</span>
        </div>

        {loading ? (
          <LoadingSkeleton count={3} className="h-24" />
        ) : questions.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No Quiz Questions Available"
            description="Upload documents to extract concepts or click 'Generate AI Questions' above."
            actionText="Generate Questions"
            onAction={handleGenerateQuestions}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((q) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-card space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={q.difficulty}>{q.difficulty}</Badge>
                    <span className="text-xs font-semibold text-violet-400">{q.concept_name}</span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white leading-relaxed">
                  {q.prompt}
                </h3>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400 text-[11px]">
                  <span>{q.options?.length || 4} Multiple-choice options</span>
                  {q.rationale && (
                    <span className="text-slate-500 italic truncate max-w-[200px]">Includes evidence rationale</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Quiz Attempts History */}
      {history.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Recent Assessment Attempts History
          </span>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Completed Date</th>
                  <th className="p-4">Questions</th>
                  <th className="p-4">Correct</th>
                  <th className="p-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {history.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(att.completed_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-4">{att.total_questions} Questions</td>
                    <td className="p-4 text-emerald-400 font-semibold">{att.correct_answers} Correct</td>
                    <td className="p-4 text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 font-mono font-bold text-white border border-slate-800">
                        {att.score_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Quiz Taking Modal */}
      <QuizTakingModal
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        questions={questions}
        workspaceId={currentWorkspace?.id}
        onComplete={loadQuizzesData}
      />
    </div>
  );
}

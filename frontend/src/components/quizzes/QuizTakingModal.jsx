import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Trophy, Sparkles, HelpCircle } from 'lucide-react';
import { quizzesApi } from '../../api/quizzes';
import Badge from '../ui/Badge';

export default function QuizTakingModal({ isOpen, onClose, questions, workspaceId, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen || !questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const total = questions.length;

  const handleSelectOption = (optionIndex) => {
    if (result) return; // Locked once submitted
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: optionIndex,
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answersPayload = questions.map((q) => ({
        question_id: q.id,
        selected_index: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
      }));

      const res = await quizzesApi.submitAttempt(workspaceId, answersPayload);
      setResult(res);
      if (onComplete) onComplete(res);
    } catch (err) {
      alert(err.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSelectedAnswers({});
    setCurrentIndex(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] p-6 lg:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Concept Mastery Assessment</h3>
            <p className="text-xs text-slate-400">
              {result ? 'Assessment Results & Explanations' : `Question ${currentIndex + 1} of ${total}`}
            </p>
          </div>
          <button onClick={handleReset} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 text-xs">
          {!result ? (
            <>
              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
                />
              </div>

              {/* Question Header & Prompt */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={currentQ.difficulty}>{currentQ.difficulty}</Badge>
                  <span className="text-slate-400 font-medium">{currentQ.concept_name}</span>
                </div>
                <h2 className="text-base font-bold text-white leading-relaxed">
                  {currentQ.prompt}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options?.map((opt, idx) => {
                  const isSelected = selectedAnswers[currentQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all duration-200 border text-xs ${
                        isSelected
                          ? 'border-violet-500 bg-violet-600/20 text-white font-semibold shadow-glow-violet'
                          : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${
                          isSelected ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Quiz Results Summary */
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/40 to-slate-900 border border-violet-500/30 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-glow-violet">
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Score: {result.score_pct}%</h3>
                <p className="text-xs text-slate-300">
                  You answered {result.correct_answers} out of {result.total_questions} questions correctly.
                </p>
                <p className="text-[11px] text-violet-300">Concept mastery models have been dynamically updated.</p>
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Detailed Question Review & Rationales
                </span>
                {result.results?.map((res, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{res.concept_name}</span>
                      {res.is_correct ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>
                    {res.rationale && (
                      <p className="text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800 text-[11px] leading-relaxed">
                        <strong className="text-slate-200">Rationale:</strong> {res.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {!result ? (
            <>
              <button
                type="button"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>

              {currentIndex < total - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-glow-violet transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {submitting ? 'Grading Attempt...' : 'Submit & Update Mastery'}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Done & Return to Assessments
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

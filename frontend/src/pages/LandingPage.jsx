import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Network,
  BookOpen,
  Compass,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileText,
  Search,
  BrainCircuit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemoAccess = async (role = 'student') => {
    try {
      await loginDemo(role);
      navigate('/dashboard');
    } catch (err) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-violet-500 selection:text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B0F19]/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-glow-violet">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                MindMesh <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-mono">AI</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Intelligent Knowledge Graph</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">How it Works</a>
            <a href="#differentiator" className="hover:text-white transition-colors">Evidence Grounding</a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-glow-violet transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <button
                  onClick={() => handleDemoAccess('student')}
                  className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-semibold text-violet-300 bg-violet-950/40 border border-violet-500/30 hover:bg-violet-900/40 transition-colors"
                >
                  Instant Demo Login
                </button>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-glow-violet transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-violet-600/15 to-cyan-500/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-violet-400 font-medium mb-8 shadow-sm">
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
            <span>Beyond Simple Document Search & Chatbots</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Connect Your Learning with an <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Evidence-Backed Knowledge Graph
            </span>
          </h1>

          <p className="max-w-2xl mx-auto mt-6 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            MindMesh AI ingests your lecture notes, PDFs, and textbooks. It constructs an interactive concept graph, answers questions grounded strictly in citations, assesses your mastery, and adaptively recommends what to study next.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleDemoAccess('student')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-glow-violet transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Live Interactive Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/register"
              className="px-6 py-3.5 rounded-2xl font-semibold text-sm text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              Create Free Student Account
            </Link>
          </div>

          {/* Interactive Feature Preview Card */}
          <div className="mt-16 p-2 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 text-left grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2 text-violet-400 font-semibold text-xs mb-2">
                  <Network className="w-4 h-4" />
                  <span>Interactive Concept Graph</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Canonical concept nodes, alias resolution (BFS ↔ breadth-first search), and typed prerequisite relationships.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Grounded Citations</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Direct page and chunk provenance for all AI responses. Guaranteed no fabricated citations or hallucinated facts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-2">
                  <Compass className="w-4 h-4" />
                  <span>Adaptive Roadmaps</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Transparent mastery estimation and heuristic priority formulas recommending exact next steps based on knowledge gaps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Workflow Section */}
      <section id="workflow" className="py-20 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">The 4-Pillar Learning Engine</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Follow our evidence-backed cognitive pipeline designed to guide students from raw notes to deep mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
              <span className="text-xs font-mono font-bold text-violet-400 px-2 py-1 rounded bg-violet-500/10">01. LEARN</span>
              <h3 className="text-base font-bold text-white">Ingest Study Material</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload PDFs, lecture transcripts, and markdown notes. Heading-aware chunking indexes and preserves layout boundaries.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
              <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-1 rounded bg-cyan-500/10">02. CONNECT</span>
              <h3 className="text-base font-bold text-white">Construct Knowledge Graph</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Concepts are linked into an interactive graph with typed edges, alias normalization, and verified evidence snippets.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
              <span className="text-xs font-mono font-bold text-indigo-400 px-2 py-1 rounded bg-indigo-500/10">03. UNDERSTAND</span>
              <h3 className="text-base font-bold text-white">Ask Grounded Questions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                RAG retrieval answers questions backed by clickable source passages, with transparent notifications when evidence is insufficient.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
              <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-1 rounded bg-emerald-500/10">04. IMPROVE</span>
              <h3 className="text-base font-bold text-white">Assess & Personalize</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Complete targeted quizzes to calculate rolling mastery and receive prerequisite-aware recommendations on what to review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">MindMesh AI</span>
            <span>• An Intelligent Knowledge Graph & Personalized Learning System</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => handleDemoAccess('student')} className="hover:text-violet-400 transition-colors">
              Student Demo
            </button>
            <button onClick={() => handleDemoAccess('admin')} className="hover:text-violet-400 transition-colors">
              Admin Console Demo
            </button>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

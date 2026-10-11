import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Copy, Check, FileText, AlertCircle, Clock } from 'lucide-react';

export default function ChatMessageItem({ message, onSelectCitation }) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.sender === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-4 p-4 lg:p-6 rounded-3xl transition-colors ${
      isAssistant
        ? 'bg-slate-900/60 border border-slate-800/80'
        : 'bg-slate-950/40 border border-transparent'
    }`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
        isAssistant
          ? 'bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-glow-violet'
          : 'bg-slate-800 text-slate-300'
      }`}>
        {isAssistant ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {isAssistant ? 'MindMesh AI' : 'You'}
            </span>
            {isAssistant && message.latency_ms && (
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {message.latency_ms}ms
              </span>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Copy response"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Insufficient Evidence Warning Banner */}
        {message.insufficient_evidence && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold block">Evidence Limitation</span>
              <span>The current workspace documents lack verified evidence for this question. The response is restrained to prevent hallucination.</span>
            </div>
          </div>
        )}

        {/* Formatted Content */}
        <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed space-y-2">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Verifiable Source Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 block mb-2">
              Verified Source Citations ({message.citations.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectCitation && onSelectCitation(c)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-950/20 hover:bg-violet-900/30 border border-violet-500/30 text-violet-300 text-xs font-medium transition-all group"
                >
                  <FileText className="w-3.5 h-3.5 text-violet-400 group-hover:scale-110 transition-transform" />
                  <span className="truncate max-w-[160px]">{c.document_title}</span>
                  <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-[10px] text-violet-200 font-mono">
                    P.{c.page_number}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

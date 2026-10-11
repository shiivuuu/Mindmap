import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Sparkles,
  Search,
  Bot,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { chatApi } from '../api/chat';
import { useWorkspace } from '../context/WorkspaceContext';
import ChatMessageItem from '../components/chat/ChatMessageItem';
import SourceDrawer from '../components/chat/SourceDrawer';
import { EmptyState } from '../components/ui/LoadingSkeleton';

const SUGGESTED_QUESTIONS = [
  "How does Breadth-First Search work and what data structure does it require?",
  "What is the difference between FIFO Queue in BFS vs LIFO Stack in DFS?",
  "What is the time complexity of BFS on an unweighted adjacency list?",
  "How does graph traversal form a spanning tree?",
];

export default function ChatPage() {
  const { currentWorkspace } = useWorkspace();
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedCitation, setSelectedCitation] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentWorkspace) {
      loadSessions();
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentSessionId) {
      loadSessionDetails(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await chatApi.listSessions(currentWorkspace.id);
      setSessions(data || []);
      if (data && data.length > 0) {
        if (!currentSessionId || !data.some(s => s.id === currentSessionId)) {
          setCurrentSessionId(data[0].id);
        }
      } else {
        // Automatically create a new session
        handleNewSession();
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSessionDetails = async (sessionId) => {
    try {
      const data = await chatApi.getSession(sessionId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load session messages:', err);
    }
  };

  const handleNewSession = async () => {
    if (!currentWorkspace) return;
    try {
      const newSession = await chatApi.createSession(currentWorkspace.id, 'New Research Session');
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    try {
      await chatApi.deleteSession(sessionId);
      const remaining = sessions.filter(s => s.id !== sessionId);
      setSessions(remaining);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(remaining[0]?.id || null);
        setMessages([]);
      }
    } catch (err) {
      alert('Failed to delete session');
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputContent;
    if (!text.trim() || sending || !currentSessionId) return;

    const userMessageText = text.trim();
    setInputContent('');
    setSending(true);

    // Optimistic UI for user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: userMessageText,
      created_at: new Date().toISOString(),
      citations: [],
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const asstResponse = await chatApi.sendMessage(currentSessionId, userMessageText);
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, asstResponse]);
      // Update session title in list
      setSessions(prev =>
        prev.map(s => s.id === currentSessionId ? { ...s, title: userMessageText.slice(0, 35) } : s)
      );
    } catch (err) {
      alert(err.message || 'Error communicating with AI engine');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl overflow-hidden relative">
      {/* Left Column: Chat Sessions History */}
      <div className="w-72 border-r border-slate-800/80 bg-slate-950/40 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
            Sessions
          </span>
          <button
            onClick={handleNewSession}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 shadow-glow-violet transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              onClick={() => setCurrentSessionId(sess.id)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                currentSessionId === sess.id
                  ? 'bg-violet-600/20 text-white font-medium border border-violet-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="truncate flex-1 pr-2">
                <p className="truncate">{sess.title}</p>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {sess.message_count} messages
                </span>
              </div>
              <button
                onClick={(e) => handleDeleteSession(sess.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-all"
                title="Delete session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Chat Conversation Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0F19]/40 relative">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-glow-violet">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Source-Grounded AI Research Chat</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Ask any technical questions regarding <strong>{currentWorkspace?.title}</strong>. Responses will cite verified page and chunk passages from your uploaded documents.
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="w-full text-left space-y-2 pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block text-center">
                  Suggested Research Questions
                </span>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="w-full p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all text-left flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <Sparkles className="w-3.5 h-3.5 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <ChatMessageItem
                key={msg.id || index}
                message={msg}
                onSelectCitation={(cit) => setSelectedCitation(cit)}
              />
            ))
          )}

          {sending && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60 text-xs text-slate-400">
              <Bot className="w-5 h-5 text-violet-400 animate-spin" />
              <span>Searching workspace vectors & synthesizing grounded answer...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask an evidence-grounded question about this subject..."
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              disabled={sending}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputContent.trim() || sending}
              className="p-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-glow-violet disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Slide-out Source Inspector Drawer */}
      <SourceDrawer
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </div>
  );
}

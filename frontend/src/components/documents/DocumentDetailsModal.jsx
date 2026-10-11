import React, { useState, useEffect } from 'react';
import { X, FileText, Layers, RefreshCw, AlertCircle } from 'lucide-react';
import { documentsApi } from '../../api/documents';
import Badge from '../ui/Badge';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

export default function DocumentDetailsModal({ documentId, isOpen, onClose }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chunks');

  useEffect(() => {
    if (documentId && isOpen) {
      loadDetails();
    }
  }, [documentId, isOpen]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await documentsApi.getDetails(documentId);
      setDoc(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[85vh] p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{doc?.title || 'Document Inspector'}</h3>
              <p className="text-xs text-slate-400">{doc?.file_name} • {doc?.page_count} Pages • {doc?.chunk_count} Chunks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
          {loading ? (
            <LoadingSkeleton count={4} className="h-20" />
          ) : doc ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant={doc.status}>{doc.status}</Badge>
                <span className="text-slate-400 uppercase font-mono text-[10px]">{doc.file_type} format</span>
              </div>

              {doc.error_message && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{doc.error_message}</span>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Extracted Chunks & Evidence Boundaries ({doc.chunks?.length || 0})
                </span>

                {doc.chunks?.map((chunk) => (
                  <div key={chunk.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span className="text-violet-400 font-semibold">Chunk #{chunk.chunk_index}</span>
                      <span>Page {chunk.page_number}</span>
                    </div>
                    {chunk.section_title && (
                      <p className="text-xs font-semibold text-white">{chunk.section_title}</p>
                    )}
                    <p className="text-slate-300 leading-relaxed font-sans">{chunk.text}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Layers,
  FileCheck
} from 'lucide-react';
import { documentsApi } from '../api/documents';
import { useWorkspace } from '../context/WorkspaceContext';
import Badge from '../components/ui/Badge';
import { LoadingSkeleton, EmptyState } from '../components/ui/LoadingSkeleton';
import UploadDropzoneModal from '../components/documents/UploadDropzoneModal';
import DocumentDetailsModal from '../components/documents/DocumentDetailsModal';

export default function DocumentsPage() {
  const { currentWorkspace } = useWorkspace();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      loadDocuments();
    }
  }, [currentWorkspace]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentsApi.list(currentWorkspace.id);
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async (docId) => {
    try {
      await documentsApi.reprocess(docId);
      loadDocuments();
    } catch (err) {
      alert(err.message || 'Reprocessing failed');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document and its extracted chunks?')) return;
    try {
      await documentsApi.delete(docId);
      loadDocuments();
    } catch (err) {
      alert(err.message || 'Deletion failed');
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Course Document Library</h2>
          <p className="text-xs text-slate-400 mt-1">
            Study materials uploaded to <strong>{currentWorkspace?.title}</strong> for AI indexing and graph extraction.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-glow-violet transition-all"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents by title or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 text-xs">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Documents</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <LoadingSkeleton count={3} className="h-28" />
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Documents Found"
          description={searchQuery ? "No documents match your search criteria." : "Upload lecture notes, slides, or PDF textbooks to build your knowledge graph."}
          actionText={!searchQuery ? "Upload Study Notes" : null}
          onAction={() => setUploadModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-card hover:border-slate-700/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant={doc.status}>{doc.status}</Badge>
                  <span className="text-[11px] font-mono text-slate-400 uppercase">
                    {doc.file_type}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1 mb-1">
                  {doc.title}
                </h3>
                <p className="text-[11px] text-slate-400 truncate mb-4">
                  {doc.file_name}
                </p>

                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    {doc.chunk_count} Chunks
                  </span>
                  <span>•</span>
                  <span>{doc.page_count} Pages</span>
                  <span>•</span>
                  <span>{(doc.file_size_bytes / 1024).toFixed(0)} KB</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    setDetailsModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Chunks</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReprocess(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Reprocess file"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <UploadDropzoneModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={loadDocuments}
      />

      <DocumentDetailsModal
        documentId={selectedDocId}
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedDocId(null);
        }}
      />
    </div>
  );
}

import React, { useState } from 'react';
import { UploadCloud, File, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { documentsApi } from '../../api/documents';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function UploadDropzoneModal({ isOpen, onClose, onUploadSuccess }) {
  const { currentWorkspace } = useWorkspace();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !currentWorkspace) return;

    setUploading(true);
    setError('');

    try {
      await documentsApi.upload(currentWorkspace.id, file, title.trim());
      if (onUploadSuccess) onUploadSuccess();
      onClose();
      setFile(null);
      setTitle('');
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Upload Study Material</h3>
            <p className="text-xs text-slate-400">PDF, TXT, or Markdown (up to 25MB)</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl transition-all cursor-pointer ${
              dragOver
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-600'
            }`}
            onClick={() => document.getElementById('file-upload-input').click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="p-3 mb-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            {file ? (
              <div className="text-center">
                <p className="text-xs font-semibold text-white flex items-center gap-2 justify-center">
                  <File className="w-4 h-4 text-cyan-400" />
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs font-medium text-slate-300">
                  Drag and drop files here, or <span className="text-violet-400 underline">browse</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Lecture slides, textbooks, research papers</p>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Document Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Graph Algorithms Lecture Notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-glow-violet transition-all disabled:opacity-50"
            >
              {uploading ? 'Processing & Ingesting...' : 'Upload & Extract Graph'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

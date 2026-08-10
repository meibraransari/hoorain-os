'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';
import { api } from '@/lib/api';

interface DbRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DbRestoreModal({ isOpen, onClose }: DbRestoreModalProps) {
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleRestore = async () => {
    if (!file) {
      setError('Please select a valid PostgreSQL .sql dump file first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('financeos_access_token') : null;
      const response = await fetch('/api/v1/import/db-dump', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `Restore failed with HTTP ${response.status}`);
      }

      const resData = await response.json();
      setResult(resData);
    } catch (err: any) {
      setError(err.message || 'Database restore failed. Please check the backup file format.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card w-full max-w-lg bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Upload size={20} className="text-accent" />
            <h2 className="text-xl font-bold text-text-primary">Restore PostgreSQL Database</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Warning Banner */}
          <div className="flex gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block text-amber-500 mb-0.5">Important Safety Warning</span>
              Restoring a PostgreSQL database dump will update and restore existing tables, schema, and records with data from the backup dump file.
            </div>
          </div>

          <p className="text-sm text-text-secondary">
            Select a PostgreSQL database dump file (<code className="text-accent">.sql</code>) previously exported from Hoorain.
          </p>

          {error && (
            <div className="p-3 text-sm rounded-lg bg-expense/10 text-expense border border-expense/20 font-medium">
              {error}
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-income/10 border border-income/20 space-y-2 text-text-primary text-sm">
              <div className="flex items-center gap-2 font-bold text-income text-base">
                <CheckCircle2 size={20} />
                <span>Database Restored Successfully!</span>
              </div>
              <p className="text-xs text-text-secondary">{result.message}</p>
            </div>
          )}

          {!result && (
            <div className="border-2 border-dashed border-border hover:border-accent rounded-xl p-8 text-center transition-colors">
              <input
                type="file"
                accept=".sql"
                onChange={handleFileChange}
                className="hidden"
                id="postgres-db-file-input"
              />
              <label htmlFor="postgres-db-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                <FileCode size={40} className="text-accent" />
                <span className="font-semibold text-text-primary">
                  {file ? file.name : 'Click or drop .sql dump file here'}
                </span>
                <span className="text-xs text-text-muted">
                  PostgreSQL Dump (.sql) • {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Up to 50MB'}
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              {result ? 'Done' : 'Cancel'}
            </button>
            {!result && (
              <button
                type="button"
                onClick={handleRestore}
                disabled={loading || !file}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-accent text-white hover:bg-accent-light transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md"
              >
                <Upload size={16} />
                <span>{loading ? 'Restoring Database...' : 'Restore Database'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

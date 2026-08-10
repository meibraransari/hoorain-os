'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { useCashewImport } from '@/lib/hooks/useFinance';

interface CashewImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashewImportModal({ isOpen, onClose }: CashewImportModalProps) {
  const { uploadCashewFile } = useCashewImport();
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

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a Cashew SQL or ObjectBox export file first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await uploadCashewFile(file);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Import failed. Please make sure backend is running.');
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
            <h2 className="text-xl font-bold text-text-primary">Import Cashew SQL Backup</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <p className="text-sm text-text-secondary">
            Upload your Cashew App SQLite export file (e.g. <code className="text-accent">cashew-2026-08-07-15-25-31-228356.sql</code>) to migrate all your accounts, categories, transactions, and goals seamlessly into Hoorain.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm rounded-lg bg-expense/10 text-expense border border-expense/20">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-income/10 border border-income/20 space-y-2 text-text-primary text-sm">
              <div className="flex items-center gap-2 font-bold text-income text-base">
                <CheckCircle2 size={20} />
                <span>Import Completed Successfully!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div>Accounts Created: <strong>{result.report?.totals?.accountsImported ?? 0}</strong></div>
                <div>Categories Created: <strong>{result.report?.totals?.categoriesImported ?? 0}</strong></div>
                <div>Transactions Imported: <strong>{result.report?.totals?.transactionsImported ?? 0}</strong></div>
                <div>Goals Created: <strong>{result.report?.totals?.goalsImported ?? 0}</strong></div>
              </div>
            </div>
          )}

          {!result && (
            <div className="border-2 border-dashed border-border hover:border-accent rounded-xl p-8 text-center transition-colors">
              <input
                type="file"
                accept=".sql,.sqlite,.db,.json"
                onChange={handleFileChange}
                className="hidden"
                id="cashew-file-input"
              />
              <label htmlFor="cashew-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                <FileText size={40} className="text-text-muted" />
                <span className="font-semibold text-text-primary">
                  {file ? file.name : 'Click or drop Cashew SQL file here'}
                </span>
                <span className="text-xs text-text-muted">
                  Supports Cashew .sql / .sqlite exports ({file ? `${(file.size / 1024).toFixed(1)} KB` : 'Up to 50MB'})
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
                onClick={handleUpload}
                disabled={loading || !file}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-accent text-white hover:bg-accent-light transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Upload size={16} />
                <span>{loading ? 'Migrating Data...' : 'Import Data'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

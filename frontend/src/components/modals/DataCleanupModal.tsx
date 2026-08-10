'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { mutate } from 'swr';
import { AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';

interface DataCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataCleanupModal({ isOpen, onClose }: DataCleanupModalProps) {
  const [mounted, setMounted] = useState(false);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const generateMathChallenge = () => {
    const n1 = Math.floor(Math.random() * 20) + 3;
    const n2 = Math.floor(Math.random() * 20) + 3;
    setNum1(n1);
    setNum2(n2);
    setUserAnswer('');
    setError('');
  };

  useEffect(() => {
    if (isOpen) {
      generateMathChallenge();
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const expectedAnswer = num1 + num2;
  const isAnswerCorrect = parseInt(userAnswer.trim(), 10) === expectedAnswer;

  const handleCleanup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAnswerCorrect) return;

    setLoading(true);
    setError('');

    try {
      await api.post('/import/reset');
      setSuccess(true);
      await mutate(() => true); // Revalidate all active SWR caches
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to erase data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card max-w-md w-full p-6 bg-bg-card border border-danger/30 rounded-2xl shadow-2xl relative my-auto animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 text-danger mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-text-primary">Erase All Financial Data</h3>
            <p className="text-xs text-text-muted">Factory reset your account records</p>
          </div>
        </div>

        {success ? (
          <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-center space-y-2 my-4">
            <p className="font-semibold text-lg">Data Cleaned Up Successfully!</p>
            <p className="text-xs text-text-secondary">Your dashboard and transactions have been reset.</p>
          </div>
        ) : (
          <form onSubmit={handleCleanup} className="space-y-5">
            <p className="text-sm text-text-secondary leading-relaxed">
              This action will permanently delete all your <strong className="text-danger">Accounts, Transactions, Budgets, Categories, Goals, and Rules</strong>. This cannot be undone.
            </p>

            <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Math Verification Challenge</span>
                <button
                  type="button"
                  onClick={generateMathChallenge}
                  className="text-xs text-accent hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  New Question
                </button>
              </div>

              <div className="text-center py-2">
                <span className="text-xl font-mono font-bold text-text-primary">
                  What is <span className="text-accent">{num1}</span> + <span className="text-accent">{num2}</span> = ?
                </span>
              </div>

              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={`Type the answer (${expectedAnswer})`}
                className="w-full rounded-lg border border-border bg-bg-hover px-4 py-2.5 text-center font-mono font-semibold text-text-primary focus:border-danger focus:outline-none"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-danger/10 p-3 text-xs text-danger border border-danger/20">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isAnswerCorrect || loading}
                className="flex items-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-danger/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Confirm & Erase All Data</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

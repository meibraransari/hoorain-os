'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { mutate } from 'swr';
import { AlertTriangle, Trash2, X, RefreshCw, ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react';

interface DataCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataCleanupModal({ isOpen, onClose }: DataCleanupModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
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
      setStep(1);
      setConfirmCheckbox(false);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const expectedAnswer = num1 + num2;
  const isAnswerCorrect = parseInt(userAnswer.trim(), 10) === expectedAnswer;

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAnswerCorrect) return;
    setStep(2);
  };

  const handleFinalErase = async () => {
    if (!isAnswerCorrect || !confirmCheckbox) return;

    setLoading(true);
    setError('');

    try {
      await api.post('/import/reset');
      setSuccess(true);
      await mutate(() => true); // Revalidate all active SWR caches
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to erase data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card max-w-md w-full p-6 bg-bg-card border border-danger/40 rounded-2xl shadow-2xl relative my-auto animate-fade-in space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 text-danger">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger shrink-0">
            {step === 1 ? <AlertTriangle size={24} /> : <ShieldAlert size={26} className="animate-pulse" />}
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-text-primary">Erase All Financial Data</h3>
            <p className="text-xs text-text-muted">
              {step === 1 ? 'Step 1 of 2: Math Verification Challenge' : 'Step 2 of 2: Double Final Confirmation'}
            </p>
          </div>
        </div>

        {success ? (
          <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-center space-y-2 my-4">
            <p className="font-semibold text-lg">Data Cleaned Up Successfully!</p>
            <p className="text-xs text-text-secondary">Your dashboard and transactions have been reset.</p>
          </div>
        ) : step === 1 ? (
          /* Step 1: Math Verification Form */
          <form onSubmit={handleProceedToConfirm} className="space-y-4 pt-1">
            <p className="text-sm text-text-secondary leading-relaxed">
              This action will permanently delete all your <strong className="text-danger">Accounts, Transactions, Budgets, Categories, Goals, and Rules</strong>.
            </p>

            <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Verification Challenge</span>
                <button
                  type="button"
                  onClick={generateMathChallenge}
                  className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer"
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

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isAnswerCorrect}
                className="flex items-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-danger/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg cursor-pointer"
              >
                <span>Proceed to Confirmation</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Double Confirmation Extra Warning Screen */
          <div className="space-y-4 pt-1 animate-fade-in">
            <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 space-y-2">
              <span className="font-bold text-sm text-danger block uppercase tracking-wider">
                🛑 Are you 100% sure?
              </span>
              <p className="text-xs text-text-primary leading-relaxed">
                You passed the math challenge. Are you absolutely certain you want to erase all financial data? Once deleted, <strong className="text-danger">all records will be permanently gone and cannot be recovered</strong>.
              </p>
            </div>

            {/* Checkbox Confirmation */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-bg-secondary cursor-pointer hover:border-danger transition-colors">
              <input
                type="checkbox"
                checked={confirmCheckbox}
                onChange={(e) => setConfirmCheckbox(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-bg-card text-danger focus:ring-danger mt-0.5"
              />
              <span className="text-xs font-semibold text-text-primary select-none">
                I understand that ALL accounts, transactions, categories, and financial goals will be deleted forever.
              </span>
            </label>

            {error && (
              <div className="rounded-lg bg-danger/10 p-3 text-xs text-danger border border-danger/20">
                {error}
              </div>
            )}

            <div className="flex justify-between items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2.5 text-xs font-semibold text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleFinalErase}
                disabled={!confirmCheckbox || loading}
                className="flex items-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-danger/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>YES, PERMANENTLY ERASE EVERYTHING</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

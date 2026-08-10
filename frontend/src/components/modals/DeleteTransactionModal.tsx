'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { AlertTriangle, Trash2, X, ArrowRightLeft, Calendar, Tag, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  transaction: any;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteTransactionModal({
  isOpen,
  transaction,
  onClose,
  onConfirm,
}: DeleteTransactionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { formatPrivateCurrency } = usePrivacy();

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

  if (!isOpen || !transaction || !mounted) return null;

  const rawAmount = typeof transaction.amount === 'number' ? transaction.amount : parseFloat(transaction.amount) || 0;
  const isTransfer = transaction.isTransfer || transaction.type === 'transfer';
  const isIncome = !isTransfer && (transaction.type === 'income' || transaction.income === 1);

  const primaryTitle = transaction.title || transaction.notes || transaction.name || 'Transaction';
  const categoryName = typeof transaction.category === 'string'
    ? transaction.category
    : transaction.category?.name || (isTransfer ? 'Transfer' : 'General');
  const accountName = typeof transaction.account === 'string'
    ? transaction.account
    : transaction.account?.name || 'Account';

  let formattedDate = '';
  if (transaction.date) {
    try {
      const d = new Date(transaction.date);
      if (!isNaN(d.getTime())) {
        formattedDate = format(d, 'MMM dd, yyyy • HH:mm');
      }
    } catch (e) {
      formattedDate = '';
    }
  }

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Delete transaction failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card max-w-md w-full p-6 bg-bg-card border border-danger/40 rounded-2xl shadow-2xl relative my-auto animate-fade-in space-y-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 text-danger">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-text-primary">Delete Transaction</h3>
            <p className="text-xs text-text-muted">Confirm transaction removal</p>
          </div>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          Are you sure you want to permanently delete this transaction? This action will adjust the associated account balance.
        </p>

        {/* Transaction Summary Preview Card */}
        <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-text-primary truncate pr-2">{primaryTitle}</span>
            <span className={`font-mono font-bold text-sm shrink-0 ${
              isTransfer ? 'text-text-primary' : isIncome ? 'text-income' : 'text-expense'
            }`}>
              {isTransfer ? '' : isIncome ? '+' : '-'}{formatPrivateCurrency(Math.abs(rawAmount))}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-text-muted pt-1 border-t border-border/60">
            <div className="flex items-center gap-1.5 truncate">
              <Tag size={13} className="text-accent shrink-0" />
              <span className="truncate">{categoryName}</span>
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <CreditCard size={13} className="text-accent shrink-0" />
              <span className="truncate">{accountName}</span>
            </div>

            {formattedDate && (
              <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-text-muted pt-0.5">
                <Calendar size={12} className="text-accent shrink-0" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-danger px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-danger/90 disabled:opacity-50 shadow-lg cursor-pointer"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Trash2 size={15} />
                <span>Delete Transaction</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  category: any;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteCategoryModal({
  isOpen,
  category,
  onClose,
  onConfirm,
}: DeleteCategoryModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

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

  if (!isOpen || !category || !mounted) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Delete category failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="card max-w-md w-full p-6 bg-bg-card border border-danger/40 rounded-2xl shadow-2xl space-y-4 relative my-auto animate-fade-in">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 text-danger">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/15 text-danger shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-text-primary">Delete Category</h3>
            <p className="text-xs text-text-muted">Confirm category removal</p>
          </div>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          Are you sure you want to delete <strong className="text-text-primary">"{category.name}"</strong>? Transactions belonging to this category will not be deleted, but will become uncategorized.
        </p>

        <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Category Name:</span>
            <strong className="text-text-primary">{category.name}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Category Type:</span>
            <span className="uppercase font-bold text-accent">{category.type}</span>
          </div>
        </div>

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
                <span>Delete Category</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

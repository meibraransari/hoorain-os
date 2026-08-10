'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { useAccountTypes } from '@/lib/hooks/useFinance';

interface ManageAccountTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  typeToEdit?: any;
}

export function ManageAccountTypesModal({ isOpen, onClose, typeToEdit }: ManageAccountTypesModalProps) {
  const { createAccountType, updateAccountType } = useAccountTypes();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3f51b5');
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (typeToEdit) {
      setName(typeToEdit.name || '');
      setColor(typeToEdit.color || '#3f51b5');
    } else {
      setName('');
      setColor('#3f51b5');
    }
  }, [typeToEdit, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Account type name is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (typeToEdit) {
        await updateAccountType(typeToEdit.id, { name, color });
      } else {
        await createAccountType({ name, color });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save account type');
    } finally {
      setLoading(false);
    }
  };

  const colors = ['#3f51b5', '#4caf50', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4', '#607d8b', '#795548', '#00f2fe', '#f39c12'];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card w-full max-w-md bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-xl font-bold text-text-primary">
            {typeToEdit ? 'Edit Account Type' : 'Add New Account Type'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && <div className="p-3 text-sm rounded-lg bg-expense/10 text-expense border border-expense/20">{error}</div>}

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-1">Type Name</label>
            <input
              type="text"
              placeholder="e.g. Fixed Deposit, Mutual Funds, Digital Wallet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-hover px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-2">Theme Color</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={16} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-accent text-white hover:bg-accent-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : typeToEdit ? 'Update Type' : 'Create Type'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

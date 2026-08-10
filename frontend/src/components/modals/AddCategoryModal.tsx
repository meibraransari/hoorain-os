'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Tag, Plus, Check, Smile } from 'lucide-react';
import { useCategories } from '@/lib/hooks/useFinance';
import { renderCategoryIcon } from '@/lib/utils';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: any;
}

const PRESET_COLORS = [
  '#6c63ff', '#10d88a', '#ffb84d', '#ff4d6d', '#00f2fe',
  '#f39c12', '#9b59b6', '#34495e', '#1abc9c', '#e74c3c',
  '#2ecc71', '#3498db', '#e67e22', '#95a5a6', '#d35400',
  '#8e44ad', '#16a085', '#27ae60', '#2980b9', '#f1c40f'
];

export const EMOJI_LIBRARY = [
  {
    group: 'Food & Dining',
    emojis: ['🛒', '🥛', '🍿', '🍞', '🍽️', '🍔', '🍕', '☕', '🍰', '🍎', '🍺', '🍱', '🍜', '🍦', '🥩', '🍩', '🥑', '🥦', '🍾', '🍳']
  },
  {
    group: 'Shopping & Fashion',
    emojis: ['🛍️', '👔', '👗', '👟', '👜', '👓', '💎', '💄', '💍', '🎁', '📦', '👕', '👠', '🎩', '🎒']
  },
  {
    group: 'Home & Transport',
    emojis: ['🏠', '🚗', '⛽', '✈️', '🚆', '🚲', '🚕', '🛵', '🛏️', '🛋️', '🔑', '🧹', '🛠️', '🧰', '🚰', '⚡']
  },
  {
    group: 'Bills & Tech',
    emojis: ['💻', '📱', '⚡', '💡', '📶', '💳', '🏦', '📑', '💸', '🧾', '🔌', '📡', '🖥️', '📷', '🎮']
  },
  {
    group: 'Health & Personal',
    emojis: ['💊', '🏥', '🩺', '🧘', '💇', '🏋️', '🧴', '🩹', '🧼', '❤️', '🦷', '🧪', '🐾']
  },
  {
    group: 'Money & Income',
    emojis: ['💰', '💵', '📊', '📈', '🪙', '🏆', '💼', '🏢', '🧾', '🏧', '🧧', '🥇']
  },
  {
    group: 'Leisure & Life',
    emojis: ['🎈', '🎬', '📚', '🎨', '🎟️', '🎸', '⚽', '🎯', '🏖️', '🎳', '🎤', '🎪', '🎂', '🎉', '✈️']
  }
];

export function AddCategoryModal({ isOpen, onClose, categoryToEdit }: AddCategoryModalProps) {
  const { createCategory, updateCategory, categories } = useCategories();

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [color, setColor] = useState('#6c63ff');
  const [icon, setIcon] = useState('📦');
  const [parentId, setParentId] = useState<string>('');
  const [activeEmojiGroup, setActiveEmojiGroup] = useState<string>('Food & Dining');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || '');
      setType(categoryToEdit.type === 'income' ? 'income' : 'expense');
      setColor(categoryToEdit.color || '#6c63ff');
      setIcon(renderCategoryIcon(categoryToEdit.icon, categoryToEdit.name));
      setParentId(categoryToEdit.parentId || '');
    } else {
      setName('');
      setType('expense');
      setColor('#6c63ff');
      setIcon('📦');
      setParentId('');
    }
    setError(null);
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        type,
        color,
        icon,
        parentId: parentId || undefined,
      };

      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, payload);
      } else {
        await createCategory(payload);
      }

      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parentCategories = categories.filter((c: any) => c.id !== categoryToEdit?.id && (!c.parentId || c.parentId === null));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 space-y-6 shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-xl shadow-md font-bold shrink-0"
              style={{ backgroundColor: color }}
            >
              {renderCategoryIcon(icon, name)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                {categoryToEdit ? 'Edit Category' : 'Create Category'}
              </h2>
              <p className="text-xs text-text-muted">Choose from 100+ icons & emojis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Type Tabs */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">Category Type</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-bg-card border border-border rounded-xl">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  type === 'expense'
                    ? 'bg-expense text-white shadow'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Expense Category
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  type === 'income'
                    ? 'bg-income text-white shadow'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Income Category
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">Category Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries, Subscriptions, Salary..."
              className="w-full px-3.5 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
              required
            />
          </div>

          {/* Parent Category (Optional) */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">Parent Category (Optional)</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">None (Top-Level Category)</option>
              {parentCategories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Extensive Emoji & Icon Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <Smile size={14} className="text-accent" /> Select Icon / Emoji (100+ Available)
              </label>
              <span className="text-xs font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-md">
                Selected: {renderCategoryIcon(icon, name)}
              </span>
            </div>

            {/* Group Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-hide">
              {EMOJI_LIBRARY.map((grp) => (
                <button
                  key={grp.group}
                  type="button"
                  onClick={() => setActiveEmojiGroup(grp.group)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg shrink-0 transition-all ${
                    activeEmojiGroup === grp.group
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-bg-card text-text-muted border border-border hover:text-text-primary'
                  }`}
                >
                  {grp.group}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-8 gap-2 p-3 bg-bg-card border border-border rounded-xl max-h-36 overflow-y-auto">
              {EMOJI_LIBRARY.find((g) => g.group === activeEmojiGroup)?.emojis.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setIcon(em)}
                  className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center transition-all ${
                    icon === em
                      ? 'bg-accent text-white scale-110 shadow-lg ring-2 ring-accent'
                      : 'hover:bg-bg-hover hover:scale-105'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">Badge Color</label>
            <div className="flex items-center gap-2 flex-wrap max-h-24 overflow-y-auto p-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all flex items-center justify-center border border-white/20 hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={14} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-light text-white text-sm font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50"
            >
              <Plus size={16} />
              <span>{isSubmitting ? 'Saving...' : categoryToEdit ? 'Update Category' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

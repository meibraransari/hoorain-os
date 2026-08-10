'use client';

import { useState, useMemo } from 'react';
import { useCategories, useTransactions } from '@/lib/hooks/useFinance';
import { AddCategoryModal } from '@/components/modals/AddCategoryModal';
import { Tag, Plus, Search, Edit2, Trash2, Layers, TrendingDown, TrendingUp, Filter, AlertTriangle } from 'lucide-react';
import { formatCurrency, renderCategoryIcon } from '@/lib/utils';

export default function CategoriesPage() {
  const { categories, isLoading: categoriesLoading, deleteCategory } = useCategories();
  const { transactions } = useTransactions({ limit: 2000 });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute transaction counts and totals per category
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};

    transactions.forEach((tx: any) => {
      if (tx.isTransfer) return;
      const catId = typeof tx.category === 'object' && tx.category ? tx.category.id : tx.categoryId;
      const catName = typeof tx.category === 'object' && tx.category ? tx.category.name : tx.category;

      const key = catId || catName;
      if (!key) return;

      if (!stats[key]) {
        stats[key] = { count: 0, total: 0 };
      }
      stats[key].count += 1;
      stats[key].total += Math.abs(parseFloat(tx.amount) || 0);
    });

    return stats;
  }, [transactions]);

  // Filter categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c: any) => {
      const matchesType = selectedType === 'all' || c.type === selectedType;
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [categories, selectedType, searchQuery]);

  const expenseCategories = categories.filter((c: any) => c.type === 'expense');
  const incomeCategories = categories.filter((c: any) => c.type === 'income');

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary flex items-center gap-2">
            <Tag className="text-accent" /> Categories
          </h1>
          <p className="text-text-secondary mt-1">
            List, create, edit, and organize all transaction categories.
          </p>
        </div>
        <button
          onClick={() => {
            setCategoryToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-accent-light hover:scale-[1.02]"
        >
          <Plus size={18} />
          <span>Create Category</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card p-5 border border-border rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-text-muted">Total Categories</span>
            <div className="text-2xl font-bold text-text-primary mt-1">{categories.length}</div>
          </div>
          <div className="p-3 bg-accent/10 text-accent rounded-xl">
            <Layers size={22} />
          </div>
        </div>

        <div className="card p-5 border border-border rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-text-muted">Expense Categories</span>
            <div className="text-2xl font-bold text-expense mt-1">{expenseCategories.length}</div>
          </div>
          <div className="p-3 bg-expense/10 text-expense rounded-xl">
            <TrendingDown size={22} />
          </div>
        </div>

        <div className="card p-5 border border-border rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-text-muted">Income Categories</span>
            <div className="text-2xl font-bold text-income mt-1">{incomeCategories.length}</div>
          </div>
          <div className="p-3 bg-income/10 text-income rounded-xl">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between card p-4 border border-border rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2 bg-bg-card border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-text-muted" />
          <div className="flex items-center gap-1 bg-bg-card p-1 rounded-xl border border-border">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedType === 'all'
                  ? 'bg-accent text-white shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All ({categories.length})
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedType === 'expense'
                  ? 'bg-expense text-white shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Expense ({expenseCategories.length})
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedType === 'income'
                  ? 'bg-income text-white shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Income ({incomeCategories.length})
            </button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {categoriesLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl skeleton" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="card p-12 text-center text-text-muted border border-border rounded-xl space-y-3">
          <Tag size={36} className="mx-auto text-text-muted opacity-50" />
          <p className="text-base font-medium">No categories found.</p>
          <p className="text-xs text-text-muted">Click "Create Category" to add a new category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((cat: any) => {
            const stat = categoryStats[cat.id] || categoryStats[cat.name] || { count: 0, total: 0 };
            const subCats = categories.filter((c: any) => c.parentId === cat.id);

            return (
              <div
                key={cat.id}
                className="card p-5 border border-border rounded-xl space-y-4 hover:border-accent/50 transition-all hover:shadow-md group relative overflow-hidden"
              >
                {/* Header info & controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm font-bold shrink-0"
                      style={{ backgroundColor: cat.color || '#6c63ff' }}
                    >
                      {renderCategoryIcon(cat.icon, cat.name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-text-primary group-hover:text-accent transition-colors">
                        {cat.name}
                      </h3>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 border ${
                          cat.type === 'income'
                            ? 'bg-income/15 text-income border-income/20'
                            : 'bg-expense/15 text-expense border-expense/20'
                        }`}
                      >
                        {cat.type.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setCategoryToEdit(cat);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setCategoryToDelete(cat)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Subcategories Tags if any */}
                {subCats.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {subCats.map((sc: any) => (
                      <span
                        key={sc.id}
                        className="text-[11px] px-2 py-0.5 bg-bg-card border border-border rounded-md text-text-secondary"
                      >
                        {sc.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer Activity Info */}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-border/60 text-text-muted">
                  <span>{stat.count} transaction{stat.count === 1 ? '' : 's'}</span>
                  <span className="font-bold text-text-primary">
                    {stat.total > 0 ? formatCurrency(stat.total) : '₹0.00'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
      />

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="card w-full max-w-sm p-6 space-y-4 shadow-2xl border border-border text-center">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Delete Category?</h3>
            <p className="text-xs text-text-muted">
              Are you sure you want to delete <strong className="text-text-primary">"{categoryToDelete.name}"</strong>? Transactions using this category will remain, but will no longer belong to this category.
            </p>
            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-danger text-white text-xs font-semibold rounded-xl hover:bg-danger/90 transition-all shadow-md"
              >
                {isDeleting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

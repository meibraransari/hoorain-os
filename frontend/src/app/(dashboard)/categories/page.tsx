'use client';

import { useState, useMemo } from 'react';
import { useCategories, useTransactions } from '@/lib/hooks/useFinance';
import { AddCategoryModal } from '@/components/modals/AddCategoryModal';
import { DeleteCategoryModal } from '@/components/modals/DeleteCategoryModal';
import {
  Tag, Plus, Search, Edit2, Trash2, Layers, TrendingDown, TrendingUp,
  Filter, AlertTriangle, Sparkles, FolderTree, PieChart, ArrowUpRight,
  ShieldAlert, X, ChevronRight
} from 'lucide-react';
import { formatCurrency, renderCategoryIcon } from '@/lib/utils';

export default function CategoriesPage() {
  const { categories, isLoading: categoriesLoading, deleteCategory } = useCategories();
  const { transactions } = useTransactions({ limit: 2500 });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute transaction counts and totals per category
  const { categoryStats, grandExpenseTotal } = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    let expenseSum = 0;

    transactions.forEach((tx: any) => {
      if (tx.isTransfer) return;
      const catId = typeof tx.category === 'object' && tx.category ? tx.category.id : tx.categoryId;
      const catName = typeof tx.category === 'object' && tx.category ? tx.category.name : tx.category;

      const key = catId || catName;
      if (!key) return;

      const val = Math.abs(parseFloat(tx.amount) || 0);

      if (!stats[key]) {
        stats[key] = { count: 0, total: 0 };
      }
      stats[key].count += 1;
      stats[key].total += val;

      if (tx.type === 'expense' || tx.income === 0) {
        expenseSum += val;
      }
    });

    return { categoryStats: stats, grandExpenseTotal: expenseSum };
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
    <div className="space-y-6 pb-16">
      {/* Executive Glowing Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-bg-card via-bg-secondary to-bg-card p-6 shadow-xl before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-gradient-to-r before:from-accent before:via-accent-light before:to-transparent">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-accent/15 text-accent border border-accent/30 shadow-md">
                <Tag size={22} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-tight">
                Transaction Categories
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-text-muted">
              Organize, classify, and track category spending distribution across your financial accounts.
            </p>
          </div>

          <button
            onClick={() => {
              setCategoryToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent via-accent-light to-accent px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all hover:scale-[1.02] cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Create New Category</span>
          </button>
        </div>
      </div>

      {/* Executive Summary Analytics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Total Categories Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-bg-card/90 p-5 backdrop-blur-md shadow-xl transition-all hover:border-accent/40 before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-accent before:to-transparent">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted block">Total Categories</span>
              <div className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-tight">
                {categories.length}
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-text-muted font-medium pt-0.5">
                <FolderTree size={12} className="text-accent" />
                Active Classifications
              </span>
            </div>
            <div className="p-3.5 bg-accent/15 text-accent rounded-2xl border border-accent/25 shadow-md">
              <Layers size={24} />
            </div>
          </div>
        </div>

        {/* Expense Categories Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-bg-card/90 p-5 backdrop-blur-md shadow-xl transition-all hover:border-expense/40 before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-expense before:to-transparent">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted block">Expense Categories</span>
              <div className="text-2xl sm:text-3xl font-display font-bold text-expense tracking-tight">
                {expenseCategories.length}
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-text-muted font-medium pt-0.5">
                <TrendingDown size={12} className="text-expense" />
                Outflow Groups
              </span>
            </div>
            <div className="p-3.5 bg-expense/15 text-expense rounded-2xl border border-expense/25 shadow-md">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        {/* Income Categories Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-bg-card/90 p-5 backdrop-blur-md shadow-xl transition-all hover:border-income/40 before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-income before:to-transparent">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted block">Income Categories</span>
              <div className="text-2xl sm:text-3xl font-display font-bold text-income tracking-tight">
                {incomeCategories.length}
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-text-muted font-medium pt-0.5">
                <TrendingUp size={12} className="text-income" />
                Inflow Channels
              </span>
            </div>
            <div className="p-3.5 bg-income/15 text-income rounded-2xl border border-income/25 shadow-md">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between card p-4 border border-border/80 rounded-2xl bg-bg-card/90 backdrop-blur-md shadow-xl">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name..."
            className="w-full pl-9 pr-4 py-2.5 bg-bg-secondary border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-text-muted" />
          <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-xl border border-border">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All ({categories.length})
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedType === 'expense'
                  ? 'bg-expense text-white shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Expense ({expenseCategories.length})
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedType === 'income'
                  ? 'bg-income text-white shadow-md'
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl skeleton" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="card p-12 text-center text-text-muted border border-border/80 rounded-2xl bg-bg-card/90 backdrop-blur-md shadow-xl space-y-3">
          <Tag size={40} className="mx-auto text-text-muted opacity-40" />
          <p className="text-base font-bold text-text-primary">No categories matching your filter.</p>
          <p className="text-xs text-text-muted">Click "Create New Category" to establish a new transaction category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((cat: any) => {
            const stat = categoryStats[cat.id] || categoryStats[cat.name] || { count: 0, total: 0 };
            const subCats = categories.filter((c: any) => c.parentId === cat.id);
            const catColor = cat.color || '#6c63ff';

            // Calculate percentage share of grand expense total
            const percentShare = grandExpenseTotal > 0 && cat.type === 'expense'
              ? Math.min(100, Math.round((stat.total / grandExpenseTotal) * 100))
              : 0;

            return (
              <div
                key={cat.id}
                className="relative group overflow-hidden rounded-2xl border border-border/80 bg-bg-card/90 backdrop-blur-md p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-accent/40 flex flex-col justify-between space-y-4"
              >
                {/* Glowing top line matching category color */}
                <div
                  className="absolute top-0 left-0 w-full h-[3px] transition-all opacity-80 group-hover:opacity-100"
                  style={{ backgroundColor: catColor }}
                />

                {/* Header Info & Actions */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    {/* Category Icon Badge */}
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: catColor }}
                    >
                      {renderCategoryIcon(cat.icon, cat.name)}
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="font-bold text-base text-text-primary group-hover:text-accent transition-colors">
                        {cat.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border tracking-wider uppercase ${
                          cat.type === 'income'
                            ? 'bg-income/15 text-income border-income/30'
                            : 'bg-expense/15 text-expense border-expense/30'
                        }`}
                      >
                        {cat.type === 'income' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {cat.type}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setCategoryToEdit(cat);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 rounded-xl border border-border bg-bg-secondary/60 text-text-muted hover:text-accent hover:border-accent transition-colors shadow-sm cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setCategoryToDelete(cat)}
                      className="p-1.5 rounded-xl border border-border bg-bg-secondary/60 text-text-muted hover:text-danger hover:border-danger transition-colors shadow-sm cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Subcategories Pills */}
                {subCats.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted block">
                      Subcategories ({subCats.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {subCats.map((sc: any) => (
                        <span
                          key={sc.id}
                          className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-bg-secondary/80 border border-border/80 text-text-secondary flex items-center gap-1"
                        >
                          <ChevronRight size={10} className="text-accent" />
                          {sc.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Volume Progress Bar for Expense Categories */}
                {cat.type === 'expense' && percentShare > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-text-muted font-medium">Spending Share</span>
                      <span className="font-bold text-accent">{percentShare}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentShare}%`,
                          backgroundColor: catColor,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer Activity Info */}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-border/60 text-text-muted font-medium">
                  <span>{stat.count} transaction{stat.count === 1 ? '' : 's'}</span>
                  <span className={`font-mono font-bold text-sm ${
                    cat.type === 'income' ? 'text-income' : 'text-text-primary'
                  }`}>
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

      {/* Executive Delete Confirmation Modal */}
      <DeleteCategoryModal
        isOpen={!!categoryToDelete}
        category={categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

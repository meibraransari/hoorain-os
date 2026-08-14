'use client';

import { useState, useMemo } from 'react';
import { useCategories, useTransactions } from '@/lib/hooks/useFinance';
import { AddCategoryModal } from '@/components/modals/AddCategoryModal';
import { DeleteCategoryModal } from '@/components/modals/DeleteCategoryModal';
import Link from 'next/link';
import {
  Tag, Plus, Search, Edit2, Trash2, Layers, TrendingDown, TrendingUp,
  Filter, AlertTriangle, Sparkles, FolderTree, PieChart, ArrowUpRight,
  ShieldAlert, X, ChevronRight, BarChart3, RotateCw
} from 'lucide-react';
import { formatCurrency, renderCategoryIcon } from '@/lib/utils';
import { usePrivacy } from '@/components/providers/PrivacyProvider';


export default function CategoriesPage() {
  const { formatPrivateCurrency } = usePrivacy();
  const { categories, isLoading: categoriesLoading, deleteCategory } = useCategories();
  const { transactions } = useTransactions({ limit: 2500 });


  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
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

  // Derived state for the Sidebar
  const parentCategories = useMemo(() => {
    return categories.filter((c: any) => !c.parentId && c.type === selectedType);
  }, [categories, selectedType]);

  // Derived state for the Main Content Area
  const displayedCategories = useMemo(() => {
    let list = [];
    if (selectedParentId === null) {
      list = parentCategories;
    } else {
      list = categories.filter((c: any) => c.parentId === selectedParentId);
    }

    if (searchQuery) {
      list = list.filter((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return list;
  }, [categories, parentCategories, selectedParentId, searchQuery]);

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

      {/* Split-Pane Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start mt-6">
        {/* Left Sidebar */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          {/* Type Selector (Segmented Control) */}
          <div className="flex flex-col gap-1 p-3 bg-bg-secondary/40 border border-border/80 rounded-2xl shadow-sm">
            <button
              onClick={() => { setSelectedType('expense'); setSelectedParentId(null); }}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
                selectedType === 'expense' ? 'bg-bg-card border-expense/30 text-expense shadow-md' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Expense
            </button>
            <button
              onClick={() => { setSelectedType('income'); setSelectedParentId(null); }}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
                selectedType === 'income' ? 'bg-bg-card border-income/30 text-income shadow-md' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => { setSelectedType('transfer'); setSelectedParentId(null); }}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
                selectedType === 'transfer' ? 'bg-bg-card border-accent/30 text-accent shadow-md' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Primary Categories List */}
          <div className="card border border-border/80 rounded-2xl bg-bg-card/90 backdrop-blur-md shadow-xl overflow-hidden flex flex-col">
            <button
              onClick={() => setSelectedParentId(null)}
              className={`w-full text-left px-5 py-3.5 text-xs font-bold transition-colors ${
                selectedParentId === null ? 'text-accent' : 'text-accent/60 hover:text-accent'
              }`}
            >
              Primary Categories
            </button>
            <div className="flex flex-col max-h-[500px] overflow-y-auto">
              {parentCategories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedParentId(cat.id)}
                  className={`w-full text-left px-5 py-3 text-xs font-semibold transition-colors border-b border-border/30 last:border-0 ${
                    selectedParentId === cat.id ? 'text-text-primary bg-bg-secondary border-l-2 border-l-accent' : 'text-text-secondary hover:bg-bg-secondary/50 hover:text-text-primary'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              {parentCategories.length === 0 && (
                <div className="px-5 py-6 text-center text-xs text-text-muted">
                  No primary categories found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Main Panel */}
        <div className="flex-1 card border border-border/80 rounded-2xl bg-bg-card/90 backdrop-blur-md shadow-xl overflow-hidden w-full">
          {/* Header */}
          <div className="flex flex-wrap gap-4 items-center justify-between p-4 border-b border-border/60 bg-bg-secondary/20">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-display font-bold text-text-primary flex items-center gap-2">
                {selectedParentId === null ? 'Transaction Categories' : parentCategories.find((c: any) => c.id === selectedParentId)?.name || 'Categories'}
              </h2>
              {selectedParentId !== null && (
                <div className="flex items-center gap-1 ml-1 border-l border-border/60 pl-3">
                  <button
                    onClick={() => {
                      const parentCat = parentCategories.find((c: any) => c.id === selectedParentId);
                      if (parentCat) {
                        setCategoryToEdit(parentCat);
                        setIsAddModalOpen(true);
                      }
                    }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-bg-secondary transition-colors cursor-pointer"
                    title="Edit Primary Category"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      const parentCat = parentCategories.find((c: any) => c.id === selectedParentId);
                      if (parentCat) {
                        setCategoryToDelete(parentCat);
                      }
                    }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-bg-secondary transition-colors cursor-pointer"
                    title="Delete Primary Category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => {
                    setCategoryToEdit(null);
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-bg-secondary/50 border border-border px-3 py-1.5 text-xs font-bold text-text-primary hover:text-accent hover:border-accent transition-all cursor-pointer"
                >
                  <span>Add</span>
                </button>
                <button className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer">
                  <RotateCw size={14} />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-48 pl-8 pr-3 py-1.5 bg-bg-secondary border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* List Area */}
          <div className="w-full">
            <div className="flex items-center justify-between px-6 py-2.5 bg-bg-secondary/40 border-b border-border/50 text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
              <span>Category Name</span>
              <span>Operation</span>
            </div>

            {categoriesLoading ? (
               <div className="p-12 text-center text-text-muted text-xs">Loading categories...</div>
            ) : displayedCategories.length === 0 ? (
               <div className="p-16 text-center text-text-muted text-xs flex flex-col items-center gap-3">
                 <Tag size={32} className="opacity-40" />
                 <span>No categories found in this section.</span>
               </div>
            ) : (
               <div className="flex flex-col">
                 {displayedCategories.map((cat: any) => {
                   const catColor = cat.color || '#6c63ff';
                   return (
                     <div
                       key={cat.id}
                       className="group flex items-center justify-between px-6 py-3 border-b border-border/40 last:border-0 hover:bg-bg-secondary/30 transition-colors"
                     >
                       <div className="flex items-center gap-4">
                         <div
                           className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[15px] font-bold shadow-sm"
                           style={{ backgroundColor: catColor }}
                         >
                           {renderCategoryIcon(cat.icon, cat.name)}
                         </div>
                         <span className="text-sm font-semibold text-text-primary">
                           {cat.name}
                         </span>
                       </div>

                       <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                           onClick={() => {
                             setCategoryToEdit(cat);
                             setIsAddModalOpen(true);
                           }}
                           className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-accent transition-colors cursor-pointer"
                         >
                           <Edit2 size={13} />
                           Edit
                         </button>
                         <button
                           onClick={() => setCategoryToDelete(cat)}
                           className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-danger transition-colors cursor-pointer"
                         >
                           <Trash2 size={13} />
                           Delete
                         </button>
                       </div>
                     </div>
                   );
                 })}
               </div>
            )}
          </div>
        </div>
      </div>

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

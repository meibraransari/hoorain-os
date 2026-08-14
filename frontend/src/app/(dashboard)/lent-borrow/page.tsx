'use client';

import { useState, useMemo, Suspense } from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { useTransactions } from '@/lib/hooks/useFinance';

import { AddLentBorrowModal } from '@/components/modals/AddLentBorrowModal';
import { SettleLentBorrowModal } from '@/components/modals/SettleLentBorrowModal';
import { DeleteTransactionModal } from '@/components/modals/DeleteTransactionModal';
import { mutate } from 'swr';
import {
  HandCoins,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  UserCheck,
  Scale,
  FileText,
  RotateCcw,
} from 'lucide-react';

function LentBorrowContent() {
  const { formatPrivateCurrency } = usePrivacy();
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState<'all' | 'lent' | 'borrowed' | 'active' | 'settled'>('all');

  const [selectedPerson, setSelectedPerson] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<any>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [recordToSettle, setRecordToSettle] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<any>(null);

  // Fetch all transactions with a large limit so we process the full debt history
  const { transactions: allTransactions, isLoading, updateTransaction, deleteTransaction } = useTransactions({
    limit: 1000,
  });

  // Filter transactions that represent Lent or Borrowed entries
  const lentBorrowRecords = useMemo(() => {
    if (!allTransactions) return [];

    return allTransactions.filter((tx: any) => {
      const catName = (typeof tx.category === 'object' ? tx.category?.name : tx.category) || '';
      const title = tx.title || '';
      const notes = tx.notes || '';

      const isLentCategory = catName.toLowerCase().includes('lent') || catName.toLowerCase().includes('lending');
      const isBorrowCategory = catName.toLowerCase().includes('borrow') || catName.toLowerCase().includes('loan') || catName.toLowerCase().includes('debt');
      const hasLentTitle = title.toLowerCase().includes('lent') || notes.toLowerCase().includes('lent');
      const hasBorrowTitle = title.toLowerCase().includes('borrow') || notes.toLowerCase().includes('borrow');

      return isLentCategory || isBorrowCategory || hasLentTitle || hasBorrowTitle;
    }).map((tx: any) => {
      const catName = (typeof tx.category === 'object' ? tx.category?.name : tx.category) || '';
      const title = tx.title || '';
      const notes = tx.notes || '';

      const isLent = tx.type === 'expense' || catName.toLowerCase().includes('lent') || title.toLowerCase().includes('lent') || notes.toLowerCase().includes('lent');
      
      // Extract clean person name
      let person = title.replace(/^(Lent to|Borrowed from|Lent|Borrowed):\s*/i, '').trim();
      if (!person && notes) {
        person = notes.split('\n')[0].replace(/^(Lent to|Borrowed from|Lent|Borrowed):\s*/i, '').trim();
      }
      if (!person) person = catName || 'Contact';

      const isSettled = Boolean(tx.excludeFromBalance || notes.includes('[SETTLED]'));

      return {
        ...tx,
        isLent,
        personName: person,
        isSettled,
        rawAmount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0,
      };
    });
  }, [allTransactions]);

  // Extract unique contacts/people list for contact filter chips
  const personList = useMemo(() => {
    const set = new Set<string>();
    lentBorrowRecords.forEach((r: any) => {
      if (r.personName && r.personName !== 'Contact') set.add(r.personName);
    });
    return Array.from(set);
  }, [lentBorrowRecords]);

  // Calculate summary metrics
  const { totalLentActive, totalBorrowedActive, netBalance, settledCount } = useMemo(() => {
    let lentSum = 0;
    let borrowSum = 0;
    let settled = 0;

    lentBorrowRecords.forEach((r: any) => {
      if (r.isSettled) {
        settled++;
      } else {
        if (r.isLent) lentSum += r.rawAmount;
        else borrowSum += r.rawAmount;
      }
    });

    return {
      totalLentActive: lentSum,
      totalBorrowedActive: borrowSum,
      netBalance: lentSum - borrowSum,
      settledCount: settled,
    };
  }, [lentBorrowRecords]);

  // Apply search, tab, and person filters
  const filteredRecords = useMemo(() => {
    return lentBorrowRecords.filter((r: any) => {
      // Tab filter
      if (tabFilter === 'lent' && !r.isLent) return false;
      if (tabFilter === 'borrowed' && r.isLent) return false;
      if (tabFilter === 'active' && r.isSettled) return false;
      if (tabFilter === 'settled' && !r.isSettled) return false;

      // Person filter
      if (selectedPerson !== 'all' && r.personName.toLowerCase() !== selectedPerson.toLowerCase()) {
        return false;
      }

      // Search query filter
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        const matchesTitle = (r.title || '').toLowerCase().includes(q);
        const matchesNotes = (r.notes || '').toLowerCase().includes(q);
        const matchesPerson = (r.personName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes && !matchesPerson) return false;
      }

      return true;
    });
  }, [lentBorrowRecords, tabFilter, selectedPerson, search]);

  const handleToggleSettle = async (record: any) => {
    if (!record.isSettled) {
      setRecordToSettle(record);
      setIsSettleModalOpen(true);
    } else {
      // Re-open settled record
      let cleanNotes = (record.notes || '').replace(/\[SETTLED.*?\]\s*/gi, '').trim();
      await updateTransaction(record.id, {
        excludeFromBalance: false,
        notes: cleanNotes,
      });

      // Delete any settlement transactions linked to this debt
      const linkedSettlementTx = allTransactions?.find(
        (t: any) => t.notes && t.notes.includes(record.id)
      );
      if (linkedSettlementTx) {
        await deleteTransaction(linkedSettlementTx.id);
      }

      await mutate('/accounts');
    }
  };

  const handleEdit = (record: any) => {
    setRecordToEdit(record);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (record: any) => {
    setRecordToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (recordToDelete?.id) {
      await deleteTransaction(recordToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-text-primary">
              Lent & Borrowed
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent/20 text-accent border border-accent/40 shadow-xs">
              <HandCoins size={14} />
              <span>Debt Manager</span>
            </span>
          </div>
          <p className="text-text-secondary mt-1 font-medium">
            Track money lent out to contacts and money borrowed from people.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRecordToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/30 transition-all hover:bg-accent-light hover:scale-[1.02] cursor-pointer"
          >
            <Plus size={18} />
            <span>Add Lent / Borrow Record</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Lent */}
        <div className="p-4 border border-border rounded-2xl bg-bg-card shadow-md flex flex-col justify-between hover:border-expense/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Total Lent (Receivable)</span>
            <div className="p-2 rounded-xl bg-expense/15 text-expense border border-expense/30">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-expense tracking-tight mt-2">
            +{formatPrivateCurrency(totalLentActive)}
          </span>
        </div>

        {/* Total Borrowed */}
        <div className="p-4 border border-border rounded-2xl bg-bg-card shadow-md flex flex-col justify-between hover:border-income/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Total Borrowed (Payable)</span>
            <div className="p-2 rounded-xl bg-income/15 text-income border border-income/30">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-income tracking-tight mt-2">
            -{formatPrivateCurrency(totalBorrowedActive)}
          </span>
        </div>

        {/* Net Outstanding Balance */}
        <div className="p-4 border border-border rounded-2xl bg-bg-card shadow-md flex flex-col justify-between hover:border-accent/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Net Owed Balance</span>
            <div className="p-2 rounded-xl bg-accent/20 text-accent border border-accent/30">
              <Scale size={16} />
            </div>
          </div>
          <span
            className={`text-2xl font-extrabold tracking-tight mt-2 ${
              netBalance >= 0 ? 'text-expense' : 'text-income'
            }`}
          >
            {netBalance >= 0 ? '+' : ''}{formatPrivateCurrency(netBalance)}
          </span>

        </div>

        {/* Settled Count */}
        <div className="p-4 border border-border rounded-2xl bg-bg-card shadow-md flex flex-col justify-between hover:border-warning/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Settled Records</span>
            <div className="p-2 rounded-xl bg-warning/15 text-warning border border-warning/30">
              <UserCheck size={16} />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-warning tracking-tight mt-2">
            {settledCount} <span className="text-xs font-normal text-text-muted">Records</span>
          </span>
        </div>
      </div>

      {/* Primary Search & Filter Toolbar */}
      <div className="flex flex-col gap-4 p-5 border border-border rounded-2xl bg-bg-card shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by contact name, note, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-primary pl-10 pr-4 py-2.5 text-sm text-text-primary font-medium focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none transition-all"
            />
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-bg-primary rounded-2xl border border-border-subtle">
            {[
              { key: 'all', label: 'All' },
              { key: 'lent', label: 'Lent (Given)' },
              { key: 'borrowed', label: 'Borrowed (Taken)' },
              { key: 'active', label: 'Active Pending' },
              { key: 'settled', label: 'Settled' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTabFilter(t.key as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tabFilter === t.key
                    ? 'bg-accent text-white shadow-md shadow-accent/30 scale-105'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact / Person Chips Filter */}
        {personList.length > 0 && (
          <div className="border-t border-border-subtle pt-3 flex items-center gap-2 overflow-x-auto scrollbar-thin">
            <span className="text-xs font-bold uppercase text-text-muted shrink-0 mr-1">
              Filter Contact:
            </span>
            <button
              type="button"
              onClick={() => setSelectedPerson('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedPerson === 'all'
                  ? 'bg-bg-hover text-text-primary border border-accent'
                  : 'bg-bg-primary text-text-muted hover:text-text-primary border border-border-subtle'
              }`}
            >
              All Contacts
            </button>

            {personList.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPerson(p)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedPerson.toLowerCase() === p.toLowerCase()
                    ? 'bg-accent/20 text-accent border border-accent'
                    : 'bg-bg-primary text-text-muted hover:text-text-primary border border-border-subtle'
                }`}
              >
                👤 {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Records Table / List */}
      <div className="border border-border rounded-2xl overflow-hidden shadow-xl bg-bg-primary">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl skeleton bg-bg-secondary" />
            ))}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-14 text-center text-text-muted space-y-3">
            <HandCoins size={44} className="mx-auto text-text-muted" />
            <p className="text-lg font-bold text-text-primary">No debt records found</p>
            <p className="text-sm">Record a money lent or money borrowed transaction to get started.</p>
            <button
              type="button"
              onClick={() => {
                setRecordToEdit(null);
                setIsModalOpen(true);
              }}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-bold shadow-md hover:bg-accent-light transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Record First Entry</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col p-2 space-y-2">
            {filteredRecords.map((r: any) => {
              const accountName = typeof r.account === 'object' ? r.account?.name : r.account || 'Account';
              const formattedDate = r.date ? format(new Date(r.date), 'MMM d, yyyy') : '';

              return (
                <div
                  key={r.id}
                  className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    r.isSettled
                      ? 'bg-bg-primary/70 border-border-subtle opacity-75'
                      : 'bg-bg-card border-border hover:bg-bg-hover hover:border-accent/60 hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1 pr-3">
                    {/* Contact Avatar Circle */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-md mt-0.5 ${
                        r.isSettled
                          ? 'bg-warning/20 text-warning border border-warning/40'
                          : r.isLent
                          ? 'bg-expense/20 text-expense border border-expense/40'
                          : 'bg-income/20 text-income border border-income/40'
                      }`}
                    >
                      {r.personName.charAt(0).toUpperCase()}
                    </div>

                    {/* Details Hierarchy */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-text-primary text-[15px] tracking-tight truncate group-hover:text-accent-light transition-colors">
                          {r.personName}
                        </h4>

                        {/* Status Badge */}
                        {r.isSettled ? (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-warning/20 text-warning border border-warning/40 shrink-0">
                            <CheckCircle2 size={11} />
                            <span>Settled</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-accent/20 text-accent border border-accent/40 shrink-0">
                            <Clock size={11} />
                            <span>Active Pending</span>
                          </span>
                        )}
                      </div>

                      {/* Type & Account Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border shadow-xs ${
                            r.isLent
                              ? 'bg-expense/15 text-expense border-expense/30'
                              : 'bg-income/15 text-income border-income/30'
                          }`}
                        >
                          {r.isLent ? '↗ I Lent (Given)' : '↘ I Borrowed (Taken)'}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-bg-hover text-text-secondary text-[11px] font-semibold border border-border">
                          🏦 {accountName}
                        </span>

                        {formattedDate && (
                          <span className="text-[11px] text-text-muted font-medium ml-1">
                            • {formattedDate}
                          </span>
                        )}
                      </div>

                      {/* Notes memo */}
                      {r.notes && (
                        <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-primary border border-border text-xs text-text-secondary font-medium shadow-xs">
                          <FileText size={13} className="shrink-0 text-accent-light" />
                          <span className="truncate">{r.notes.replace(/\[SETTLED\]\s*/gi, '')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side Amount & Action Controls */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                      <span
                        className={`font-extrabold text-[17px] tracking-tight ${
                          r.isLent ? 'text-expense' : 'text-income'
                        }`}
                      >
                        {r.isLent ? '+' : '-'}{formatCurrency(r.rawAmount)}
                      </span>
                      <span className="text-[11px] text-text-muted font-medium mt-0.5">
                        {r.isSettled ? 'Fully Settled' : r.isLent ? 'To Receive' : 'To Pay'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSettle(r);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                          r.isSettled
                            ? 'bg-bg-primary border-border text-text-muted hover:text-text-primary'
                            : 'bg-warning/20 border-warning/40 text-warning hover:bg-warning/30'
                        }`}
                        title={r.isSettled ? 'Re-open Record' : 'Mark as Settled'}
                      >
                        {r.isSettled ? 'Re-open' : 'Mark Settled'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(r);
                        }}
                        className="p-2 rounded-xl bg-bg-hover border border-border text-text-muted hover:text-accent hover:border-accent transition-colors shadow-xs cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDelete(r);
                        }}
                        className="p-2 rounded-xl bg-bg-hover border border-border text-text-muted hover:text-expense hover:border-expense/50 transition-colors shadow-xs cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddLentBorrowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recordToEdit={recordToEdit}
      />

      <SettleLentBorrowModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        recordToSettle={recordToSettle}
      />

      <DeleteTransactionModal
        isOpen={isDeleteModalOpen}
        transaction={recordToDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default function LentBorrowPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading Lent & Borrow...</div>}>
      <LentBorrowContent />
    </Suspense>
  );
}

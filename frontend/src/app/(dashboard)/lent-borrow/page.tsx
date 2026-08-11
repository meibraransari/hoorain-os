'use client';

import { useState, useMemo, Suspense } from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
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
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-[#ffffff]">
              Lent & Borrowed
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#6c63ff]/20 text-[#6c63ff] border border-[#6c63ff]/40 shadow-xs">
              <HandCoins size={14} />
              <span>Debt Manager</span>
            </span>
          </div>
          <p className="text-[#a0a0cc] mt-1 font-medium">
            Track money lent out to contacts and money borrowed from people.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRecordToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#6c63ff] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6c63ff]/30 transition-all hover:bg-[#8b85ff] hover:scale-[1.02] cursor-pointer"
          >
            <Plus size={18} />
            <span>Add Lent / Borrow Record</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Lent */}
        <div className="p-4 border border-[#26263a] rounded-2xl bg-[#141420] shadow-md flex flex-col justify-between hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8888a8]">Total Lent (Receivable)</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-rose-400 tracking-tight mt-2">
            +{formatCurrency(totalLentActive)}
          </span>
        </div>

        {/* Total Borrowed */}
        <div className="p-4 border border-[#26263a] rounded-2xl bg-[#141420] shadow-md flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8888a8]">Total Borrowed (Payable)</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-emerald-400 tracking-tight mt-2">
            -{formatCurrency(totalBorrowedActive)}
          </span>
        </div>

        {/* Net Outstanding Balance */}
        <div className="p-4 border border-[#26263a] rounded-2xl bg-[#141420] shadow-md flex flex-col justify-between hover:border-[#6c63ff]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8888a8]">Net Owed Balance</span>
            <div className="p-2 rounded-xl bg-[#6c63ff]/20 text-[#6c63ff] border border-[#6c63ff]/30">
              <Scale size={16} />
            </div>
          </div>
          <span
            className={`text-2xl font-extrabold tracking-tight mt-2 ${
              netBalance >= 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
          </span>
        </div>

        {/* Settled Count */}
        <div className="p-4 border border-[#26263a] rounded-2xl bg-[#141420] shadow-md flex flex-col justify-between hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8888a8]">Settled Records</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <UserCheck size={16} />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-amber-300 tracking-tight mt-2">
            {settledCount} <span className="text-xs font-normal text-[#8888a8]">Records</span>
          </span>
        </div>
      </div>

      {/* Primary Search & Filter Toolbar */}
      <div className="flex flex-col gap-4 p-5 border border-[#26263a] rounded-2xl bg-[#141420] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8888a8]" />
            <input
              type="text"
              placeholder="Search by contact name, note, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#2b2b40] bg-[#10101a] pl-10 pr-4 py-2.5 text-sm text-[#ffffff] font-medium focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/30 focus:outline-none transition-all"
            />
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#10101a] rounded-2xl border border-[#242436]">
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
                    ? 'bg-[#6c63ff] text-white shadow-md shadow-[#6c63ff]/30 scale-105'
                    : 'text-[#8888a8] hover:text-[#ffffff] hover:bg-[#1a1a28]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact / Person Chips Filter */}
        {personList.length > 0 && (
          <div className="border-t border-[#242436] pt-3 flex items-center gap-2 overflow-x-auto scrollbar-thin">
            <span className="text-xs font-bold uppercase text-[#8888a8] shrink-0 mr-1">
              Filter Contact:
            </span>
            <button
              type="button"
              onClick={() => setSelectedPerson('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedPerson === 'all'
                  ? 'bg-[#1e1e2e] text-[#ffffff] border border-[#6c63ff]'
                  : 'bg-[#10101a] text-[#8888a8] hover:text-[#ffffff] border border-[#242436]'
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
                    ? 'bg-[#6c63ff]/20 text-[#6c63ff] border border-[#6c63ff]'
                    : 'bg-[#10101a] text-[#8888a8] hover:text-[#ffffff] border border-[#242436]'
                }`}
              >
                👤 {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Records Table / List */}
      <div className="border border-[#26263a] rounded-2xl overflow-hidden shadow-xl bg-[#12121c]">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl skeleton bg-[#181826]" />
            ))}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-14 text-center text-[#8888a8] space-y-3">
            <HandCoins size={44} className="mx-auto text-[#555577]" />
            <p className="text-lg font-bold text-[#ffffff]">No debt records found</p>
            <p className="text-sm">Record a money lent or money borrowed transaction to get started.</p>
            <button
              type="button"
              onClick={() => {
                setRecordToEdit(null);
                setIsModalOpen(true);
              }}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6c63ff] text-white text-xs font-bold shadow-md hover:bg-[#8b85ff] transition-all cursor-pointer"
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
                      ? 'bg-[#10101a]/70 border-[#242436] opacity-75'
                      : 'bg-[#141420] border-[#26263a] hover:bg-[#1a1a2b] hover:border-[#6c63ff]/60 hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1 pr-3">
                    {/* Contact Avatar Circle */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-md mt-0.5 ${
                        r.isSettled
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : r.isLent
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {r.personName.charAt(0).toUpperCase()}
                    </div>

                    {/* Details Hierarchy */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#ffffff] text-[15px] tracking-tight truncate group-hover:text-[#8b85ff] transition-colors">
                          {r.personName}
                        </h4>

                        {/* Status Badge */}
                        {r.isSettled ? (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                            <CheckCircle2 size={11} />
                            <span>Settled</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-[#6c63ff]/20 text-[#6c63ff] border border-[#6c63ff]/40 shrink-0">
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
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {r.isLent ? '↗ I Lent (Given)' : '↘ I Borrowed (Taken)'}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#1e1e2e] text-[#a0a0cc] text-[11px] font-semibold border border-[#2d2d44]">
                          🏦 {accountName}
                        </span>

                        {formattedDate && (
                          <span className="text-[11px] text-[#8888a8] font-medium ml-1">
                            • {formattedDate}
                          </span>
                        )}
                      </div>

                      {/* Notes memo */}
                      {r.notes && (
                        <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10101a] border border-[#2b2b40] text-xs text-[#c0c0e0] font-medium shadow-xs">
                          <FileText size={13} className="shrink-0 text-[#8b85ff]" />
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
                          r.isLent ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {r.isLent ? '+' : '-'}{formatCurrency(r.rawAmount)}
                      </span>
                      <span className="text-[11px] text-[#8888a8] font-medium mt-0.5">
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
                            ? 'bg-[#10101a] border-[#2b2b40] text-[#8888a8] hover:text-[#ffffff]'
                            : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
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
                        className="p-2 rounded-xl bg-[#1a1a28] border border-[#2b2b40] text-[#8888a8] hover:text-[#6c63ff] hover:border-[#6c63ff] transition-colors shadow-xs cursor-pointer"
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
                        className="p-2 rounded-xl bg-[#1a1a28] border border-[#2b2b40] text-[#8888a8] hover:text-rose-400 hover:border-rose-500/50 transition-colors shadow-xs cursor-pointer"
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
    <Suspense fallback={<div className="p-8 text-center text-[#8888a8]">Loading Lent & Borrow...</div>}>
      <LentBorrowContent />
    </Suspense>
  );
}

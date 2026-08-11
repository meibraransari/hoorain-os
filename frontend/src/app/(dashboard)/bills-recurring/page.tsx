'use client';

import { useState, useMemo } from 'react';
import {
  CalendarClock,
  Plus,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Search,
  Trash2,
  Edit2,
  ArrowUpRight,
  Sparkles,
  CreditCard,
  Building2,
  Tag,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { useRecurring } from '@/lib/hooks/useRecurring';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { formatCurrency, renderAccountIcon } from '@/lib/utils';
import { AddBillModal } from '@/components/modals/AddBillModal';
import { PayBillModal } from '@/components/modals/PayBillModal';
import { DateRangePicker } from '@/components/ui/DateRangePicker';

export default function BillsRecurringPage() {
  const { formatPrivateCurrency } = usePrivacy();
  const { recurringItems, isLoading, deleteRecurring } = useRecurring();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'upcoming' | 'subscriptions' | 'bills'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);

  const handleSelectRange = (s: string, e: string, preset: string) => {
    setStartDate(s);
    setEndDate(e);
    setDatePreset(preset);
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    let overdueSum = 0;
    let overdueCount = 0;
    let upcomingSum = 0;
    let upcomingCount = 0;
    let monthlyCommitment = 0;
    let activeSubscriptionsCount = 0;

    recurringItems.forEach((item: any) => {
      if (!item.isActive) return;
      const amt = item.rawAmount || Math.abs(parseFloat(item.amount || 0));

      if (item.isOverdue) {
        overdueSum += amt;
        overdueCount++;
      } else if (item.isUpcoming) {
        upcomingSum += amt;
        upcomingCount++;
      }

      activeSubscriptionsCount++;

      // Convert frequency to monthly commitment
      switch (item.frequency) {
        case 'daily':
          monthlyCommitment += amt * 30;
          break;
        case 'weekly':
          monthlyCommitment += amt * 4.33;
          break;
        case 'biweekly':
          monthlyCommitment += amt * 2.16;
          break;
        case 'monthly':
          monthlyCommitment += amt;
          break;
        case 'quarterly':
          monthlyCommitment += amt / 3;
          break;
        case 'yearly':
          monthlyCommitment += amt / 12;
          break;
        default:
          monthlyCommitment += amt;
      }
    });

    return {
      overdueSum,
      overdueCount,
      upcomingSum,
      upcomingCount,
      monthlyCommitment,
      activeSubscriptionsCount,
    };
  }, [recurringItems]);

  // Filtered List
  const filteredRules = useMemo(() => {
    return recurringItems.filter((item: any) => {
      const titleMatches = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const catMatches = (typeof item.category === 'object' ? item.category?.name : item.category || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const accMatches = (typeof item.account === 'object' ? item.account?.name : item.account || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const searchMatch = titleMatches || catMatches || accMatches;
      if (!searchMatch) return false;

      // Tab filter
      if (activeTab === 'overdue' && !item.isOverdue) return false;
      if (activeTab === 'upcoming' && !item.isUpcoming) return false;
      if (activeTab === 'subscriptions' && item.frequency !== 'monthly' && item.frequency !== 'yearly') return false;
      if (activeTab === 'bills' && item.type !== 'expense') return false;

      // Date Range Filter
      if (startDate || endDate) {
        const itemDate = item.nextDate ? new Date(item.nextDate).getTime() : 0;
        const sMs = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
        const eMs = endDate ? new Date(endDate + 'T23:59:59').getTime() : Date.now() * 2;
        if (itemDate < sMs || itemDate > eMs) return false;
      }

      return true;
    });
  }, [recurringItems, searchQuery, activeTab, startDate, endDate]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the bill rule for "${name}"?`)) {
      await deleteRecurring(id);
    }
  };

  const handleOpenEdit = (rule: any) => {
    setSelectedRule(rule);
    setIsAddModalOpen(true);
  };

  const handleOpenPay = (rule: any) => {
    setSelectedRule(rule);
    setIsPayModalOpen(true);
  };

  const handleOpenNew = () => {
    setSelectedRule(null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6c63ff]/15 text-[#6c63ff] border border-[#6c63ff]/30">
              <CalendarClock size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-extrabold text-[#ffffff] tracking-tight">
                Overdue & Upcoming Payments
              </h1>
              <p className="text-xs font-medium text-[#8888a8]">
                Manage recurring home rent, utility bills, subscriptions, and automatic commitments
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#6c63ff] text-white text-xs font-bold shadow-lg shadow-[#6c63ff]/30 hover:bg-[#8b85ff] hover:scale-[1.02] transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Bill or Subscription</span>
        </button>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Overdue Card */}
        <div className="card relative overflow-hidden p-5 border border-rose-500/30 rounded-2xl bg-[#141420]/90 backdrop-blur-md shadow-xl before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-rose-500 before:to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-rose-400" /> Overdue Alert
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[11px] font-bold border border-rose-500/30">
              {metrics.overdueCount} Pending
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-400">
            {formatPrivateCurrency(metrics.overdueSum)}
          </div>
          <div className="mt-1 text-xs text-[#8888a8] font-medium">
            Requires immediate payment attention
          </div>
        </div>

        {/* Upcoming Card */}
        <div className="card relative overflow-hidden p-5 border border-amber-500/30 rounded-2xl bg-[#141420]/90 backdrop-blur-md shadow-xl before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-amber-500 before:to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Calendar size={14} className="text-amber-400" /> Upcoming (Next 30 Days)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
              {metrics.upcomingCount} Due Soon
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-400">
            {formatPrivateCurrency(metrics.upcomingSum)}
          </div>
          <div className="mt-1 text-xs text-[#8888a8] font-medium">
            Upcoming due dates scheduled soon
          </div>
        </div>

        {/* Monthly Commitment */}
        <div className="card relative overflow-hidden p-5 border border-[#6c63ff]/30 rounded-2xl bg-[#141420]/90 backdrop-blur-md shadow-xl before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-[#6c63ff] before:to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a0a0cc] flex items-center gap-1.5">
              <RefreshCw size={14} className="text-[#6c63ff]" /> Monthly Commitment
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#ffffff]">
            {formatPrivateCurrency(metrics.monthlyCommitment)}
          </div>
          <div className="mt-1 text-xs text-[#8888a8] font-medium">
            Total recurring commitment per month
          </div>
        </div>

        {/* Active Rules */}
        <div className="card relative overflow-hidden p-5 border border-[#2b2b40] rounded-2xl bg-[#141420]/90 backdrop-blur-md shadow-xl before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-teal-500 before:to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a0a0cc] flex items-center gap-1.5">
              <Sparkles size={14} className="text-teal-400" /> Active Subscriptions
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#ffffff]">
            {metrics.activeSubscriptionsCount} Rules
          </div>
          <div className="mt-1 text-xs text-[#8888a8] font-medium">
            Configured recurring rules active
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 border border-[#2b2b40] rounded-2xl bg-[#141420] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#10101a] p-1.5 rounded-xl border border-[#2b2b40]">
            {[
              { id: 'all', label: 'All Payments' },
              { id: 'overdue', label: '⚠️ Overdue' },
              { id: 'upcoming', label: '📅 Upcoming' },
              { id: 'subscriptions', label: '🔄 Subscriptions' },
              { id: 'bills', label: '🏠 Bills & Rent' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#6c63ff] text-white shadow-md shadow-[#6c63ff]/20'
                    : 'text-[#8888a8] hover:text-[#ffffff] hover:bg-[#1a1a28]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Controls: Search & Date Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888a8]" />
              <input
                type="text"
                placeholder="Search bills, rent, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#2b2b40] bg-[#10101a] pl-9 pr-4 py-2 text-xs text-[#ffffff] placeholder-[#666688] focus:border-[#6c63ff] focus:outline-none font-medium"
              />
            </div>

            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              datePreset={datePreset}
              onSelectRange={handleSelectRange}
            />
          </div>
        </div>
      </div>

      {/* Main Recurring List */}
      <div className="card p-6 border border-[#2b2b40] rounded-2xl bg-[#141420] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-[#ffffff] flex items-center gap-2">
            <span>Configured Bills & Subscriptions</span>
            <span className="text-xs font-bold text-[#6c63ff] bg-[#6c63ff]/15 px-2.5 py-0.5 rounded-full border border-[#6c63ff]/30">
              {filteredRules.length} Entries
            </span>
          </h3>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl skeleton" />
            ))}
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="p-12 text-center text-[#8888a8] text-sm space-y-3">
            <CalendarClock size={36} className="mx-auto text-[#6c63ff]/40" />
            <p className="font-semibold">No bills or subscriptions found matching filter criteria.</p>
            <button
              onClick={handleOpenNew}
              className="px-4 py-2 rounded-xl bg-[#6c63ff]/20 text-[#6c63ff] text-xs font-bold border border-[#6c63ff]/40 hover:bg-[#6c63ff] hover:text-white transition-all cursor-pointer inline-block"
            >
              + Create First Recurring Payment Rule
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredRules.map((rule: any) => {
              const accName = typeof rule.account === 'object' ? rule.account?.name : rule.account || 'Account';
              const accType = typeof rule.account === 'object' ? rule.account?.type : 'checking';
              const catName = typeof rule.category === 'object' ? rule.category?.name : rule.category || 'General';
              const nextDateFormatted = rule.nextDate
                ? new Date(rule.nextDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Not Set';

              return (
                <div
                  key={rule.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 gap-4 ${
                    rule.isOverdue
                      ? 'border-rose-500/40 bg-rose-500/5 hover:border-rose-500/70'
                      : rule.isUpcoming
                      ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
                      : 'border-[#26263a] bg-[#10101a] hover:border-[#6c63ff]/40'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#181826] border border-[#2b2b40] text-[#6c63ff]">
                      {renderAccountIcon(accName, accType)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-[#ffffff]">
                          {rule.title}
                        </span>

                        {/* Status Badges */}
                        {rule.isOverdue ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[11px] font-extrabold border border-rose-500/40 flex items-center gap-1">
                            <AlertTriangle size={11} /> Overdue ({Math.abs(rule.dueDays)} days)
                          </span>
                        ) : rule.isUpcoming ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-extrabold border border-amber-500/40 flex items-center gap-1">
                            <Calendar size={11} /> Due in {rule.dueDays} days
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 text-[11px] font-bold border border-teal-500/30">
                            Active 🔄
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#8888a8] flex-wrap font-medium">
                        <span className="flex items-center gap-1 text-[#ffffff]">
                          💳 {accName}
                        </span>
                        <span>•</span>
                        <span>🏷️ {catName}</span>
                        <span>•</span>
                        <span className="capitalize font-bold text-[#6c63ff]">
                          🔄 {rule.frequency}
                        </span>
                        <span>•</span>
                        <span>📅 Next Due: {nextDateFormatted}</span>
                      </div>

                      {rule.notes && (
                        <p className="text-xs text-[#8888a8] italic pt-0.5 font-medium">
                          "{rule.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-[#ffffff]">
                        {formatPrivateCurrency(rule.rawAmount || Math.abs(parseFloat(rule.amount || 0)))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenPay(rule)}
                        className="px-3.5 py-2 rounded-xl bg-[#10d88a] text-black text-xs font-bold shadow-md shadow-[#10d88a]/20 hover:bg-[#34d399] transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        <span>Pay Now</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(rule)}
                        className="p-2 rounded-xl border border-[#2b2b40] bg-[#1a1a28] text-[#8888a8] hover:text-[#ffffff] hover:bg-[#222234] transition-colors cursor-pointer"
                        title="Edit Rule"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        onClick={() => handleDelete(rule.id, rule.title)}
                        className="p-2 rounded-xl border border-[#2b2b40] bg-[#1a1a28] text-[#8888a8] hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddBillModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedRule(null);
        }}
        ruleToEdit={selectedRule}
      />

      <PayBillModal
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setSelectedRule(null);
        }}
        ruleToPay={selectedRule}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRecurring } from '@/lib/hooks/useRecurring';
import { usePrivacy } from '@/components/providers/PrivacyProvider';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { CalendarClock, AlertTriangle, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { PayBillModal } from '@/components/modals/PayBillModal';
import Link from 'next/link';

export function RecurringBillsWidget() {
  const { formatPrivateCurrency } = usePrivacy();
  const { recurringItems, isLoading } = useRecurring();
  const [selectedRuleToPay, setSelectedRuleToPay] = useState<any>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const activeBills = (recurringItems || []).filter((item: any) => item.isActive);
  const overdueCount = activeBills.filter((item: any) => item.isOverdue).length;

  const handlePay = (rule: any) => {
    setSelectedRuleToPay(rule);
    setIsPayModalOpen(true);
  };

  return (
    <>
      <CollapsibleCard
        title="Overdue & Upcoming Bills"
        action={
          <Link
            href="/bills-recurring"
            className="text-xs font-semibold text-[#6c63ff] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </Link>
        }
      >
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl skeleton" />
            ))}
          </div>
        ) : activeBills.length === 0 ? (
          <div className="p-6 text-center text-[#8888a8] text-sm space-y-2">
            <CalendarClock size={28} className="mx-auto text-[#6c63ff]/40" />
            <p>No active recurring bills or subscriptions scheduled.</p>
            <Link
              href="/bills-recurring"
              className="text-xs font-bold text-[#6c63ff] hover:underline inline-block"
            >
              + Add Bill or Subscription Rule
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {activeBills.slice(0, 4).map((rule: any) => {
              const amountVal = rule.rawAmount || Math.abs(parseFloat(rule.amount || 0));
              const nextDateStr = rule.nextDate
                ? new Date(rule.nextDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Not Set';

              return (
                <div
                  key={rule.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    rule.isOverdue
                      ? 'border-rose-500/40 bg-rose-500/5'
                      : rule.isUpcoming
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-[#26263a] bg-[#10101a]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#ffffff]">{rule.title}</span>
                      {rule.isOverdue ? (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-extrabold border border-rose-500/30">
                          Overdue ({Math.abs(rule.dueDays)}d)
                        </span>
                      ) : rule.isUpcoming ? (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
                          Due in {rule.dueDays}d
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-[#8888a8] font-medium">
                      📅 {nextDateStr} • <span className="capitalize">{rule.frequency}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-[#ffffff]">
                      {formatPrivateCurrency(amountVal)}
                    </span>
                    <button
                      onClick={() => handlePay(rule)}
                      className="px-2.5 py-1 rounded-lg bg-[#10d88a] text-black text-xs font-bold shadow hover:bg-[#34d399] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} />
                      <span>Pay</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleCard>

      <PayBillModal
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setSelectedRuleToPay(null);
        }}
        ruleToPay={selectedRuleToPay}
      />
    </>
  );
}

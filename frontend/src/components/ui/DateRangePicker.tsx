'use client';

import React, { useState, useMemo, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  isAfter,
  isBefore,
  parseISO,
  subWeeks,
  startOfYear,
  endOfYear,
  isValid,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Check,
  Sparkles,
} from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  datePreset: string;
  onSelectRange: (start: string, end: string, presetKey: string) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  datePreset,
  onSelectRange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (startDate) {
      const d = parseISO(startDate);
      if (isValid(d)) return d;
    }
    return new Date();
  });

  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selectingStart, setSelectingStart] = useState<boolean>(true);
  const [tempStart, setTempStart] = useState<string>(startDate);
  const [tempEnd, setTempEnd] = useState<string>(endDate);
  const [tempPreset, setTempPreset] = useState<string>(datePreset);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setTempPreset(datePreset);
    if (startDate) {
      const d = parseISO(startDate);
      if (isValid(d)) setCurrentMonth(d);
    }
  }, [startDate, endDate, datePreset, isOpen]);

  const parsedStart = useMemo(() => {
    if (!tempStart) return null;
    const d = parseISO(tempStart);
    return isValid(d) ? d : null;
  }, [tempStart]);

  const parsedEnd = useMemo(() => {
    if (!tempEnd) return null;
    const d = parseISO(tempEnd);
    return isValid(d) ? d : null;
  }, [tempEnd]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDateGrid = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDateGrid = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDateGrid, end: endDateGrid });
  }, [currentMonth]);

  const handlePresetClick = (presetKey: string) => {
    setTempPreset(presetKey);
    const now = new Date();

    if (presetKey === 'all') {
      setTempStart('');
      setTempEnd('');
      onSelectRange('', '', 'all');
      setIsOpen(false);
    } else if (presetKey === 'this_week') {
      const s = startOfWeek(now, { weekStartsOn: 1 });
      const e = endOfWeek(now, { weekStartsOn: 1 });
      const sStr = format(s, 'yyyy-MM-dd');
      const eStr = format(e, 'yyyy-MM-dd');
      setTempStart(sStr);
      setTempEnd(eStr);
      onSelectRange(sStr, eStr, 'this_week');
      setIsOpen(false);
    } else if (presetKey === 'last_week') {
      const lastWeekDate = subWeeks(now, 1);
      const s = startOfWeek(lastWeekDate, { weekStartsOn: 1 });
      const e = endOfWeek(lastWeekDate, { weekStartsOn: 1 });
      const sStr = format(s, 'yyyy-MM-dd');
      const eStr = format(e, 'yyyy-MM-dd');
      setTempStart(sStr);
      setTempEnd(eStr);
      onSelectRange(sStr, eStr, 'last_week');
      setIsOpen(false);
    } else if (presetKey === 'this_month') {
      const s = startOfMonth(now);
      const e = endOfMonth(now);
      const sStr = format(s, 'yyyy-MM-dd');
      const eStr = format(e, 'yyyy-MM-dd');
      setTempStart(sStr);
      setTempEnd(eStr);
      onSelectRange(sStr, eStr, 'this_month');
      setIsOpen(false);
    } else if (presetKey === 'last_month') {
      const lastMonthDate = subMonths(now, 1);
      const s = startOfMonth(lastMonthDate);
      const e = endOfMonth(lastMonthDate);
      const sStr = format(s, 'yyyy-MM-dd');
      const eStr = format(e, 'yyyy-MM-dd');
      setTempStart(sStr);
      setTempEnd(eStr);
      onSelectRange(sStr, eStr, 'last_month');
      setIsOpen(false);
    } else if (presetKey === 'this_year') {
      const s = startOfYear(now);
      const e = endOfYear(now);
      const sStr = format(s, 'yyyy-MM-dd');
      const eStr = format(e, 'yyyy-MM-dd');
      setTempStart(sStr);
      setTempEnd(eStr);
      onSelectRange(sStr, eStr, 'this_year');
      setIsOpen(false);
    } else if (presetKey === 'custom') {
      setTempPreset('custom');
    }
  };

  const handleDayClick = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    setTempPreset('custom');

    if (selectingStart || !tempStart || (tempStart && tempEnd)) {
      setTempStart(dayStr);
      setTempEnd('');
      setSelectingStart(false);
    } else {
      if (parsedStart && isBefore(day, parsedStart)) {
        setTempStart(dayStr);
        setTempEnd(tempStart);
      } else {
        setTempEnd(dayStr);
      }
      setSelectingStart(true);
    }
  };

  const handleApply = () => {
    onSelectRange(tempStart, tempEnd || tempStart, tempPreset || 'custom');
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStart('');
    setTempEnd('');
    setTempPreset('all');
    onSelectRange('', '', 'all');
    setIsOpen(false);
  };

  const displayLabel = useMemo(() => {
    if (tempPreset === 'this_week') return 'This Week';
    if (tempPreset === 'last_week') return 'Last Week';
    if (tempPreset === 'this_month') return 'This Month';
    if (tempPreset === 'last_month') return 'Last Month';
    if (tempPreset === 'this_year') return 'This Year';
    if (startDate && endDate) {
      try {
        const s = parseISO(startDate);
        const e = parseISO(endDate);
        if (isValid(s) && isValid(e)) {
          return `${format(s, 'MMM d, yyyy')} - ${format(e, 'MMM d, yyyy')}`;
        }
      } catch (err) {}
    }
    return 'All Time';
  }, [tempPreset, startDate, endDate]);

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md ${
            startDate || endDate || (datePreset && datePreset !== 'all')
              ? 'border-accent bg-accent/20 text-accent font-bold ring-2 ring-accent/30 shadow-accent/10'
              : 'border-border bg-bg-card hover:bg-bg-hover hover:border-accent/50 text-text-primary'
          }`}
        >
          <CalendarIcon size={16} className="text-accent shrink-0" />
          <span>{displayLabel}</span>
          <ChevronDown
            size={14}
            className={`text-text-secondary shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-accent' : ''
            }`}
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-[380px] sm:w-[420px] rounded-2xl border border-border bg-bg-card p-5 shadow-2xl ring-1 ring-white/10 animate-in fade-in-0 zoom-in-95"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Custom Date Filter
              </span>
            </div>
            <span className="text-xs text-text-secondary font-medium bg-bg-secondary px-2.5 py-0.5 rounded-md border border-border">
              {tempStart && tempEnd ? `${tempStart} → ${tempEnd}` : tempStart ? 'Select End Date' : 'Select Start Date'}
            </span>
          </div>

          {/* Preset Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pb-3.5 border-b border-border-subtle">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'this_week', label: 'This Week' },
              { key: 'last_week', label: 'Last Week' },
              { key: 'this_month', label: 'This Month' },
              { key: 'last_month', label: 'Last Month' },
              { key: 'this_year', label: 'This Year' },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePresetClick(p.key)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tempPreset === p.key
                    ? 'bg-accent text-white shadow-md shadow-accent/30 scale-[1.02]'
                    : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Month Controls */}
          <div className="flex items-center justify-between py-3">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-xl border border-border bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-sm font-extrabold text-text-primary tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </span>

            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-xl border border-border bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <span key={d} className="text-[11px] font-bold uppercase text-text-secondary py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const isStart = parsedStart ? isSameDay(day, parsedStart) : false;
              const isEnd = parsedEnd ? isSameDay(day, parsedEnd) : false;

              let isInRange = false;
              if (parsedStart && parsedEnd) {
                isInRange = isWithinInterval(day, { start: parsedStart, end: parsedEnd });
              } else if (parsedStart && hoverDate && !parsedEnd) {
                const s = isBefore(parsedStart, hoverDate) ? parsedStart : hoverDate;
                const e = isAfter(parsedStart, hoverDate) ? parsedStart : hoverDate;
                isInRange = isWithinInterval(day, { start: s, end: e });
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoverDate(day)}
                  onMouseLeave={() => setHoverDate(null)}
                  className={`h-9 w-full rounded-xl text-xs font-semibold transition-all relative flex items-center justify-center cursor-pointer ${
                    !isCurrentMonth
                      ? 'text-text-muted hover:text-text-secondary'
                      : isStart || isEnd
                      ? 'bg-accent text-white font-extrabold shadow-lg shadow-accent/40 scale-105 z-10'
                      : isInRange
                      ? 'bg-accent/25 text-accent font-bold rounded-none first:rounded-l-xl last:rounded-r-xl'
                      : 'text-text-primary hover:bg-bg-hover'
                  } ${isToday && !isStart && !isEnd ? 'ring-1 ring-accent font-bold' : ''}`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Footer Bar */}
          <div className="mt-4 pt-3.5 border-t border-border-subtle flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1.5 bg-bg-secondary px-3 py-1.5 rounded-xl border border-border">
                <span className="text-[11px] font-bold uppercase text-text-secondary">From:</span>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => {
                    setTempStart(e.target.value);
                    setTempPreset('custom');
                  }}
                  className="w-full bg-transparent text-xs text-text-primary focus:outline-none font-medium"
                />
              </div>
              <div className="flex-1 flex items-center gap-1.5 bg-bg-secondary px-3 py-1.5 rounded-xl border border-border">
                <span className="text-[11px] font-bold uppercase text-text-secondary">To:</span>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => {
                    setTempEnd(e.target.value);
                    setTempPreset('custom');
                  }}
                  className="w-full bg-transparent text-xs text-text-primary focus:outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-bg-secondary text-xs font-semibold text-text-secondary hover:text-danger hover:border-danger/50 transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-lg shadow-accent/30 hover:bg-accent-light transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Check size={14} />
                <span>Apply Filter</span>
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

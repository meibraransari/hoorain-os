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
              ? 'border-[#6c63ff] bg-[#6c63ff]/20 text-[#6c63ff] font-bold ring-2 ring-[#6c63ff]/30 shadow-[#6c63ff]/10'
              : 'border-[#2b2b40] bg-[#141420] hover:bg-[#1a1a2b] hover:border-[#6c63ff]/50 text-[#ffffff]'
          }`}
        >
          <CalendarIcon size={16} className="text-[#6c63ff] shrink-0" />
          <span>{displayLabel}</span>
          <ChevronDown
            size={14}
            className={`text-[#8888a8] shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#6c63ff]' : ''
            }`}
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-[380px] sm:w-[420px] rounded-2xl border border-[#2b2b40] bg-[#141422] p-5 shadow-2xl ring-1 ring-white/10 animate-in fade-in-0 zoom-in-95"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#242436]">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#6c63ff]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#ffffff]">
                Custom Date Filter
              </span>
            </div>
            <span className="text-xs text-[#a0a0cc] font-medium bg-[#1c1c2c] px-2.5 py-0.5 rounded-md border border-[#2b2b40]">
              {tempStart && tempEnd ? `${tempStart} → ${tempEnd}` : tempStart ? 'Select End Date' : 'Select Start Date'}
            </span>
          </div>

          {/* Preset Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pb-3.5 border-b border-[#242436]">
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
                    ? 'bg-[#6c63ff] text-white shadow-md shadow-[#6c63ff]/30 scale-[1.02]'
                    : 'bg-[#1a1a28] text-[#8888a8] hover:text-[#ffffff] hover:bg-[#222234]'
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
              className="p-1.5 rounded-xl border border-[#2b2b40] bg-[#1a1a28] text-[#8888a8] hover:text-[#ffffff] hover:bg-[#222234] transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-sm font-extrabold text-[#ffffff] tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </span>

            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-xl border border-[#2b2b40] bg-[#1a1a28] text-[#8888a8] hover:text-[#ffffff] hover:bg-[#222234] transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <span key={d} className="text-[11px] font-bold uppercase text-[#8888a8] py-1">
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
                      ? 'text-[#444466] hover:text-[#8888a8]'
                      : isStart || isEnd
                      ? 'bg-[#6c63ff] text-white font-extrabold shadow-lg shadow-[#6c63ff]/40 scale-105 z-10'
                      : isInRange
                      ? 'bg-[#6c63ff]/25 text-[#6c63ff] font-bold rounded-none first:rounded-l-xl last:rounded-r-xl'
                      : 'text-[#ffffff] hover:bg-[#222234]'
                  } ${isToday && !isStart && !isEnd ? 'ring-1 ring-[#6c63ff] font-bold' : ''}`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Footer Bar */}
          <div className="mt-4 pt-3.5 border-t border-[#242436] flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1.5 bg-[#10101a] px-3 py-1.5 rounded-xl border border-[#2b2b40]">
                <span className="text-[11px] font-bold uppercase text-[#8888a8]">From:</span>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => {
                    setTempStart(e.target.value);
                    setTempPreset('custom');
                  }}
                  className="w-full bg-transparent text-xs text-[#ffffff] focus:outline-none font-medium"
                />
              </div>
              <div className="flex-1 flex items-center gap-1.5 bg-[#10101a] px-3 py-1.5 rounded-xl border border-[#2b2b40]">
                <span className="text-[11px] font-bold uppercase text-[#8888a8]">To:</span>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => {
                    setTempEnd(e.target.value);
                    setTempPreset('custom');
                  }}
                  className="w-full bg-transparent text-xs text-[#ffffff] focus:outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#2b2b40] bg-[#1a1a28] text-xs font-semibold text-[#8888a8] hover:text-[#ff5572] hover:border-[#ff5572]/50 transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#6c63ff] text-white text-xs font-bold shadow-lg shadow-[#6c63ff]/30 hover:bg-[#8b85ff] transition-all cursor-pointer hover:scale-[1.02]"
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

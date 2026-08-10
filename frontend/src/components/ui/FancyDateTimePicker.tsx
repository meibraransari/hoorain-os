'use client';

import { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, setHours, setMinutes } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Check, X, Sparkles } from 'lucide-react';

interface FancyDateTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

export function FancyDateTimePicker({ value, onChange, label = 'Date & Time' }: FancyDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse incoming value or default to now
  const parsedDate = useMemoDate(value);
  const [currentMonth, setCurrentMonth] = useState<Date>(parsedDate);
  const [selectedDate, setSelectedDate] = useState<Date>(parsedDate);

  // Time state
  const [hours, setHoursState] = useState<number>(parsedDate.getHours());
  const [minutes, setMinutesState] = useState<number>(parsedDate.getMinutes());

  const containerRef = useRef<HTMLDivElement>(null);

  // Update internal states when value prop changes
  useEffect(() => {
    const d = useMemoDate(value);
    setSelectedDate(d);
    setCurrentMonth(d);
    setHoursState(d.getHours());
    setMinutesState(d.getMinutes());
  }, [value]);

  // Click outside listener to close popup
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDateClick = (day: Date) => {
    const newDate = new Date(day);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setSelectedDate(newDate);
    emitChange(newDate);
  };

  const handleTimeChange = (h: number, m: number) => {
    setHoursState(h);
    setMinutesState(m);
    const newDate = new Date(selectedDate);
    newDate.setHours(h);
    newDate.setMinutes(m);
    setSelectedDate(newDate);
    emitChange(newDate);
  };

  const emitChange = (d: Date) => {
    // Format to YYYY-MM-DDTHH:mm for standard form compatibility
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    onChange(localIso);
  };

  const handleQuickPreset = (preset: 'today' | 'yesterday' | 'now') => {
    const now = new Date();
    let target = new Date();
    if (preset === 'yesterday') {
      target.setDate(now.getDate() - 1);
    } else if (preset === 'today') {
      target.setHours(12, 0, 0, 0);
    }
    setSelectedDate(target);
    setCurrentMonth(target);
    setHoursState(target.getHours());
    setMinutesState(target.getMinutes());
    emitChange(target);
  };

  const formattedDisplay = format(selectedDate, 'EEE, MMM d, yyyy • hh:mm a');

  return (
    <div className="relative w-full space-y-1" ref={containerRef}>
      {label && <label className="block text-xs font-semibold uppercase text-text-muted mb-1">{label}</label>}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-hover px-4 py-2.5 text-sm text-text-primary hover:border-accent/50 focus:border-accent focus:outline-none transition-all cursor-pointer shadow-sm group"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-accent/15 text-accent group-hover:scale-105 transition-transform">
            <CalendarIcon size={16} />
          </div>
          <span className="font-semibold text-text-primary">{formattedDisplay}</span>
        </div>
        <div className="flex items-center gap-1 text-text-muted text-xs">
          <Clock size={14} className="text-accent" />
          <span>Change</span>
        </div>
      </button>

      {/* Fancy Calendar & Time Picker Modal Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-[110] w-full max-w-sm rounded-2xl border border-border bg-bg-card p-4 shadow-2xl animate-fade-in space-y-4">
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg border border-border bg-bg-hover hover:bg-bg-card text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="font-bold text-sm text-text-primary tracking-wide">
              {format(currentMonth, 'MMMM yyyy')}
            </span>

            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg border border-border bg-bg-hover hover:bg-bg-card text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Preset Badges */}
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickPreset('today')}
              className="flex-1 py-1 px-2 text-[11px] font-semibold rounded-md border border-border bg-bg-hover hover:bg-accent/10 hover:text-accent text-text-secondary transition-all cursor-pointer text-center"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('yesterday')}
              className="flex-1 py-1 px-2 text-[11px] font-semibold rounded-md border border-border bg-bg-hover hover:bg-accent/10 hover:text-accent text-text-secondary transition-all cursor-pointer text-center"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('now')}
              className="flex-1 py-1 px-2 text-[11px] font-semibold rounded-md border border-accent/30 bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <Sparkles size={11} />
              <span>Right Now</span>
            </button>
          </div>

          {/* Days of Week Row */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`h-8 w-full rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-accent text-white font-extrabold shadow-md scale-105'
                      : isCurrentMonth
                      ? 'text-text-primary hover:bg-bg-hover hover:text-accent'
                      : 'text-text-muted/40 hover:bg-bg-hover/50'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Time Picker Slider / Input Controls */}
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-text-secondary flex items-center gap-1.5">
                <Clock size={14} className="text-accent" />
                <span>Time Selector</span>
              </span>
              <span className="font-mono text-accent font-bold">
                {format(selectedDate, 'hh:mm a')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-text-muted block mb-1 uppercase font-semibold">Hours</label>
                <select
                  value={hours}
                  onChange={(e) => handleTimeChange(parseInt(e.target.value), minutes)}
                  className="w-full rounded-lg border border-border bg-bg-hover p-1.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h} className="bg-bg-card text-text-primary">
                      {h.toString().padStart(2, '0')}:00 ({h >= 12 ? (h === 12 ? '12 PM' : `${h - 12} PM`) : (h === 0 ? '12 AM' : `${h} AM`)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-text-muted block mb-1 uppercase font-semibold">Minutes</label>
                <select
                  value={minutes}
                  onChange={(e) => handleTimeChange(hours, parseInt(e.target.value))}
                  className="w-full rounded-lg border border-border bg-bg-hover p-1.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const m = idx * 5;
                    return (
                      <option key={m} value={m} className="bg-bg-card text-text-primary">
                        :{m.toString().padStart(2, '0')}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Close / Done Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-md hover:bg-accent-light transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Confirm Date & Time</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function useMemoDate(value: string): Date {
  if (!value) return new Date();
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch (e) {
    return new Date();
  }
}

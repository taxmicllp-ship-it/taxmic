import { useState, useRef, useEffect } from 'react';

// ── Types ────────────────────────────────────────────────────────
export interface DateRange {
  start: Date;
  end: Date;
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

// ── Mobile detection hook ────────────────────────────────────────
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

// ── Helpers ──────────────────────────────────────────────────────
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function fmtShort(d: Date) {
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}
function fmtLabel(range: DateRange) {
  return `${fmtShort(range.start)} – ${fmtShort(range.end)}`;
}

// Build calendar grid for a given year/month
function buildGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  return cells;
}

// ── Quick ranges ─────────────────────────────────────────────────
function getQuickRange(type: string): DateRange {
  const today = startOfDay(new Date());
  switch (type) {
    case 'today':     return { start: today, end: today };
    case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); return { start: y, end: y }; }
    case '7days':     { const s = new Date(today); s.setDate(s.getDate() - 6); return { start: s, end: today }; }
    case '30days':    { const s = new Date(today); s.setDate(s.getDate() - 29); return { start: s, end: today }; }
    case 'thisMonth': return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: new Date(today.getFullYear(), today.getMonth() + 1, 0) };
    case 'lastMonth': return { start: new Date(today.getFullYear(), today.getMonth() - 1, 1), end: new Date(today.getFullYear(), today.getMonth(), 0) };
    default:          return { start: today, end: today };
  }
}

const QUICK_RANGES = [
  { label: 'Today',       key: 'today' },
  { label: 'Yesterday',   key: 'yesterday' },
  { label: 'Last 7 Days', key: '7days' },
  { label: 'Last 30 Days',key: '30days' },
  { label: 'This Month',  key: 'thisMonth' },
  { label: 'Last Month',  key: 'lastMonth' },
];

// ── Single month calendar ────────────────────────────────────────
function MonthCalendar({
  year, month, selecting, hovered,
  onDayClick, onDayHover,
  rangeStart, rangeEnd,
}: {
  year: number; month: number;
  selecting: Date | null; hovered: Date | null;
  onDayClick: (d: Date) => void;
  onDayHover: (d: Date | null) => void;
  rangeStart: Date; rangeEnd: Date;
}) {
  const cells = buildGrid(year, month);

  function dayState(d: Date) {
    const s = startOfDay(d);
    const rs = startOfDay(rangeStart);
    const re = startOfDay(rangeEnd);

    if (selecting) {
      const hov = hovered ? startOfDay(hovered) : null;
      const lo = hov && hov < rs ? hov : rs;
      const hi = hov && hov > rs ? hov : rs;
      if (sameDay(s, lo) || sameDay(s, hi)) return 'selected';
      if (s > lo && s < hi) return 'in-range';
      return 'normal';
    }

    if (sameDay(s, rs) || sameDay(s, re)) return 'selected';
    if (s > rs && s < re) return 'in-range';
    return 'normal';
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-[10px] font-bold text-slate-400 uppercase text-center py-1">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const state = dayState(d);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onDayClick(d)}
              onMouseEnter={() => onDayHover(d)}
              onMouseLeave={() => onDayHover(null)}
              className={[
                'aspect-square flex items-center justify-center text-[13px] font-medium rounded-lg transition-all',
                state === 'selected'  ? 'bg-brand-500 text-white font-bold shadow-sm' : '',
                state === 'in-range'  ? 'bg-brand-500/10 text-brand-600 rounded-none' : '',
                state === 'normal'    ? 'text-slate-700 hover:bg-slate-100 hover:text-brand-600' : '',
              ].join(' ')}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen]         = useState(false);
  const [draft, setDraft]       = useState<DateRange>(value);
  const [selecting, setSelecting] = useState<Date | null>(null);
  const [hovered, setHovered]   = useState<Date | null>(null);
  const [activeQuick, setActiveQuick] = useState<string | null>(null);

  const isMobile = useIsMobile();

  const [leftYear,  setLeftYear]  = useState(value.start.getFullYear());
  const [leftMonth, setLeftMonth] = useState(value.start.getMonth());

  const rightYear  = leftMonth === 11 ? leftYear + 1 : leftYear;
  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;

  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click (desktop only — mobile uses overlay)
  useEffect(() => {
    if (isMobile) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobile]);

  // Prevent body scroll when mobile sheet is open
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, open]);

  // Sync draft when value changes externally
  useEffect(() => { setDraft(value); }, [value]);

  function handleDayClick(d: Date) {
    setActiveQuick(null);
    if (!selecting) {
      setSelecting(d);
      setDraft({ start: d, end: d });
    } else {
      const s = d < selecting ? d : selecting;
      const e = d < selecting ? selecting : d;
      setDraft({ start: s, end: e });
      setSelecting(null);
    }
  }

  function handleQuick(key: string) {
    const r = getQuickRange(key);
    setDraft(r);
    setSelecting(null);
    setActiveQuick(key);
    setLeftYear(r.start.getFullYear());
    setLeftMonth(r.start.getMonth() === 11 ? 10 : r.start.getMonth());
  }

  function handleApply() {
    onChange(draft);
    setOpen(false);
  }

  function handleCancel() {
    setDraft(value);
    setSelecting(null);
    setOpen(false);
  }

  function prevMonth() {
    if (leftMonth === 0) { setLeftYear(y => y - 1); setLeftMonth(11); }
    else setLeftMonth(m => m - 1);
  }
  function nextMonth() {
    if (leftMonth === 11) { setLeftYear(y => y + 1); setLeftMonth(0); }
    else setLeftMonth(m => m + 1);
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="group px-4 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-gray-300 hover:border-brand-500/30 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all flex items-center gap-3 shadow-sm w-full sm:w-auto"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-brand-500 shrink-0">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{fmtLabel(value)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-slate-400 shrink-0 ml-auto sm:ml-0">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── Mobile bottom sheet ── */}
      {open && isMobile && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[199] bg-black/40"
            onClick={handleCancel}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-[200] bg-white dark:bg-gray-900 rounded-t-2xl shadow-[0_-8px_30px_-4px_rgba(0,0,0,0.15)] overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-gray-700" />
            </div>

            {/* Presets — horizontal scroll row */}
            <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-gray-800">
              {QUICK_RANGES.map(q => (
                <button
                  key={q.key}
                  onClick={() => handleQuick(q.key)}
                  className={[
                    'shrink-0 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all whitespace-nowrap',
                    activeQuick === q.key
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400',
                  ].join(' ')}
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Single month calendar */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">{MONTHS[leftMonth]} {leftYear}</h4>
                <button onClick={nextMonth} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <MonthCalendar
                year={leftYear} month={leftMonth}
                selecting={selecting} hovered={hovered}
                onDayClick={handleDayClick} onDayHover={setHovered}
                rangeStart={draft.start} rangeEnd={draft.end}
              />
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/30 px-4 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative flex-1 min-w-0">
                  <label className="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start</label>
                  <input
                    readOnly
                    value={fmtShort(draft.start)}
                    className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg py-2.5 px-3 text-sm font-semibold text-slate-700 dark:text-gray-300"
                  />
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-slate-300 shrink-0">
                  <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div className="relative flex-1 min-w-0">
                  <label className="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">End</label>
                  <input
                    readOnly
                    value={fmtShort(draft.end)}
                    className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg py-2.5 px-3 text-sm font-semibold text-slate-700 dark:text-gray-300"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCancel}
                  className="px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="px-4 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-brand-600 transition-all active:scale-95"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Desktop dropdown ── */}
      {open && !isMobile && (
        <div className="absolute right-0 top-full mt-3 z-[200] bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden animate-[slideDown_0.25s_cubic-bezier(0.16,1,0.3,1)_forwards] flex"
          style={{ width: 720 }}
        >
          {/* Sidebar */}
          <div className="w-44 shrink-0 bg-slate-50 dark:bg-gray-800/50 border-r border-slate-100 dark:border-gray-800 p-3 flex flex-col gap-0.5">
            {QUICK_RANGES.map(q => (
              <button
                key={q.key}
                onClick={() => handleQuick(q.key)}
                className={[
                  'w-full px-3 py-2 text-left text-[13px] font-medium rounded-lg transition-all',
                  activeQuick === q.key
                    ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-slate-800 dark:hover:text-gray-200',
                ].join(' ')}
              >
                {q.label}
              </button>
            ))}
            <div className="my-2 border-t border-slate-200 dark:border-gray-700" />
            <button className="w-full px-3 py-2 text-left text-[13px] font-medium rounded-lg text-slate-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-slate-800 transition-all">
              Custom Range
            </button>
          </div>

          {/* Calendar area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Month headers + calendars */}
            <div className="flex gap-6 p-5 pb-4">
              {/* Left month */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">{MONTHS[leftMonth]} {leftYear}</h4>
                  <div className="w-7" />
                </div>
                <MonthCalendar
                  year={leftYear} month={leftMonth}
                  selecting={selecting} hovered={hovered}
                  onDayClick={handleDayClick} onDayHover={setHovered}
                  rangeStart={draft.start} rangeEnd={draft.end}
                />
              </div>

              {/* Divider */}
              <div className="w-px bg-slate-100 dark:bg-gray-800 self-stretch" />

              {/* Right month */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-7" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">{MONTHS[rightMonth]} {rightYear}</h4>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
                <MonthCalendar
                  year={rightYear} month={rightMonth}
                  selecting={selecting} hovered={hovered}
                  onDayClick={handleDayClick} onDayHover={setHovered}
                  rangeStart={draft.start} rangeEnd={draft.end}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/30 px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                {/* Start input */}
                <div className="relative flex-1">
                  <label className="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                  <input
                    readOnly
                    value={fmtShort(draft.start)}
                    className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg py-2.5 px-3 text-sm font-semibold text-slate-700 dark:text-gray-300"
                  />
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-300 shrink-0">
                  <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {/* End input */}
                <div className="relative flex-1">
                  <label className="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
                  <input
                    readOnly
                    value={fmtShort(draft.end)}
                    className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg py-2.5 px-3 text-sm font-semibold text-slate-700 dark:text-gray-300"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="px-5 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-brand-600 transition-all active:scale-95"
                >
                  Apply Range
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

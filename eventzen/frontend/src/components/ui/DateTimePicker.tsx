import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

interface DateTimePickerProps {
  label?: React.ReactNode;
  value: string; // "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
}

export default function DateTimePicker({
  label,
  value,
  onChange,
  error,
  minDate,
  maxDate,
  placeholder = "Select date & time",
}: DateTimePickerProps) {
  const today = new Date();
  const min = minDate ?? today;
  const parsed = value ? new Date(value) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());
  const [selDate, setSelDate] = useState<{ y: number; m: number; d: number } | null>(
    parsed ? { y: parsed.getFullYear(), m: parsed.getMonth(), d: parsed.getDate() } : null,
  );
  const [selTime, setSelTime] = useState<string>(
    parsed
      ? `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`
      : "",
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timeListRef = useRef<HTMLDivElement>(null);

  const PANEL_W = 420;
  const PANEL_H = 400; // approximate max height

  const openPicker = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Horizontal: align to left edge of trigger, clamp to viewport
    let left = rect.left;
    if (left + PANEL_W > window.innerWidth - 8) left = window.innerWidth - PANEL_W - 8;
    if (left < 8) left = 8;
    // Vertical: prefer below, flip up if not enough room, then clamp within viewport
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    let top = spaceBelow >= PANEL_H ? rect.bottom + 4 : rect.top - PANEL_H - 4;
    top = Math.max(8, Math.min(top, window.innerHeight - PANEL_H - 8));
    setPanelStyle({ position: "fixed", top, left, width: PANEL_W, zIndex: 9999 });
    setIsOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Scroll selected time into view when panel opens
  useEffect(() => {
    if (!isOpen || !timeListRef.current) return;
    const target = selTime || "09:00";
    const idx = TIME_SLOTS.indexOf(target);
    if (idx >= 0) {
      const el = timeListRef.current.children[idx] as HTMLElement;
      el?.scrollIntoView({ block: "center" });
    }
  }, [isOpen]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const minD = new Date(min);
    minD.setHours(0, 0, 0, 0);
    if (d < minD) return true;
    if (maxDate) {
      const maxD = new Date(maxDate);
      maxD.setHours(23, 59, 59, 999);
      if (d > maxD) return true;
    }
    return false;
  };

  const isSelected = (day: number) =>
    selDate?.y === viewYear && selDate?.m === viewMonth && selDate?.d === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const commit = (date: { y: number; m: number; d: number }, time: string) => {
    if (!time) return;
    const iso = `${date.y}-${String(date.m + 1).padStart(2, "0")}-${String(date.d).padStart(2, "0")}T${time}`;
    onChange(iso);
  };

  const handleDateClick = (day: number) => {
    if (isDisabled(day)) return;
    const d = { y: viewYear, m: viewMonth, d: day };
    setSelDate(d);
    const t = selTime || "09:00";
    if (!selTime) setSelTime(t);
    commit(d, t);
  };

  const handleTimeClick = (time: string) => {
    setSelTime(time);
    if (selDate) commit(selDate, time);
  };

  const displayValue = (() => {
    if (!value) return "";
    try {
      const d = new Date(value);
      return d.toLocaleString("en-IN", {
        weekday: "short", day: "numeric", month: "short",
        year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
      });
    } catch { return value; }
  })();

  const summaryText = (() => {
    if (!selDate || !selTime) return null;
    const d = new Date(selDate.y, selDate.m, selDate.d);
    return `${d.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })} at ${selTime}`;
  })();

  const panel = isOpen ? (
    <div
      ref={panelRef}
      style={panelStyle}
      className="bg-white border border-border-light rounded-xl shadow-warm-xl overflow-hidden"
    >
      <div className="flex">
        {/* Calendar */}
        <div className="flex-1 p-4 border-r border-border-light min-w-0">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cream transition-colors"
            >
              <ChevronLeft size={15} className="text-dark-gray" />
            </button>
            <span className="font-body font-semibold text-near-black text-sm">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cream transition-colors"
            >
              <ChevronRight size={15} className="text-dark-gray" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center font-body text-[11px] text-muted-gray py-1 font-medium">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isDisabled(day);
              const selected = isSelected(day);
              const todayMark = isToday(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  disabled={disabled}
                  className={[
                    "aspect-square flex items-center justify-center rounded-lg font-body text-sm transition-all",
                    disabled ? "text-muted-gray/40 cursor-not-allowed" : "cursor-pointer",
                    selected
                      ? "bg-near-black text-white"
                      : disabled
                      ? ""
                      : todayMark
                      ? "text-amber font-semibold hover:bg-amber/10"
                      : "text-near-black hover:bg-cream",
                  ].join(" ")}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        <div className="w-[120px] flex flex-col">
          <div className="px-3 py-2.5 border-b border-border-light flex items-center gap-1.5 flex-shrink-0">
            <Clock size={12} className="text-muted-gray" />
            <span className="font-body text-[11px] text-muted-gray font-medium uppercase tracking-wide">
              Time
            </span>
          </div>
          <div
            ref={timeListRef}
            className="overflow-y-auto flex-1 p-1.5 space-y-0.5 overscroll-contain"
            style={{ maxHeight: 260 }}
          >
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => handleTimeClick(slot)}
                className={[
                  "w-full px-2 py-2 rounded-lg font-body text-sm text-center transition-all",
                  selTime === slot
                    ? "bg-near-black text-white font-medium"
                    : "text-near-black hover:bg-cream",
                ].join(" ")}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="border-t border-border-light px-4 py-3 bg-cream/40 flex items-center justify-between gap-3">
        {summaryText ? (
          <p className="font-body text-sm text-dark-gray truncate">
            <span className="font-medium text-near-black">{summaryText}</span>
          </p>
        ) : (
          <p className="font-body text-sm text-muted-gray">
            {!selDate ? "Select a date" : "Select a time"}
          </p>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex-shrink-0 px-4 py-1.5 bg-near-black text-white font-body text-sm rounded-lg hover:bg-near-black/80 transition-colors"
        >
          {summaryText ? "Done" : "Close"}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-near-black mb-1.5 font-body">
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={openPicker}
        className={`w-full bg-white border-[1.5px] rounded-md px-4 py-3 font-body text-sm text-left flex items-center justify-between gap-2 transition-all
          ${error ? "border-burgundy" : "border-warm-tan"}
          ${isOpen ? "border-amber shadow-[0_0_0_3px_rgba(212,168,67,0.15)]" : "hover:border-amber/60"}`}
      >
        <span className={displayValue ? "text-near-black" : "text-muted-gray"}>
          {displayValue || placeholder}
        </span>
        <Calendar size={15} className="text-muted-gray flex-shrink-0" />
      </button>
      {error && <p className="mt-1 text-sm text-burgundy font-body">{error}</p>}

      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </div>
  );
}

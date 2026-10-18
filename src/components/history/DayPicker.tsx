import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { addDays, formatDate, startOfDay } from "../../lib/time";
import { OutlineButton } from "../ui/OutlineButton";
import { Tooltip } from "../ui/Tooltip";

interface DayPickerProps {
  day: number;
  today: number;
  onChange: (day: number) => void;
}

/** ‹ date › control with a calendar for choosing which day to view. */
export function DayPicker({ day, today, onChange }: DayPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isToday = day === today;

  const openCalendar = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <IconButton label="Previous day" onClick={() => onChange(addDays(day, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </IconButton>

      <div className="relative">
        <button
          type="button"
          onClick={openCalendar}
          aria-label={`Viewing ${formatDate(day)}. Choose another date`}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-canvas"
        >
          <CalendarDays className="h-4 w-4 text-muted" />
          {formatDate(day)}
        </button>
        {/* Native date input; invisible but positioned so its calendar opens here. */}
        <input
          ref={inputRef}
          type="date"
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0"
          max={toInputValue(today)}
          value={toInputValue(day)}
          onChange={(e) => {
            const picked = fromInputValue(e.target.value);
            if (picked !== null) onChange(Math.min(picked, today));
          }}
        />
      </div>

      <Tooltip content={isToday ? "You're viewing today" : null} align="end" disabledTarget={isToday}>
        <IconButton label="Next day" onClick={() => onChange(addDays(day, 1))} disabled={isToday}>
          <ChevronRight className="h-4 w-4" />
        </IconButton>
      </Tooltip>

      {!isToday && (
        <OutlineButton className="px-3 py-1.5" onClick={() => onChange(today)}>
          Today
        </OutlineButton>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-slate-600 hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** Timestamp → "YYYY-MM-DD" in local time. */
function toInputValue(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" → local midnight, or null if empty/invalid. */
function fromInputValue(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return startOfDay(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime());
}

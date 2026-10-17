import { Info } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

interface TooltipProps {
  /** Tooltip text. When null/empty, children render without a tooltip. */
  content: string | null | undefined;
  children: ReactNode;
  /** Horizontal alignment of the bubble relative to the target. */
  align?: "start" | "center" | "end";
  /**
   * Set when the child is a disabled button. Disabled buttons don't receive
   * mouse or keyboard events, so the wrapper takes them instead and becomes
   * focusable for keyboard users.
   */
  disabledTarget?: boolean;
  className?: string;
}

const ALIGN = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

/** Small dark bubble shown on hover and keyboard focus. */
export function Tooltip({
  content,
  children,
  align = "center",
  disabledTarget = false,
  className = "",
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  if (!content) return <>{children}</>;

  return (
    <span
      className={`relative inline-flex ${
        disabledTarget ? "cursor-not-allowed rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand [&>*]:pointer-events-none" : ""
      } ${className}`}
      tabIndex={disabledTarget ? 0 : undefined}
      aria-describedby={open ? id : undefined}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={`pointer-events-none absolute bottom-full z-30 mb-2 w-max max-w-64 rounded-lg bg-ink px-2.5 py-1.5 text-left text-xs leading-snug font-normal whitespace-normal text-white shadow-lg ${ALIGN[align]}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}

/** ⓘ icon that explains the label next to it. */
export function InfoTip({ content, align = "center" }: { content: string; align?: TooltipProps["align"] }) {
  return (
    <Tooltip content={content} align={align}>
      <span
        tabIndex={0}
        aria-label={`More info: ${content}`}
        className="inline-flex cursor-help rounded-full text-slate-400 outline-none hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Info className="h-4 w-4" strokeWidth={2} />
      </span>
    </Tooltip>
  );
}

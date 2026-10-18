import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Tooltip } from "./Tooltip";

interface PaginationProps {
  /** Current page, 1-based. */
  page: number;
  pageSize: number;
  total: number;
  /** What's being counted, e.g. "sessions". */
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

/** "Showing 11–20 of 62" + rows-per-page + ‹ 1 … 4 5 6 … 12 › controls. */
export function Pagination({
  page,
  pageSize,
  total,
  itemLabel,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const onFirst = page <= 1;
  const onLast = page >= pageCount;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <div className="flex items-center gap-4">
        <span className="tabular-nums" aria-live="polite">
          Showing {from}–{to} of {total} {itemLabel}
        </span>
        <label className="flex items-center gap-2">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="cursor-pointer rounded-lg border border-line bg-white px-2 py-1 text-ink"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {pageCount > 1 && (
        <nav aria-label={`${itemLabel} pages`} className="flex items-center gap-1">
          <Tooltip content={onFirst ? "You're on the first page" : null} disabledTarget={onFirst}>
            <PageButton label="Previous page" onClick={() => onPageChange(page - 1)} disabled={onFirst}>
              <ChevronLeft className="h-4 w-4" />
              <span className="pr-1">Previous</span>
            </PageButton>
          </Tooltip>

          {pageNumbers(page, pageCount).map((n, i) =>
            n === null ? (
              <span key={`gap-${i}`} className="px-1 text-muted" aria-hidden>
                …
              </span>
            ) : (
              <PageButton
                key={n}
                label={`Page ${n}`}
                onClick={() => onPageChange(n)}
                current={n === page}
              >
                {n}
              </PageButton>
            ),
          )}

          <Tooltip content={onLast ? "You're on the last page" : null} align="end" disabledTarget={onLast}>
            <PageButton label="Next page" onClick={() => onPageChange(page + 1)} disabled={onLast}>
              <span className="pl-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </PageButton>
          </Tooltip>
        </nav>
      )}
    </div>
  );
}

function PageButton({
  label,
  onClick,
  disabled = false,
  current = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  current?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      className={`flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg px-2 tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        current
          ? "bg-brand font-semibold text-white"
          : "border border-line bg-white text-ink hover:bg-canvas"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Page numbers to show, with null for "…": always the first and last page
 * plus the current page and its neighbours, e.g. 1 … 4 5 6 … 12.
 */
function pageNumbers(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const start = Math.max(2, Math.min(page - 1, pageCount - 4));
  const end = Math.min(pageCount - 1, Math.max(page + 1, 5));
  const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return [1, ...(start > 2 ? [null] : []), ...middle, ...(end < pageCount - 1 ? [null] : []), pageCount];
}

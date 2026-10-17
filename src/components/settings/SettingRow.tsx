import type { ReactNode } from "react";

interface SettingRowProps {
  label: string;
  description?: string;
  /** id of the control, so clicking the label focuses/toggles it. */
  htmlFor?: string;
  children: ReactNode;
}

/** Label + description on the left, control on the right, divider below. */
export function SettingRow({ label, description, htmlFor, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-b-0">
      <label htmlFor={htmlFor} className="min-w-0 cursor-pointer">
        <span className="block font-semibold text-ink">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </label>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** Large green checkbox matching the design. */
export function Checkbox({ id, checked, onChange, disabled = false }: CheckboxProps) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="h-6 w-6 cursor-pointer accent-good-strong disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

interface SelectProps<T extends string | number> {
  id: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function Select<T extends string | number>({ id, value, options, onChange, disabled = false }: SelectProps<T>) {
  return (
    <select
      id={id}
      value={String(value)}
      disabled={disabled}
      onChange={(e) => {
        const match = options.find((o) => String(o.value) === e.target.value);
        if (match) onChange(match.value);
      }}
      className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] text-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

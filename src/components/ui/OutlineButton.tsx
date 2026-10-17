import type { ButtonHTMLAttributes } from "react";

/** Light outlined button with blue text, as used throughout the design. */
export function OutlineButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`cursor-pointer rounded-lg border border-brand-soft bg-white px-4 py-2 text-sm text-brand transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

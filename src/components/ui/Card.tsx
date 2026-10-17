import type { ReactNode } from "react";
import { InfoTip } from "./Tooltip";

interface CardProps {
  title?: string;
  /** Optional explanation shown in an ⓘ tooltip next to the title. */
  info?: string;
  className?: string;
  children: ReactNode;
}

/** White rounded panel used for every dashboard section. */
export function Card({ title, info, className = "", children }: CardProps) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
      {title && (
        <h2 className="mb-3 flex items-center gap-1.5 text-[15px] font-semibold text-ink">
          {title}
          {info && <InfoTip content={info} />}
        </h2>
      )}
      {children}
    </section>
  );
}

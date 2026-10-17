import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

/** White rounded panel used for every dashboard section. */
export function Card({ title, className = "", children }: CardProps) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
      {title && <h2 className="mb-3 text-[15px] font-semibold text-ink">{title}</h2>}
      {children}
    </section>
  );
}

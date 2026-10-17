import { Card } from "../components/ui/Card";

/** Temporary screen for modules that are not built yet. */
export function PlaceholderPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-[28px] leading-tight font-bold text-ink">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </header>
      <Card>
        <p className="text-muted">This screen is under construction.</p>
      </Card>
    </div>
  );
}

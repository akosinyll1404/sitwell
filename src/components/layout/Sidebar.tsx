import { ChartLine, House, Settings, type LucideIcon } from "lucide-react";
import type { PageId } from "../../types/navigation";

const NAV_ITEMS: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Home / Dashboard", icon: House },
  { id: "history", label: "Posture Status & History", icon: ChartLine },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  active: PageId;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar px-4 py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="h-9 w-9 rounded-full bg-brand" aria-hidden />
        <span className="text-xl font-bold text-ink">Sitwell Pro</span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left text-[15px] transition-colors ${
                isActive
                  ? "bg-white font-medium text-brand shadow-sm"
                  : "text-slate-700 hover:bg-white/60"
              }`}
            >
              <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

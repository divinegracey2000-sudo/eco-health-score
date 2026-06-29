import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Search,
  Zap,
  Store,
  Users,
  Megaphone,
  FileText,
  Settings,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/audit", search: { tab: "overview" }, label: "Overview", icon: LayoutDashboard },
  { to: "/audit", search: { tab: "seo" }, label: "SEO", icon: Search },
  { to: "/audit", search: { tab: "performance" }, label: "Performance", icon: Zap },
  { to: "/audit", search: { tab: "setup" }, label: "Store Setup", icon: Store },
  { to: "/audit", search: { tab: "retention" }, label: "Customer Retention", icon: Users },
  { to: "/audit", search: { tab: "marketing" }, label: "Marketing", icon: Megaphone },
  { to: "/audit", search: { tab: "report" }, label: "Report", icon: FileText },
] as const;

interface Props {
  url: string;
  activeTab: string;
}

export function DashboardSidebar({ url, activeTab }: Props) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <Link
        to="/"
        className="flex h-16 items-center gap-2 border-b border-border px-6"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BarChart3 className="h-5 w-5" />
        </div>
        <span className="font-display text-lg font-semibold">Storelens</span>
      </Link>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Audit
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.search.tab;
          return (
            <Link
              key={item.label}
              to={item.to}
              search={{ url, tab: item.search.tab }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </nav>

      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        Storelens analyzes any Shopify storefront across SEO, performance, trust, retention and marketing.
      </div>
    </aside>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Settings as SettingsIcon, Info, Bell, Palette } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — Storelens" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar url="" activeTab="" />
      <main className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur lg:px-10">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-muted-foreground" />
            <h1 className="font-display text-lg font-semibold">Settings</h1>
          </div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back home
          </Link>
        </header>
        <div className="mx-auto max-w-3xl space-y-5 px-6 py-10 lg:px-10">
          {sections.map((s) => (
            <section key={s.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <s.Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-base font-semibold">{s.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

const sections = [
  {
    Icon: Info,
    title: "Workspace",
    body: "Storelens runs without an account today. Saved audit history and team workspaces are on the roadmap.",
  },
  {
    Icon: Bell,
    title: "Notifications",
    body: "Email digests will land here once accounts are enabled. Subscribe to monitor competitor stores on a schedule.",
  },
  {
    Icon: Palette,
    title: "Appearance",
    body: "Storelens uses a clean light theme tuned for long analytics sessions. Dark mode is planned.",
  },
];

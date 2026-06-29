import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import {
  BarChart3,
  Globe2,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

import { runAudit } from "@/lib/audit.functions";
import type { AuditResult, CategoryKey } from "@/lib/audit-types";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ScoreGauge } from "@/components/dashboard/ScoreGauge";
import {
  CategoryBars,
  CategoryPie,
  CategoryRadar,
  StatusDonut,
} from "@/components/dashboard/CategoryCharts";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { CheckRow } from "@/components/dashboard/CheckRow";
import { cn } from "@/lib/utils";

const US_TIME = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  dateStyle: "medium",
  timeStyle: "short",
});
function formatUS(iso: string) {
  try {
    return `${US_TIME.format(new Date(iso))} ET`;
  } catch {
    return iso;
  }
}

function scoreTone(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-critical";
}

function issueTone(count: number) {
  if (count === 0) return "text-success";
  if (count <= 3) return "text-warning";
  return "text-critical";
}


const searchSchema = z.object({
  url: z.string().optional(),
  tab: z
    .enum(["overview", "seo", "performance", "setup", "retention", "marketing", "report"])
    .optional()
    .default("overview"),
});

export const Route = createFileRoute("/audit")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Audit Dashboard — Storelens" },
      { name: "description", content: "Comprehensive Shopify store audit dashboard." },
    ],
  }),
  component: AuditPage,
});

const TAB_TO_CATEGORY: Record<string, CategoryKey | null> = {
  overview: null,
  seo: "seo",
  performance: "performance",
  setup: "setup",
  retention: "retention",
  marketing: "marketing",
  report: null,
};

function AuditPage() {
  const { url, tab } = Route.useSearch();
  const navigate = useNavigate();
  const runAuditFn = useServerFn(runAudit);

  const query = useQuery({
    queryKey: ["audit", url ?? ""],
    queryFn: () => runAuditFn({ data: { url: url! } }),
    enabled: !!url,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  if (!url) {
    return <NoUrl />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar url={url} activeTab={tab} />
      <main className="flex-1 min-w-0">
        <TopBar
          url={url}
          audit={query.data}
          loading={query.isLoading}
          onRefresh={() => query.refetch()}
        />

        <div className="px-6 py-8 lg:px-10">
          {query.isLoading && <LoadingState url={url} />}
          {query.isError && (
            <ErrorState message={(query.error as Error)?.message ?? "Audit failed"} onRetry={() => query.refetch()} />
          )}
          {query.data && <Dashboard audit={query.data} tab={tab} navigate={navigate} />}
        </div>
      </main>
    </div>
  );
}

function NoUrl() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <Globe2 className="h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 font-display text-2xl font-semibold">No store URL provided</h1>
      <p className="mt-2 text-muted-foreground">Start a new audit from the home page.</p>
      <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
        <ArrowLeft className="h-4 w-4" /> Go home
      </Link>
    </div>
  );
}

function TopBar({
  url,
  audit,
  loading,
  onRefresh,
}: {
  url: string;
  audit?: AuditResult;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/80 px-6 backdrop-blur lg:px-10">
      <div className="flex items-center gap-3 min-w-0">
        <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden">
          <BarChart3 className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe2 className="h-3.5 w-3.5" />
            <span className="truncate">{audit?.storeName || "Analyzing"}</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
          >
            <span className="truncate">{url}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Re-scan
        </button>
      </div>
    </header>
  );
}


function LoadingState({ url }: { url: string }) {
  const steps = [
    "Resolving store URL",
    "Fetching homepage markup",
    "Analyzing SEO signals",
    "Inspecting performance footprint",
    "Auditing trust & merchandising",
    "Detecting retention & marketing",
    "Compiling scorecard",
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 900);
    return () => clearInterval(i);
  }, [steps.length]);
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-card">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"
      >
        <Sparkles className="h-7 w-7" />
      </motion.div>
      <h2 className="mt-5 font-display text-xl font-semibold">Running audit</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Analyzing <span className="font-medium text-foreground">{url}</span>
      </p>
      <div className="mt-6 space-y-2 text-left">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3 text-sm">
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                i < step
                  ? "bg-success text-success-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-critical/30 bg-critical-soft/40 p-8 text-center">
      <XCircle className="mx-auto h-10 w-10 text-critical" />
      <h2 className="mt-4 font-display text-xl font-semibold">Audit failed</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <button onClick={onRetry} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
        Try again
      </button>
    </div>
  );
}

function Dashboard({
  audit,
  tab,
  navigate,
}: {
  audit: AuditResult;
  tab: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  // Mobile tab bar
  const tabs = ["overview", "seo", "performance", "setup", "retention", "marketing", "report"] as const;
  return (
    <div>
      <div className="mb-6 flex gap-2 overflow-x-auto lg:hidden">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() =>
              navigate({ to: "/audit", search: { url: audit.url, tab: t } })
            }
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              tab === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab audit={audit} />}
      {tab === "report" && <ReportTab audit={audit} />}
      {TAB_TO_CATEGORY[tab] && (
        <CategoryTab audit={audit} category={TAB_TO_CATEGORY[tab] as CategoryKey} />
      )}
    </div>
  );
}

function OverviewTab({ audit }: { audit: AuditResult }) {
  const highest = [...audit.categories].sort((a, b) => b.score - a.score)[0];
  const lowest = [...audit.categories].sort((a, b) => a.score - b.score)[0];
  const passed = audit.categories.reduce((s, c) => s + c.passed, 0);
  const warnings = audit.categories.reduce((s, c) => s + c.warnings, 0);
  const failed = audit.categories.reduce((s, c) => s + c.failed, 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Overall Score"
          value={`${audit.overallScore}`}
          hint={`Grade ${audit.grade} • ${audit.health}`}
          tone="primary"
          icon={BarChart3}
          delay={0}
        />
        <KpiCard
          label="Issues Found"
          value={audit.totalIssues}
          hint={`${audit.criticalIssues} critical • ${audit.warnings} warnings`}
          icon={AlertTriangle}
          tone="warning"
          delay={0.05}
        />
        <KpiCard
          label="Optimization Opportunities"
          value={audit.opportunities}
          hint="Actionable recommendations ready"
          icon={Sparkles}
          tone="primary"
          delay={0.1}
        />
        <KpiCard
          label="Conversion Uplift Potential"
          value={`+${audit.conversionPotential}%`}
          hint="Estimated after fixes"
          icon={TrendingUp}
          tone="success"
          delay={0.15}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Store Health</h3>
              <p className="text-xs text-muted-foreground">Weighted across all five categories</p>
            </div>
          </div>
          <ScoreGauge score={audit.overallScore} grade={audit.grade} />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Stat icon={CheckCircle2} value={passed} label="Passed" tone="success" />
            <Stat icon={AlertTriangle} value={warnings} label="Warnings" tone="warning" />
            <Stat icon={XCircle} value={failed} label="Critical" tone="critical" />
          </div>
        </motion.div>

        <ChartCard title="Category Radar" subtitle="Your store vs. industry benchmark" className="lg:col-span-2">
          <CategoryRadar categories={audit.categories} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Category Scores" subtitle="Score vs. industry benchmark">
          <CategoryBars categories={audit.categories} />
        </ChartCard>
        <ChartCard title="Check Outcomes" subtitle="Distribution across all audits">
          <StatusDonut passed={passed} warnings={warnings} failed={failed} />
        </ChartCard>
        <ChartCard title="Category Weighting" subtitle="How the overall score is composed">
          <CategoryPie categories={audit.categories} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <InsightCard
          icon={TrendingUp}
          tone="success"
          title="Highest scoring"
          headline={highest.label}
          value={`${highest.score}/100`}
          body="Maintain momentum — keep monitoring for regressions."
        />
        <InsightCard
          icon={TrendingDown}
          tone="critical"
          title="Lowest scoring"
          headline={lowest.label}
          value={`${lowest.score}/100`}
          body="Prioritize fixes in this category for the biggest gains."
        />
        <InsightCard
          icon={Sparkles}
          tone="primary"
          title="Biggest opportunity"
          headline={lowest.label}
          value={`+${Math.max(1, 100 - lowest.score)} pts`}
          body="Closing this gap moves your overall score most."
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-card"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Category breakdown</h3>
            <p className="text-xs text-muted-foreground">Animated progress vs. industry benchmark (vertical tick)</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {audit.categories.map((c, i) => (
            <ProgressBar
              key={c.key}
              label={c.label}
              value={c.score}
              benchmark={c.benchmark}
              delay={0.05 * i}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function CategoryTab({ audit, category }: { audit: AuditResult; category: CategoryKey }) {
  const cat = audit.categories.find((c) => c.key === category)!;
  const issues = cat.checks.filter((c) => c.status !== "pass" && c.status !== "info");
  const passing = cat.checks.filter((c) => c.status === "pass");
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Category Score" value={cat.score} hint={`Benchmark ${cat.benchmark}`} tone="primary" icon={BarChart3} />
        <KpiCard label="Passed" value={cat.passed} icon={CheckCircle2} tone="success" />
        <KpiCard label="Warnings" value={cat.warnings} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Critical" value={cat.failed} icon={XCircle} tone="critical" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold">{cat.label} score</h3>
        <p className="text-xs text-muted-foreground">Weight in overall score: {cat.weight}%</p>
        <div className="mt-4">
          <ProgressBar label="Your score" value={cat.score} benchmark={cat.benchmark} />
        </div>
      </div>

      {issues.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-lg font-semibold">
            Recommendations <span className="text-muted-foreground">({issues.length})</span>
          </h3>
          <div className="space-y-3">
            {issues.map((c, i) => (
              <CheckRow key={c.id} check={c} index={i} />
            ))}
          </div>
        </section>
      )}

      {passing.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-lg font-semibold">
            Passing checks <span className="text-muted-foreground">({passing.length})</span>
          </h3>
          <div className="space-y-3">
            {passing.map((c, i) => (
              <CheckRow key={c.id} check={c} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReportTab({ audit }: { audit: AuditResult }) {
  const recommendations = audit.categories
    .flatMap((c) => c.checks.filter((k) => k.status !== "pass" && k.status !== "info"))
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
      return (order[a.priority || "low"] ?? 3) - (order[b.priority || "low"] ?? 3);
    });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Executive summary
            </div>
            <h2 className="mt-1 font-display text-3xl font-semibold">{audit.storeName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Audited {formatUS(audit.scannedAt)} • {audit.url}
            </p>
            <p className="mt-4 max-w-2xl text-sm text-foreground">
              {audit.storeName} scored <strong>{audit.overallScore}/100</strong> ({audit.health.toLowerCase()}). Storelens
              identified <strong>{audit.totalIssues}</strong> issues, including <strong>{audit.criticalIssues}</strong>{" "}
              high-priority fixes. Estimated conversion uplift after addressing the top recommendations: up to{" "}
              <strong>{audit.conversionPotential}%</strong>.
            </p>
          </div>
          {audit.meta?.screenshot && (
            <a
              href={audit.url}
              target="_blank"
              rel="noreferrer"
              className="group block overflow-hidden rounded-xl border border-border bg-surface shadow-card"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={audit.meta.screenshot}
                  alt={`${audit.storeName} homepage screenshot`}
                  className="h-full w-full object-cover object-top transition-transform group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
                <span className="truncate">Homepage preview</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </div>
            </a>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {audit.categories.map((c) => (
            <div key={c.key} className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs font-medium text-muted-foreground">{c.label}</div>
              <div className="mt-1 font-display text-2xl font-semibold">{c.score}</div>
              <div className="text-[11px] text-muted-foreground">
                {c.passed} passed • {c.warnings + c.failed} to fix
              </div>
            </div>
          ))}
        </div>
      </div>


      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold">Optimization plan</h3>
        <p className="text-xs text-muted-foreground">Sorted by priority — work top down for fastest gains.</p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Issue</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Priority</th>
                <th className="py-2 pr-4">Impact</th>
                <th className="py-2 pr-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r, i) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-4 text-muted-foreground">{i + 1}</td>
                  <td className="py-3 pr-4 font-medium">{r.title}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{r.category.toUpperCase()}</td>
                  <td className="py-3 pr-4">
                    <PriorityPill priority={r.priority || "low"} />
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{r.impact || "—"}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{r.timeEstimate || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PriorityPill({ priority }: { priority: "critical" | "high" | "medium" | "low" }) {
  const map = {
    critical: "bg-critical text-critical-foreground",
    high: "bg-critical-soft text-critical",
    medium: "bg-warning-soft text-warning-foreground",
    low: "bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", map[priority])}>
      {priority}
    </span>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof CheckCircle2;
  value: number;
  label: string;
  tone: "success" | "warning" | "critical";
}) {
  const map = {
    success: "text-success bg-success-soft",
    warning: "text-warning-foreground bg-warning-soft",
    critical: "text-critical bg-critical-soft",
  };
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className={cn("mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg", map[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="font-display text-xl font-semibold">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl border border-border bg-card p-6 shadow-card", className)}
    >
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

function InsightCard({
  icon: Icon,
  tone,
  title,
  headline,
  value,
  body,
}: {
  icon: typeof TrendingUp;
  tone: "success" | "critical" | "primary";
  title: string;
  headline: string;
  value: string;
  body: string;
}) {
  const map = {
    success: "bg-success-soft text-success",
    critical: "bg-critical-soft text-critical",
    primary: "bg-primary-soft text-primary",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", map[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-1 font-display text-lg font-semibold">{headline}</div>
      <div className="font-display text-2xl font-semibold text-primary">{value}</div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </motion.div>
  );
}


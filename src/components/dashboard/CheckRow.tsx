import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Clock, TrendingUp, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Check } from "@/lib/audit-types";

const statusMeta = {
  pass: { Icon: CheckCircle2, color: "text-success", bg: "bg-success-soft", label: "Passed" },
  warn: { Icon: AlertTriangle, color: "text-warning-foreground", bg: "bg-warning-soft", label: "Warning" },
  fail: { Icon: XCircle, color: "text-critical", bg: "bg-critical-soft", label: "Critical" },
  info: { Icon: CheckCircle2, color: "text-muted-foreground", bg: "bg-muted", label: "Info" },
} as const;

const priorityStyles = {
  critical: "bg-critical text-critical-foreground",
  high: "bg-critical-soft text-critical",
  medium: "bg-warning-soft text-warning-foreground",
  low: "bg-muted text-muted-foreground",
};

export function CheckRow({ check, index }: { check: Check; index: number }) {
  const meta = statusMeta[check.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <div className="flex items-start gap-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.bg, meta.color)}>
          <meta.Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-foreground">{check.title}</h4>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", meta.bg, meta.color)}>
              {meta.label}
            </span>
            {check.priority && check.status !== "pass" && (
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", priorityStyles[check.priority])}>
                {check.priority} priority
              </span>
            )}
          </div>
          {check.detail && <p className="mt-1 text-sm text-muted-foreground">{check.detail}</p>}
          {check.status !== "pass" && check.recommendation && (
            <div className="mt-3 grid gap-3 rounded-xl bg-surface-muted p-4 sm:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Why it matters</div>
                <p className="mt-1 text-sm text-foreground">{check.why}</p>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recommended fix</div>
                <p className="mt-1 text-sm text-foreground">{check.recommendation}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground sm:col-span-2">
                {check.impact && (
                  <span className="inline-flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Impact: <span className="font-medium text-foreground">{check.impact}</span>
                  </span>
                )}
                {check.difficulty && (
                  <span className="inline-flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" /> Difficulty: <span className="font-medium text-foreground">{check.difficulty}</span>
                  </span>
                )}
                {check.timeEstimate && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Est. time: <span className="font-medium text-foreground">{check.timeEstimate}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

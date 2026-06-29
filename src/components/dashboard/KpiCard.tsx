import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "critical" | "primary";
  trend?: { value: string; positive: boolean } | null;
  delay?: number;
}

const toneStyles: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-foreground",
  critical: "bg-critical-soft text-critical",
};

export function KpiCard({ label, value, hint, icon: Icon, tone = "default", trend, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-elevated"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 font-display text-3xl font-semibold text-foreground">
            {value}
          </div>
        </div>
        {Icon ? (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneStyles[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {(hint || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          {trend && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 font-medium",
                trend.positive ? "bg-success-soft text-success" : "bg-critical-soft text-critical",
              )}
            >
              {trend.value}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </motion.div>
  );
}

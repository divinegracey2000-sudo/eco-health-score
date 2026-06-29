import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  max?: number;
  benchmark?: number;
  delay?: number;
}

export function ProgressBar({ label, value, max = 100, benchmark, delay = 0 }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    value >= 80 ? "bg-success" : value >= 60 ? "bg-warning" : "bg-critical";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {value}
          <span className="text-xs">/100</span>
        </span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
        {benchmark != null && (
          <div
            className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-foreground/40"
            style={{ left: `${benchmark}%` }}
            title={`Industry benchmark: ${benchmark}`}
          />
        )}
      </div>
    </div>
  );
}

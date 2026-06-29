import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { CategoryResult } from "@/lib/audit-types";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--popover-foreground)",
};

export function CategoryRadar({ categories }: { categories: CategoryResult[] }) {
  const data = categories.map((c) => ({
    category: c.label.replace(" & ", " &\n"),
    score: c.score,
    benchmark: c.benchmark,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="category" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
        <Radar
          name="Your store"
          dataKey="score"
          stroke="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Radar
          name="Benchmark"
          dataKey="benchmark"
          stroke="var(--muted-foreground)"
          fill="var(--muted-foreground)"
          fillOpacity={0.05}
          strokeDasharray="4 4"
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function CategoryBars({ categories }: { categories: CategoryResult[] }) {
  const data = categories.map((c) => ({
    name: c.label.split(" ")[0],
    score: c.score,
    benchmark: c.benchmark,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={6}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={[0, 100]} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="score" name="Your score" fill="var(--primary)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="benchmark" name="Industry" fill="var(--muted-foreground)" opacity={0.35} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusDonut({
  passed,
  warnings,
  failed,
}: {
  passed: number;
  warnings: number;
  failed: number;
}) {
  const data = [
    { name: "Passed", value: passed, fill: "var(--success)" },
    { name: "Warnings", value: warnings, fill: "var(--warning)" },
    { name: "Critical", value: failed, fill: "var(--critical)" },
  ];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Pie data={data} dataKey="value" innerRadius={70} outerRadius={105} paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} stroke="var(--card)" strokeWidth={3} />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie({ categories }: { categories: CategoryResult[] }) {
  const data = categories.map((c, i) => ({
    name: c.label,
    value: c.weight,
    fill: COLORS[i % COLORS.length],
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}% weight`} />
        <Pie data={data} dataKey="value" outerRadius={110} label={{ fontSize: 11, fill: "var(--muted-foreground)" }}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} stroke="var(--card)" strokeWidth={2} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

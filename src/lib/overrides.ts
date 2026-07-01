export function normalizeDomain(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/^www\./, "");
  s = s.split("/")[0];
  s = s.split("?")[0];
  s = s.replace(/\/+$/, "");
  return s;
}

export interface StoreOverride {
  domain: string;
  store_name: string | null;
  overall_score: number | null;
  grade: string | null;
  health: string | null;
  total_issues: number | null;
  critical_issues: number | null;
  warnings: number | null;
  opportunities: number | null;
  conversion_potential: number | null;
  seo_score: number | null;
  performance_score: number | null;
  setup_score: number | null;
  retention_score: number | null;
  marketing_score: number | null;
}

export const OVERRIDE_CATEGORY_KEYS: Record<string, keyof StoreOverride> = {
  seo: "seo_score",
  performance: "performance_score",
  setup: "setup_score",
  retention: "retention_score",
  marketing: "marketing_score",
};

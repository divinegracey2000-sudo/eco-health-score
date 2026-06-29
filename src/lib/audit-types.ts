export type CheckStatus = "pass" | "warn" | "fail" | "info";
export type Priority = "low" | "medium" | "high" | "critical";

export interface Check {
  id: string;
  title: string;
  status: CheckStatus;
  detail?: string;
  priority?: Priority;
  category: CategoryKey;
  recommendation?: string;
  why?: string;
  impact?: "Low" | "Medium" | "High";
  difficulty?: "Easy" | "Medium" | "Hard";
  timeEstimate?: string;
}

export type CategoryKey = "seo" | "performance" | "setup" | "retention" | "marketing";

export interface CategoryResult {
  key: CategoryKey;
  label: string;
  weight: number;
  score: number;
  benchmark: number;
  passed: number;
  warnings: number;
  failed: number;
  checks: Check[];
}

export interface AuditResult {
  url: string;
  storeName: string;
  scannedAt: string;
  overallScore: number;
  grade: string;
  health: "Excellent" | "Good" | "Fair" | "Poor" | "Critical";
  totalIssues: number;
  criticalIssues: number;
  warnings: number;
  opportunities: number;
  conversionPotential: number;
  categories: CategoryResult[];
  meta: {
    title?: string;
    description?: string;
    theme?: string;
    themeIsFree?: boolean;
    isShopify: boolean;
    screenshot?: string;
  };
}

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  seo: "SEO Health",
  performance: "Store Performance",
  setup: "Store Setup & Trust",
  retention: "Customer Retention",
  marketing: "Social & Marketing",
};

export const CATEGORY_WEIGHTS: Record<CategoryKey, number> = {
  seo: 25,
  performance: 20,
  setup: 20,
  retention: 20,
  marketing: 15,
};

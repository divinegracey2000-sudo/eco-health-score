import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeDomain, type StoreOverride } from "./overrides";

const numOrNull = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "string" ? Number(v) : v;
    return Number.isFinite(n) ? n : null;
  });

const strOrNull = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s.length ? s : null;
  });

const overrideSchema = z.object({
  domain: z.string().min(3).max(255),
  store_name: strOrNull,
  overall_score: numOrNull,
  grade: strOrNull,
  health: strOrNull,
  total_issues: numOrNull,
  critical_issues: numOrNull,
  warnings: numOrNull,
  opportunities: numOrNull,
  conversion_potential: numOrNull,
  seo_score: numOrNull,
  performance_score: numOrNull,
  setup_score: numOrNull,
  retention_score: numOrNull,
  marketing_score: numOrNull,
});

async function assertAdmin(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin only");
}

export const upsertOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => overrideSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as unknown as ReturnType<typeof createClient>;
    await assertAdmin(supabase, context.userId);

    const domain = normalizeDomain(data.domain);
    if (!domain) throw new Error("Invalid domain");

    const row = {
      domain,
      store_name: data.store_name,
      overall_score: data.overall_score,
      grade: data.grade,
      health: data.health,
      total_issues: data.total_issues,
      critical_issues: data.critical_issues,
      warnings: data.warnings,
      opportunities: data.opportunities,
      conversion_potential: data.conversion_potential,
      seo_score: data.seo_score,
      performance_score: data.performance_score,
      setup_score: data.setup_score,
      retention_score: data.retention_score,
      marketing_score: data.marketing_score,
      created_by: context.userId,
    };

    const { data: saved, error } = await supabase
      .from("store_overrides")
      .upsert(row, { onConflict: "domain" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return saved as unknown as StoreOverride;
  });

export const listOverrides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as unknown as ReturnType<typeof createClient>;
    await assertAdmin(supabase, context.userId);
    const { data, error } = await supabase
      .from("store_overrides")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as StoreOverride[];
  });

export const deleteOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ domain: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as unknown as ReturnType<typeof createClient>;
    await assertAdmin(supabase, context.userId);
    const { error } = await supabase
      .from("store_overrides")
      .delete()
      .eq("domain", normalizeDomain(data.domain));
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as unknown as ReturnType<typeof createClient>;
    const { data } = await supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data, userId: context.userId };
  });

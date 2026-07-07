import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}


export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) return { isAdmin: false, userId: context.userId };
    return { isAdmin: !!data, userId: context.userId };
  });

export const listOverrides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { data, error } = await context.supabase
      .from("store_overrides")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as StoreOverride[];
  });

export const upsertOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => overrideSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const domain = normalizeDomain(data.domain);
    if (!domain) throw new Error("Invalid domain");

    // Fetch existing so blank fields preserve original values
    const { data: existing } = await context.supabase
      .from("store_overrides")
      .select("*")
      .eq("domain", domain)
      .maybeSingle();

    const row: Record<string, unknown> = { domain };
    const fields: (keyof typeof data)[] = [
      "store_name","overall_score","grade","health","total_issues","critical_issues",
      "warnings","opportunities","conversion_potential","seo_score","performance_score",
      "setup_score","retention_score","marketing_score",
    ];
    for (const f of fields) {
      const v = data[f];
      row[f] = v !== null && v !== undefined ? v : (existing?.[f] ?? null);
    }

    const { data: saved, error } = await context.supabase
      .from("store_overrides")
      .upsert(row as never, { onConflict: "domain" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return saved as StoreOverride;
  });

export const deleteOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ domain: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase
      .from("store_overrides")
      .delete()
      .eq("domain", normalizeDomain(data.domain));
    if (error) throw new Error(error.message);
    return { ok: true };
  });

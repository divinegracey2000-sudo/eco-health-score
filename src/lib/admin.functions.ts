import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { createHash, timingSafeEqual } from "node:crypto";
import { normalizeDomain, type StoreOverride } from "./overrides";

const ADMIN_CODE = "87654321";

const sessionConfig = {
  password:
    process.env.ADMIN_SESSION_SECRET ||
    "storelens-admin-session-secret-please-change-me-1234567890",
  name: "storelens-admin",
  maxAge: 60 * 60 * 24 * 7,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  },
};

type AdminSession = { unlocked?: boolean };

function codeMatches(input: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(ADMIN_CODE, "utf8").digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

async function requireAdmin() {
  const session = await useSession<AdminSession>(sessionConfig);
  if (!session.data.unlocked) throw new Error("Forbidden: admin only");
  return session;
}

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

export const unlockAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ code: z.string() }).parse(input))
  .handler(async ({ data }) => {
    if (!codeMatches(data.code)) return { ok: false as const };
    const session = await useSession<AdminSession>(sessionConfig);
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig);
  await session.clear();
  return { ok: true as const };
});

export const checkAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig);
  return { isAdmin: !!session.data.unlocked };
});

export const upsertOverride = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => overrideSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdmin();
    const domain = normalizeDomain(data.domain);
    if (!domain) throw new Error("Invalid domain");

    const { supabase } = await import("@/integrations/supabase/client");
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
    };

    const { data: saved, error } = await supabase.rpc("admin_upsert_store_override", {
      _secret: ADMIN_CODE,
      _row: row as never,
    });
    if (error) throw new Error(error.message);
    return saved as unknown as StoreOverride;
  });

export const listOverrides = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase.rpc("admin_list_store_overrides", {
    _secret: ADMIN_CODE,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as StoreOverride[];
});

export const deleteOverride = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ domain: z.string() }).parse(input))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.rpc("admin_delete_store_override", {
      _secret: ADMIN_CODE,
      _domain: normalizeDomain(data.domain),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });


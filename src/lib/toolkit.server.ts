import Firecrawl from "@mendable/firecrawl-js";
import type { ToolkitService } from "./audit-types";

const TOOLKIT_URL = "https://merchanttoolkit.lovable.app/services";
const STALE_AFTER_MS = 30 * 60 * 1000;

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Parses the live Merchant Toolkit services page. Only entries that are visibly
 * rendered on the page (name + a real link on the toolkit domain) are returned.
 * Nothing is ever invented: an empty or unreadable page yields an empty list.
 */
function parseServices(html: string, markdown: string): ToolkitService[] {
  const out = new Map<string, ToolkitService>();

  // Anchors pointing at a service detail/checkout page on the toolkit domain.
  const anchorRe =
    /<a\b[^>]*href=["']([^"']*\/(?:services|service)\/[^"'#?]+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(html))) {
    const href = m[1];
    const label = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!label || label.length < 3 || label.length > 120) continue;
    const url = href.startsWith("http")
      ? href
      : `https://merchanttoolkit.lovable.app${href.startsWith("/") ? "" : "/"}${href}`;
    if (!/^https:\/\/merchanttoolkit\.lovable\.app\//.test(url)) continue;
    const slug = slugify(label);
    if (!slug || out.has(slug)) continue;
    out.set(slug, { slug, name: label, url, description: null, tags: [] });
  }

  // Markdown link fallback for the same rendered cards.
  const mdRe = /\[([^\]\n]{3,120})\]\((https:\/\/merchanttoolkit\.lovable\.app\/(?:services|service)\/[^)\s]+)\)/g;
  while ((m = mdRe.exec(markdown))) {
    const name = m[1].replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim();
    if (!name) continue;
    const slug = slugify(name);
    if (!slug || out.has(slug)) continue;
    out.set(slug, { slug, name, url: m[2], description: null, tags: [] });
  }

  return [...out.values()].slice(0, 40);
}

export async function syncMerchantToolkit(): Promise<{
  ok: boolean;
  count: number;
  error?: string;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const apiKey = process.env.FIRECRAWL_API_KEY;
  let services: ToolkitService[] = [];
  let error: string | undefined;

  try {
    if (!apiKey) throw new Error("crawler unavailable");
    const fc = new Firecrawl({ apiKey });
    const res: any = await fc.scrape(TOOLKIT_URL, {
      formats: ["html", "markdown"],
      onlyMainContent: false,
      waitFor: 6000,
    });
    const doc = res?.data ?? res;
    services = parseServices(doc?.html ?? doc?.rawHtml ?? "", doc?.markdown ?? "");
  } catch (e) {
    error = e instanceof Error ? e.message : "sync failed";
    console.error("[merchant-toolkit-sync]", error);
  }

  const now = new Date().toISOString();
  if (services.length > 0) {
    await supabaseAdmin
      .from("merchant_toolkit_services")
      .upsert(
        services.map((s) => ({
          slug: s.slug,
          name: s.name,
          url: s.url,
          description: s.description,
          tags: s.tags,
          last_verified_at: now,
        })) as never,
        { onConflict: "slug" },
      );
    // Anything no longer visible on the live page is removed.
    await supabaseAdmin
      .from("merchant_toolkit_services")
      .delete()
      .not("slug", "in", `(${services.map((s) => s.slug).join(",")})`);
  } else if (!error) {
    // Page loaded but published nothing verifiable — drop the stale catalogue.
    await supabaseAdmin.from("merchant_toolkit_services").delete().neq("slug", "");
  }

  await supabaseAdmin.from("merchant_toolkit_sync_state").upsert(
    {
      id: true,
      last_attempt_at: now,
      last_success_at: error ? undefined : now,
      last_error: error ?? null,
      service_count: services.length,
    } as never,
    { onConflict: "id" },
  );

  return { ok: !error, count: services.length, error };
}

/** Reads the catalogue, refreshing it first when the cache is stale. */
export async function getVerifiedToolkitServices(): Promise<ToolkitService[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: state } = await supabaseAdmin
    .from("merchant_toolkit_sync_state")
    .select("last_success_at")
    .eq("id", true)
    .maybeSingle();

  const last = state?.last_success_at ? new Date(state.last_success_at).getTime() : 0;
  if (Date.now() - last > STALE_AFTER_MS) {
    await syncMerchantToolkit().catch(() => undefined);
  }

  const cutoff = new Date(Date.now() - STALE_AFTER_MS * 2).toISOString();
  const { data } = await supabaseAdmin
    .from("merchant_toolkit_services")
    .select("slug,name,url,description,tags")
    .gte("last_verified_at", cutoff)
    .order("name");

  return (data ?? []) as ToolkitService[];
}

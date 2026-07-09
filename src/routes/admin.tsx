import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Trash2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  checkAdmin,
  listOverrides,
  upsertOverride,
  deleteOverride,
} from "@/lib/admin.functions";
import type { StoreOverride } from "@/lib/overrides";
import { normalizeDomain } from "@/lib/overrides";
import storelensLogo from "@/assets/storelens-logo.svg";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Storelens" }] }),
  component: AdminPage,
});

const FIELDS: { key: keyof StoreOverride; label: string; type: "number" | "text" }[] = [
  { key: "store_name", label: "Store name", type: "text" },
  { key: "overall_score", label: "Overall score (0–100)", type: "number" },
  { key: "grade", label: "Grade (A–F)", type: "text" },
  { key: "health", label: "Health label", type: "text" },
  { key: "total_issues", label: "Total issues", type: "number" },
  { key: "critical_issues", label: "Critical issues", type: "number" },
  { key: "warnings", label: "Warnings", type: "number" },
  { key: "opportunities", label: "Opportunities", type: "number" },
  { key: "conversion_potential", label: "Conversion potential (%)", type: "number" },
  { key: "seo_score", label: "SEO score", type: "number" },
  { key: "performance_score", label: "Performance score", type: "number" },
  { key: "setup_score", label: "Setup score", type: "number" },
  { key: "retention_score", label: "Retention score", type: "number" },
  { key: "marketing_score", label: "Marketing score", type: "number" },
];

type FormState = Record<string, string>;

function emptyForm(): FormState {
  const out: FormState = { domain: "" };
  for (const f of FIELDS) out[f.key] = "";
  return out;
}

function AdminPage() {
  const navigate = useNavigate();
  const check = useServerFn(checkAdmin);
  const list = useServerFn(listOverrides);
  const upsert = useServerFn(upsertOverride);
  const remove = useServerFn(deleteOverride);

  const [status, setStatus] = useState<"checking" | "ok" | "forbidden">("checking");
  const [rows, setRows] = useState<StoreOverride[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        navigate({ to: "/auth", search: { redirect: "/admin" } });
        return;
      }
      try {
        const res = await check();
        if (cancelled) return;
        if (!res.isAdmin) {
          setStatus("forbidden");
          return;
        }
        setStatus("ok");
        const r = await list();
        if (!cancelled) setRows(r);
      } catch {
        if (!cancelled) setStatus("forbidden");
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, check, list]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.domain.trim()) {
      toast.error("Enter a store domain");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { domain: form.domain };
      for (const f of FIELDS) {
        const v = form[f.key];
        if (v === "" || v === undefined) continue;
        payload[f.key] = f.type === "number" ? Number(v) : v;
      }
      const saved = await upsert({ data: payload as never });
      toast.success(`Saved override for ${saved.domain}`);
      setForm(emptyForm());
      const r = await list();
      setRows(r);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(domain: string) {
    if (!confirm(`Delete override for ${domain}?`)) return;
    try {
      await remove({ data: { domain } });
      setRows((prev) => prev.filter((r) => r.domain !== domain));
      toast.success("Deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  function loadIntoForm(row: StoreOverride) {
    const next: FormState = { domain: row.domain };
    for (const f of FIELDS) {
      const v = row[f.key];
      next[f.key] = v === null || v === undefined ? "" : String(v);
    }
    setForm(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (status === "checking") {
    return <div className="p-10 text-sm text-muted-foreground">Checking access…</div>;
  }
  if (status === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-xl font-semibold">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account isn't authorised for the admin console.
          </p>
          <Button className="mt-6" onClick={handleSignOut}>Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur">
        <div className="flex items-center gap-2">
          <img src={storelensLogo} alt="Storelens" className="h-7 w-7 rounded-md" />
          <Shield className="h-4 w-4 text-primary" />
          <h1 className="font-display text-lg font-semibold">Admin — Store overrides</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
          <button onClick={handleSignOut} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-base font-semibold">Add or update an override</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the store's domain (e.g. <code className="rounded bg-muted px-1">unbotheredsingles.com</code>).
            Any field you leave blank stays unchanged.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Store domain</Label>
              <Input
                id="domain"
                required
                placeholder="example.com"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              />
              {form.domain && (
                <p className="text-xs text-muted-foreground">Will save as: {normalizeDomain(form.domain) || "—"}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={f.key}>{f.label}</Label>
                  <Input
                    id={f.key}
                    type={f.type === "number" ? "number" : "text"}
                    step="any"
                    placeholder="(leave blank to keep original)"
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save override"}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-base font-semibold">Existing overrides ({rows.length})</h2>
          {rows.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No overrides yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {rows.map((r) => (
                <li key={r.domain} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{r.domain}</div>
                    <div className="text-xs text-muted-foreground">
                      {[
                        r.overall_score !== null && `Overall ${r.overall_score}`,
                        r.total_issues !== null && `Issues ${r.total_issues}`,
                        r.conversion_potential !== null && `Uplift ${r.conversion_potential}%`,
                      ]
                        .filter(Boolean)
                        .join(" • ") || "Custom fields set"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadIntoForm(r)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(r.domain)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

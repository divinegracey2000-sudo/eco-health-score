import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { checkAdmin, unlockAdmin } from "@/lib/admin.functions";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Admin access — Storelens" }] }),
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const check = useServerFn(checkAdmin);
  const unlock = useServerFn(unlockAdmin);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    check().then((r) => {
      if (r.isAdmin) navigate({ to: redirect ?? "/admin" });
    }).catch(() => {});
  }, [navigate, redirect, check]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await unlock({ data: { code } });
      if (!res.ok) {
        toast.error("Incorrect access code");
        return;
      }
      navigate({ to: redirect ?? "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Access failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-8 shadow-card">
        <div>
          <h1 className="font-display text-2xl font-semibold">Admin access</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your access code to open the console.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Access code</Label>
          <Input
            id="code"
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Please wait…" : "Enter"}
        </Button>
      </form>
    </div>
  );
}

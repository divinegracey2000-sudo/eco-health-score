import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BarChart3,
  Search,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Store,
  TrendingUp,
  Users,
  Megaphone,
  Globe2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Storelens — Audit Any Shopify Store in Seconds" },
      {
        name: "description",
        content:
          "Instant Shopify store audits across SEO, performance, trust, retention, and marketing. Actionable scorecards for agencies, consultants, and DTC teams.",
      },
      { property: "og:title", content: "Storelens — Audit Any Shopify Store in Seconds" },
      {
        property: "og:description",
        content:
          "Instant Shopify store audits across SEO, performance, trust, retention, and marketing.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    navigate({ to: "/audit", search: { url: url.trim(), tab: "overview" } });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/storelens-logo.svg" alt="Storelens" className="h-8 w-8 rounded-lg" />
            <span className="font-display text-lg font-semibold">Storelens</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#preview" className="hover:text-foreground">Sample report</a>
          </nav>
          <a
            href="#analyze"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-shadow hover:shadow-glow"
          >
            Run an audit
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="analyze" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-soft via-background to-background" />
        <div className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-card"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Built for ecommerce agencies & operators
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-6xl"
          >
            Analyze any Shopify store
            <span className="block text-primary">in seconds</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground"
          >
            A complete audit across SEO, performance, trust, retention, and marketing — with scorecards,
            charts, and prioritized recommendations.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={onSubmit}
            className="mx-auto mt-10 flex max-w-2xl flex-col items-stretch gap-3 rounded-2xl border border-border bg-card p-2 shadow-elevated sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <Globe2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter Shopify store URL (e.g. allbirds.com)"
                className="w-full bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-glow"
            >
              Analyze Store <ArrowRight className="h-4 w-4" />
            </button>
          </motion.form>
          <div className="mt-4 text-xs text-muted-foreground">
            Try{" "}
            {["allbirds.com", "gymshark.com", "kith.com"].map((d, i) => (
              <button
                key={d}
                onClick={() => setUrl(d)}
                className="ml-1 underline-offset-2 hover:underline"
              >
                {d}
                {i < 2 ? "," : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Preview card */}
        <div id="preview" className="mx-auto -mb-24 max-w-6xl px-6">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-elevated">
            <div className="border-b border-border bg-surface-muted px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-critical/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                <span className="ml-3 text-xs text-muted-foreground">storelens.app/audit?url=allbirds.com</span>
              </div>
            </div>
            <PreviewDashboard />
          </div>
        </div>
      </section>

      <div className="h-24" />

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Five categories. One score. Zero guesswork.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every audit benchmarks your store against industry data and surfaces the highest-impact wins.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { Icon: Search, title: "SEO Health", body: "Meta tags, headings, structured data, sitemap, internal links, and crawlability." },
            { Icon: Zap, title: "Store Performance", body: "Page weight, scripts, lazy loading, third-party tags, and Core Web Vitals signals." },
            { Icon: ShieldCheck, title: "Store Setup & Trust", body: "Policies, theme, navigation, search, trust badges, SSL, and merchandising." },
            { Icon: Users, title: "Customer Retention", body: "Email capture, accounts, loyalty, reviews, recommendations, and back-in-stock." },
            { Icon: Megaphone, title: "Social & Marketing", body: "Pixels, GTM, social channels, sharing, and marketing integrations." },
            { Icon: TrendingUp, title: "Prioritized fixes", body: "Each issue ranks by business impact, difficulty, and estimated time to fix." },
          ].map(({ Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">From URL to executive-ready report in under a minute.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", title: "Enter a URL", body: "Paste any public Shopify storefront — yours or a competitor's." },
              { n: "02", title: "We scan the store", body: "Storelens fetches the homepage, parses the markup, and runs 40+ checks across five categories." },
              { n: "03", title: "Review the dashboard", body: "Interactive scorecards, charts, and prioritized recommendations. Export the full PDF report." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="font-display text-sm font-semibold text-primary">{s.n}</div>
                <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Storelens — Ecommerce intelligence for Shopify
          </div>
          <div>© {new Date().getFullYear()} Storelens</div>
        </div>
      </footer>
    </div>
  );
}

function PreviewDashboard() {
  return (
    <div className="grid gap-4 p-6 sm:grid-cols-4">
      {[
        { l: "Overall Score", v: "82", t: "Grade B" },
        { l: "Issues Found", v: "14", t: "3 critical" },
        { l: "Passed Checks", v: "31", t: "of 45" },
        { l: "Uplift Potential", v: "+18%", t: "conversion" },
      ].map((k) => (
        <div key={k.l} className="rounded-xl border border-border bg-surface p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{k.l}</div>
          <div className="mt-1 font-display text-2xl font-semibold">{k.v}</div>
          <div className="text-xs text-muted-foreground">{k.t}</div>
        </div>
      ))}
      <div className="sm:col-span-4 rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Category scores
        </div>
        <div className="space-y-3">
          {[
            { l: "SEO Health", v: 78 },
            { l: "Performance", v: 64 },
            { l: "Store Setup & Trust", v: 91 },
            { l: "Customer Retention", v: 72 },
            { l: "Social & Marketing", v: 88 },
          ].map((c) => (
            <div key={c.l}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{c.l}</span>
                <span className="tabular-nums text-muted-foreground">{c.v}/100</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={
                    c.v >= 80
                      ? "h-full bg-success"
                      : c.v >= 60
                        ? "h-full bg-warning"
                        : "h-full bg-critical"
                  }
                  style={{ width: `${c.v}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

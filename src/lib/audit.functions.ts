import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Firecrawl from "@mendable/firecrawl-js";
import type {
  AuditResult,
  CategoryKey,
  CategoryResult,
  Check,
  Priority,
} from "./audit-types";
import { CATEGORY_LABELS, CATEGORY_WEIGHTS } from "./audit-types";

const FREE_SHOPIFY_THEMES = [
  "dawn",
  "sense",
  "craft",
  "refresh",
  "studio",
  "crave",
  "colorblock",
  "origin",
  "ride",
  "taste",
  "publisher",
  "spotlight",
];

function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u.replace(/\/+$/, "");
}

function safeFetch(url: string, timeoutMs = 8000): Promise<Response | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal, redirect: "follow" })
    .then((r) => r)
    .catch(() => null)
    .finally(() => clearTimeout(t));
}

interface Ctx {
  url: string;
  origin: string;
  host: string;
  html: string;
  markdown: string;
  links: string[];
  metadata: Record<string, unknown>;
  robotsTxt: string | null;
  sitemapStatus: number | null;
  screenshot?: string;
}

// ----- analyzers -----

function analyzeSeo(ctx: Ctx): CategoryResult {
  const html = ctx.html;
  const checks: Check[] = [];
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? "";
  checks.push({
    id: "seo-title",
    category: "seo",
    title: "Meta Title",
    status: title.length >= 30 && title.length <= 65 ? "pass" : title ? "warn" : "fail",
    detail: title ? `Length ${title.length}: "${title.slice(0, 80)}"` : "No <title> found",
    priority: title ? "medium" : "high",
    why: "Titles drive click-through from search results and are the strongest on-page SEO signal.",
    recommendation:
      title.length === 0
        ? "Add a unique, descriptive <title> tag (30–65 characters) including your brand and main keyword."
        : "Tighten the title to 30–65 characters with primary keyword first and brand at the end.",
    impact: "High",
    difficulty: "Easy",
    timeEstimate: "10–20 min",
  });

  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const desc = descMatch?.[1]?.trim() ?? "";
  checks.push({
    id: "seo-desc",
    category: "seo",
    title: "Meta Description",
    status: desc.length >= 80 && desc.length <= 165 ? "pass" : desc ? "warn" : "fail",
    detail: desc ? `Length ${desc.length}` : "Missing meta description",
    priority: desc ? "medium" : "high",
    why: "A compelling description boosts SERP CTR by up to 30%.",
    recommendation:
      desc.length === 0
        ? "Add a meta description (120–155 characters) with a clear value proposition and call to action."
        : "Rewrite to 120–155 characters with a benefit-led hook and call to action.",
    impact: "High",
    difficulty: "Easy",
    timeEstimate: "15 min",
  });

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  checks.push({
    id: "seo-h1",
    category: "seo",
    title: "Heading Hierarchy (H1)",
    status: h1Count === 1 ? "pass" : h1Count === 0 ? "fail" : "warn",
    detail: `${h1Count} H1 tag${h1Count === 1 ? "" : "s"} detected`,
    priority: h1Count === 0 ? "high" : h1Count > 1 ? "medium" : "low",
    why: "Search engines use a single H1 to understand the page's primary topic.",
    recommendation:
      h1Count === 1
        ? "H1 structure looks healthy. Maintain a clean H1 → H2 → H3 outline."
        : "Use exactly one H1 per page summarizing the main topic.",
    impact: "Medium",
    difficulty: "Easy",
    timeEstimate: "10 min",
  });

  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const imgsWithoutAlt = imgs.filter((t) => !/\balt\s*=\s*["'][^"']*["']/i.test(t)).length;
  const altRatio = imgs.length ? 1 - imgsWithoutAlt / imgs.length : 1;
  checks.push({
    id: "seo-alt",
    category: "seo",
    title: "Image ALT Text Coverage",
    status: altRatio >= 0.9 ? "pass" : altRatio >= 0.6 ? "warn" : "fail",
    detail: `${imgs.length - imgsWithoutAlt}/${imgs.length} images have alt text`,
    priority: altRatio < 0.6 ? "high" : "medium",
    why: "ALT text improves accessibility and lets search engines index your product imagery.",
    recommendation:
      "Add descriptive ALT text to every product and content image. Use 'product name + key attribute' format.",
    impact: "Medium",
    difficulty: "Medium",
    timeEstimate: "1–3 hrs",
  });

  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  checks.push({
    id: "seo-canonical",
    category: "seo",
    title: "Canonical Tag",
    status: hasCanonical ? "pass" : "warn",
    detail: hasCanonical ? "Canonical link found" : "No canonical link detected",
    priority: hasCanonical ? "low" : "medium",
    why: "Canonical tags prevent duplicate-content penalties across variant URLs.",
    recommendation: "Ensure every page emits a self-referencing canonical tag.",
    impact: "Medium",
    difficulty: "Easy",
    timeEstimate: "20 min",
  });

  checks.push({
    id: "seo-robots",
    category: "seo",
    title: "robots.txt",
    status: ctx.robotsTxt ? "pass" : "fail",
    detail: ctx.robotsTxt
      ? `${ctx.robotsTxt.length} bytes — ${/sitemap:/i.test(ctx.robotsTxt) ? "references sitemap" : "no sitemap directive"}`
      : "robots.txt not reachable",
    priority: ctx.robotsTxt ? "low" : "medium",
    why: "robots.txt controls crawling and should reference your sitemap.",
    recommendation: ctx.robotsTxt
      ? "Add a `Sitemap:` directive in robots.txt if missing."
      : "Publish a /robots.txt referencing your sitemap.",
    impact: "Low",
    difficulty: "Easy",
    timeEstimate: "10 min",
  });

  checks.push({
    id: "seo-sitemap",
    category: "seo",
    title: "XML Sitemap",
    status: ctx.sitemapStatus === 200 ? "pass" : "fail",
    detail: ctx.sitemapStatus
      ? `HTTP ${ctx.sitemapStatus}`
      : "Sitemap unreachable",
    priority: ctx.sitemapStatus === 200 ? "low" : "high",
    why: "Sitemaps accelerate indexation of products and collections.",
    recommendation:
      ctx.sitemapStatus === 200
        ? "Sitemap is reachable. Submit it in Google Search Console if not already."
        : "Verify /sitemap.xml is reachable. Shopify auto-generates one — check theme or DNS.",
    impact: "High",
    difficulty: "Easy",
    timeEstimate: "5 min",
  });

  const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  checks.push({
    id: "seo-structured",
    category: "seo",
    title: "Structured Data (JSON-LD)",
    status: hasJsonLd ? "pass" : "warn",
    detail: hasJsonLd ? "JSON-LD detected" : "No JSON-LD structured data",
    priority: hasJsonLd ? "low" : "medium",
    why: "Rich results (price, ratings, availability) come from Product and Organization schema.",
    recommendation: "Add Product, Organization, and BreadcrumbList JSON-LD via theme or a schema app.",
    impact: "High",
    difficulty: "Medium",
    timeEstimate: "1–2 hrs",
  });

  const internalLinks = ctx.links.filter((l) => l.includes(ctx.host)).length;
  checks.push({
    id: "seo-internal-links",
    category: "seo",
    title: "Internal Linking",
    status: internalLinks >= 20 ? "pass" : internalLinks >= 8 ? "warn" : "fail",
    detail: `${internalLinks} internal links on homepage`,
    priority: internalLinks < 8 ? "medium" : "low",
    why: "Internal links distribute authority and help users discover collections.",
    recommendation: "Add featured collections, popular categories, and footer navigation to spread link equity.",
    impact: "Medium",
    difficulty: "Easy",
    timeEstimate: "30 min",
  });

  const hasOg = /<meta[^>]+property=["']og:(title|image)["']/i.test(html);
  checks.push({
    id: "seo-og",
    category: "seo",
    title: "Open Graph Tags",
    status: hasOg ? "pass" : "warn",
    detail: hasOg ? "OG tags present" : "Open Graph tags missing",
    priority: hasOg ? "low" : "medium",
    why: "OG tags control how your store appears when shared on social platforms.",
    recommendation: "Add og:title, og:description, og:image and twitter:card to every shareable page.",
    impact: "Medium",
    difficulty: "Easy",
    timeEstimate: "20 min",
  });

  return scoreCategory("seo", checks);
}

function analyzePerformance(ctx: Ctx): CategoryResult {
  const html = ctx.html;
  const sizeKb = Math.round(html.length / 1024);
  const scripts = (html.match(/<script\b/gi) || []).length;
  const stylesheets = (html.match(/<link[^>]+rel=["']stylesheet["']/gi) || []).length;
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const lazyImgs = imgs.filter((t) => /loading\s*=\s*["']lazy["']/i.test(t)).length;
  const lazyRatio = imgs.length ? lazyImgs / imgs.length : 1;
  const thirdParty = new Set<string>();
  const scriptSrcs = html.match(/<script[^>]+src=["']([^"']+)["']/gi) || [];
  scriptSrcs.forEach((s) => {
    const m = s.match(/src=["']([^"']+)["']/i);
    if (!m) return;
    try {
      const u = new URL(m[1], ctx.origin);
      if (!u.host.includes(ctx.host) && !u.host.includes("cdn.shopify.com")) {
        thirdParty.add(u.host);
      }
    } catch {}
  });

  const checks: Check[] = [];

  checks.push({
    id: "perf-html-size",
    category: "performance",
    title: "Homepage HTML Size",
    status: sizeKb <= 250 ? "pass" : sizeKb <= 500 ? "warn" : "fail",
    detail: `${sizeKb} KB of HTML`,
    priority: sizeKb > 500 ? "high" : "medium",
    why: "Large HTML payloads delay First Contentful Paint, especially on mobile networks.",
    recommendation: "Trim hidden product sections, reduce inline JSON, and defer non-critical sections.",
    impact: "High",
    difficulty: "Medium",
    timeEstimate: "2–4 hrs",
  });

  checks.push({
    id: "perf-scripts",
    category: "performance",
    title: "JavaScript Footprint",
    status: scripts <= 20 ? "pass" : scripts <= 40 ? "warn" : "fail",
    detail: `${scripts} <script> tags on the page`,
    priority: scripts > 40 ? "high" : "medium",
    why: "Each script adds parse and execution cost, slowing Time to Interactive.",
    recommendation: "Audit installed Shopify apps. Remove unused apps and defer non-essential scripts.",
    impact: "High",
    difficulty: "Medium",
    timeEstimate: "1–2 hrs",
  });

  checks.push({
    id: "perf-css",
    category: "performance",
    title: "CSS Files",
    status: stylesheets <= 5 ? "pass" : stylesheets <= 10 ? "warn" : "fail",
    detail: `${stylesheets} stylesheet links`,
    priority: stylesheets > 10 ? "medium" : "low",
    why: "Each render-blocking stylesheet delays first paint.",
    recommendation: "Combine stylesheets, inline critical CSS, and defer the rest.",
    impact: "Medium",
    difficulty: "Medium",
    timeEstimate: "1 hr",
  });

  checks.push({
    id: "perf-lazy",
    category: "performance",
    title: "Image Lazy Loading",
    status: lazyRatio >= 0.7 ? "pass" : lazyRatio >= 0.3 ? "warn" : "fail",
    detail: `${lazyImgs}/${imgs.length} images use loading="lazy"`,
    priority: lazyRatio < 0.3 ? "high" : "medium",
    why: "Lazy loading defers off-screen images, dramatically improving LCP.",
    recommendation: "Add loading=\"lazy\" to all below-the-fold images and use Shopify's responsive image filters.",
    impact: "High",
    difficulty: "Easy",
    timeEstimate: "30–60 min",
  });

  checks.push({
    id: "perf-3p",
    category: "performance",
    title: "Third-Party Scripts",
    status: thirdParty.size <= 5 ? "pass" : thirdParty.size <= 10 ? "warn" : "fail",
    detail: `${thirdParty.size} third-party script domains`,
    priority: thirdParty.size > 10 ? "high" : "medium",
    why: "Third-party tags (analytics, chat, reviews) often dominate main-thread cost.",
    recommendation: "Audit pixels, chat widgets, and review apps. Remove duplicates and load async/defer.",
    impact: "High",
    difficulty: "Medium",
    timeEstimate: "1–2 hrs",
  });

  checks.push({
    id: "perf-image-opt",
    category: "performance",
    title: "Image Optimization",
    status: imgs.length === 0 ? "warn" : imgs.length <= 60 ? "pass" : "warn",
    detail: `${imgs.length} <img> tags on homepage`,
    priority: imgs.length > 60 ? "medium" : "low",
    why: "Excess images bloat page weight and CPU decode time.",
    recommendation: "Use Shopify's WebP variants and limit homepage to 30–40 essential images.",
    impact: "Medium",
    difficulty: "Easy",
    timeEstimate: "30 min",
  });

  checks.push({
    id: "perf-mobile",
    category: "performance",
    title: "Mobile Viewport",
    status: /<meta[^>]+name=["']viewport["']/i.test(html) ? "pass" : "fail",
    detail: /<meta[^>]+name=["']viewport["']/i.test(html)
      ? "Viewport meta present"
      : "Missing viewport meta",
    priority: "high",
    why: "Without a viewport meta, mobile rendering breaks and Core Web Vitals collapse.",
    recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> in theme.',
    impact: "High",
    difficulty: "Easy",
    timeEstimate: "5 min",
  });

  return scoreCategory("performance", checks);
}

function analyzeSetup(ctx: Ctx): CategoryResult {
  const html = ctx.html;
  const checks: Check[] = [];

  // Shopify detection
  const isShopify =
    /cdn\.shopify\.com/i.test(html) ||
    /Shopify\.theme/i.test(html) ||
    /<meta[^>]+name=["']shopify-/i.test(html);

  // Theme detection
  let theme: string | undefined;
  const themeMatch =
    html.match(/Shopify\.theme\s*=\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i) ||
    html.match(/"theme_name"\s*:\s*"([^"]+)"/i);
  if (themeMatch) theme = themeMatch[1];
  const themeIsFree =
    !!theme && FREE_SHOPIFY_THEMES.some((t) => theme!.toLowerCase().includes(t));

  ctx.metadata.isShopify = isShopify;
  ctx.metadata.theme = theme;
  ctx.metadata.themeIsFree = themeIsFree;

  checks.push({
    id: "setup-shopify",
    category: "setup",
    title: "Shopify Platform Detected",
    status: isShopify ? "pass" : "warn",
    detail: isShopify ? "Confirmed Shopify storefront" : "Could not confirm Shopify (proxy/headless?)",
    priority: "low",
    why: "Confirms platform-specific checks apply.",
    recommendation: isShopify ? "No action needed." : "Verify the URL or check headless setup.",
    impact: "Low",
    difficulty: "Easy",
    timeEstimate: "—",
  });

  checks.push({
    id: "setup-theme",
    category: "setup",
    title: "Theme",
    status: theme ? (themeIsFree ? "warn" : "pass") : "info",
    detail: theme
      ? `${theme} ${themeIsFree ? "(free Shopify theme)" : "(premium / custom theme)"}`
      : "Theme name not exposed",
    priority: themeIsFree ? "low" : "low",
    why: "Free themes like Dawn are excellent starting points but may limit advanced merchandising blocks without customisation.",
    recommendation: themeIsFree
      ? "Free themes work great — invest in custom sections, app blocks, or upgrade only if you hit clear limits."
      : "Premium/custom theme detected. Keep it updated and audit unused sections.",
    impact: "Low",
    difficulty: "Medium",
    timeEstimate: "—",
  });

  checks.push({
    id: "setup-ssl",
    category: "setup",
    title: "SSL / HTTPS",
    status: ctx.url.startsWith("https://") ? "pass" : "fail",
    detail: ctx.url.startsWith("https://") ? "HTTPS active" : "Site not served over HTTPS",
    priority: ctx.url.startsWith("https://") ? "low" : "critical",
    why: "HTTPS is required for trust, SEO, and modern browsers.",
    recommendation: "Force HTTPS at the Shopify domain level. Shopify provides free SSL automatically.",
    impact: "High",
    difficulty: "Easy",
    timeEstimate: "5 min",
  });

  const linkLower = ctx.links.map((l) => l.toLowerCase()).join("\n");

  const pageChecks: Array<[string, RegExp, string]> = [
    ["Contact Page", /\/pages\/contact|\/contact/i, "Provide a public way to reach support."],
    ["About Page", /\/pages\/about|\/about/i, "About pages build trust and brand connection."],
    ["FAQ Page", /\/pages\/faq|\/faqs|\/help/i, "FAQ reduces support load and pre-sale doubts."],
    ["Refund / Return Policy", /\/policies\/refund-policy|\/policies\/return/i, "Required by Shopify Payments and a major trust signal."],
    ["Shipping Policy", /\/policies\/shipping-policy|\/pages\/shipping/i, "Sets buyer expectations and reduces support tickets."],
    ["Privacy Policy", /\/policies\/privacy-policy/i, "Required by GDPR/CCPA."],
    ["Terms of Service", /\/policies\/terms-of-service/i, "Limits liability and required by most payment providers."],
  ];

  for (const [name, pattern, why] of pageChecks) {
    const present = pattern.test(linkLower) || pattern.test(html);
    checks.push({
      id: "setup-" + name.toLowerCase().replace(/[^a-z]+/g, "-"),
      category: "setup",
      title: name,
      status: present ? "pass" : "fail",
      detail: present ? "Linked from homepage" : "Not detected in footer/header",
      priority: present ? "low" : "high",
      why,
      recommendation: present
        ? "Good — ensure the page is clear and up to date."
        : `Publish a ${name} and link it from the global footer.`,
      impact: "High",
      difficulty: "Easy",
      timeEstimate: "30 min",
    });
  }

  const hasSearch =
    /<form[^>]+action=["'][^"']*\/search/i.test(html) ||
    /name=["']q["']/i.test(html);
  checks.push({
    id: "setup-search",
    category: "setup",
    title: "Site Search",
    status: hasSearch ? "pass" : "warn",
    detail: hasSearch ? "Search form detected" : "No search form found",
    priority: hasSearch ? "low" : "medium",
    why: "Search converts intent into discovery and improves average order value.",
    recommendation: "Surface predictive search in the header. Consider an app like Searchanise or Boost for richer results.",
    impact: "Medium",
    difficulty: "Easy",
    timeEstimate: "20 min",
  });

  const hasNav = /<nav\b/i.test(html) || /\/collections\//i.test(linkLower);
  checks.push({
    id: "setup-nav",
    category: "setup",
    title: "Main Navigation",
    status: hasNav ? "pass" : "warn",
    detail: hasNav ? "Primary navigation present" : "No clear collection navigation detected",
    priority: hasNav ? "low" : "high",
    why: "Clear navigation is the #1 driver of catalog discoverability.",
    recommendation: "Expose 4–7 top collections in the main nav with a mega-menu for sub-categories.",
    impact: "High",
    difficulty: "Medium",
    timeEstimate: "1 hr",
  });

  const trustBadges =
    /trust|secure|guarantee|verified|norton|mcafee|trustpilot|google customer reviews/i.test(html);
  checks.push({
    id: "setup-trust",
    category: "setup",
    title: "Trust Badges & Signals",
    status: trustBadges ? "pass" : "warn",
    detail: trustBadges ? "Trust references detected" : "No visible trust badges",
    priority: trustBadges ? "low" : "medium",
    why: "Trust badges meaningfully improve checkout conversion for first-time visitors.",
    recommendation: "Add payment icons, secure-checkout badges, and review-platform widgets near the CTA.",
    impact: "Medium",
    difficulty: "Easy",
    timeEstimate: "30 min",
  });

  return scoreCategory("setup", checks);
}

function analyzeRetention(ctx: Ctx): CategoryResult {
  const html = ctx.html.toLowerCase();
  const links = ctx.links.map((l) => l.toLowerCase()).join("\n");
  const checks: Check[] = [];

  const emailCapture =
    /klaviyo|omnisend|privy|mailchimp|sumo|optimonk|justuno|wisepops/.test(html) ||
    /newsletter|subscribe|email signup|join our list/.test(html);
  checks.push({
    id: "ret-email",
    category: "retention",
    title: "Email Capture / Newsletter",
    status: emailCapture ? "pass" : "fail",
    detail: emailCapture ? "Email capture detected" : "No email capture mechanism found",
    priority: emailCapture ? "low" : "high",
    why: "Email subscribers are the highest-LTV channel for ecommerce.",
    recommendation:
      "Add a welcome popup with a clear incentive (e.g. 10% off) and an embedded footer signup.",
    impact: "High",
    difficulty: "Easy",
    timeEstimate: "30–60 min",
  });

  const popup = /popup|modal|overlay|exit-intent|exit_intent/.test(html);
  checks.push({
    id: "ret-popup",
    category: "retention",
    title: "Welcome / Exit-Intent Popup",
    status: popup ? "pass" : "warn",
    detail: popup ? "Popup logic detected" : "No popup detected",
    priority: popup ? "low" : "medium",
    why: "Exit-intent popups recover 10–15% of abandoning visitors.",
    recommendation: "Trigger a discount popup on exit-intent or after 15 seconds on page.",
    impact: "High",
    difficulty: "Easy",
    timeEstimate: "30 min",
  });

  const accounts = /\/account/i.test(links) || /customer account|sign in|log in/.test(html);
  checks.push({
    id: "ret-accounts",
    category: "retention",
    title: "Customer Accounts",
    status: accounts ? "pass" : "warn",
    detail: accounts ? "Customer accounts enabled" : "No customer account link found",
    priority: accounts ? "low" : "medium",
    why: "Accounts enable order history, saved carts, and repeat-purchase flows.",
    recommendation: "Enable customer accounts in Shopify settings and link them from the header.",
    impact: "Medium",
    difficulty: "Easy",
    timeEstimate: "10 min",
  });

  const wishlist = /wishlist|favorites|favourite/.test(html);
  checks.push({
    id: "ret-wishlist",
    category: "retention",
    title: "Wishlist",
    status: wishlist ? "pass" : "warn",
    detail: wishlist ? "Wishlist feature present" : "No wishlist detected",
    priority: "low",
    why: "Wishlists power back-in-stock and price-drop emails.",
    recommendation: "Install a wishlist app (Wishlist Plus, Smart Wishlist) connected to your ESP.",
    impact: "Medium",
    difficulty: "Easy",
    timeEstimate: "30 min",
  });

  const loyalty = /smile\.io|loyaltylion|yotpo loyalty|rewards|loyalty program/.test(html);
  checks.push({
    id: "ret-loyalty",
    category: "retention",
    title: "Loyalty / Rewards Program",
    status: loyalty ? "pass" : "warn",
    detail: loyalty ? "Loyalty references detected" : "No loyalty program detected",
    priority: "medium",
    why: "Loyalty programs lift repeat-purchase rate by 20%+.",
    recommendation: "Launch a points-based program with Smile.io or LoyaltyLion.",
    impact: "High",
    difficulty: "Medium",
    timeEstimate: "2–3 hrs",
  });

  const referral = /referral|refer a friend|invite friends/.test(html);
  checks.push({
    id: "ret-referral",
    category: "retention",
    title: "Referral Program",
    status: referral ? "pass" : "warn",
    detail: referral ? "Referral references detected" : "No referral program detected",
    priority: "low",
    why: "Referrals deliver the lowest-CAC customers in ecommerce.",
    recommendation: "Add a referral program (ReferralCandy, Friendbuy).",
    impact: "Medium",
    difficulty: "Medium",
    timeEstimate: "1–2 hrs",
  });

  const recs = /recommended|you may also like|related products|recently viewed/.test(html);
  checks.push({
    id: "ret-recs",
    category: "retention",
    title: "Product Recommendations",
    status: recs ? "pass" : "warn",
    detail: recs ? "Recommendation sections detected" : "No cross-sell sections detected",
    priority: "medium",
    why: "Recommendations drive 10–30% of ecommerce revenue.",
    recommendation: "Enable Shopify's product recommendation API blocks on product and cart pages.",
    impact: "High",
    difficulty: "Easy",
    timeEstimate: "30 min",
  });

  const bis = /back in stock|notify me|restock/.test(html);
  checks.push({
    id: "ret-bis",
    category: "retention",
    title: "Back-in-Stock Notifications",
    status: bis ? "pass" : "warn",
    detail: bis ? "Back-in-stock detected" : "No back-in-stock detected",
    priority: "low",
    why: "Captures demand for sold-out SKUs you'd otherwise lose.",
    recommendation: "Install a back-in-stock app (Klaviyo native, Back in Stock).",
    impact: "Medium",
    difficulty: "Easy",
    timeEstimate: "20 min",
  });

  const reviews = /yotpo|judge\.me|loox|stamped|okendo|reviews\.io|trustpilot|product-review/.test(html);
  checks.push({
    id: "ret-reviews",
    category: "retention",
    title: "Product Reviews / UGC",
    status: reviews ? "pass" : "warn",
    detail: reviews ? "Review platform detected" : "No review platform detected",
    priority: "medium",
    why: "Reviews increase conversion by 20–40% on product pages.",
    recommendation: "Install Judge.me, Loox, or Okendo and trigger post-purchase review requests.",
    impact: "High",
    difficulty: "Easy",
    timeEstimate: "1 hr",
  });

  return scoreCategory("retention", checks);
}

function analyzeMarketing(ctx: Ctx): CategoryResult {
  const html = ctx.html;
  const linksJoined = ctx.links.join("\n") + "\n" + html;

  const socials = [
    { name: "Facebook", pattern: /facebook\.com\/(?!sharer|tr\?)[^"'\s)]+/i },
    { name: "Instagram", pattern: /instagram\.com\/[^"'\s)]+/i },
    { name: "TikTok", pattern: /tiktok\.com\/@?[^"'\s)]+/i },
    { name: "Pinterest", pattern: /pinterest\.[a-z.]+\/[^"'\s)]+/i },
    { name: "YouTube", pattern: /youtube\.com\/(channel|@|c\/|user\/)[^"'\s)]+/i },
    { name: "LinkedIn", pattern: /linkedin\.com\/(company|in)\/[^"'\s)]+/i },
    { name: "X (Twitter)", pattern: /(twitter\.com|x\.com)\/(?!intent|share)[^"'\s)]+/i },
  ];

  const checks: Check[] = [];
  let present = 0;
  for (const s of socials) {
    const found = s.pattern.test(linksJoined);
    if (found) present++;
    checks.push({
      id: "mkt-" + s.name.toLowerCase().replace(/[^a-z]+/g, ""),
      category: "marketing",
      title: `${s.name} Link`,
      status: found ? "pass" : "warn",
      detail: found ? "Linked from store" : "Not linked",
      priority: "low",
      why: `${s.name} is a major discovery channel for ecommerce brands.`,
      recommendation: found
        ? "Verify the link opens in a new tab and points to the active account."
        : `Add a ${s.name} link in the footer if your brand is active there.`,
      impact: "Medium",
      difficulty: "Easy",
      timeEstimate: "5 min",
    });
  }

  const pixels =
    /fbq\(|facebook\.net\/.+\/fbevents|gtag\(|googletagmanager|tiktok pixel|tiktok\.com\/i18n\/pixel|pinterest tag|snap pixel/i.test(
      html,
    );
  checks.push({
    id: "mkt-pixels",
    category: "marketing",
    title: "Marketing Pixels / Tag Manager",
    status: pixels ? "pass" : "fail",
    detail: pixels ? "Pixel(s) detected" : "No marketing pixels detected",
    priority: pixels ? "low" : "high",
    why: "Without pixels you cannot retarget visitors or measure paid campaigns.",
    recommendation: "Install Meta Pixel, GA4, TikTok Pixel via GTM or Shopify channels.",
    impact: "High",
    difficulty: "Easy",
    timeEstimate: "30 min",
  });

  const sharing = /addthis|sharethis|share-button|sharer\.php|twitter\.com\/intent/i.test(html);
  checks.push({
    id: "mkt-sharing",
    category: "marketing",
    title: "Social Sharing Buttons",
    status: sharing ? "pass" : "warn",
    detail: sharing ? "Sharing UI detected" : "No social share buttons on product/homepage",
    priority: "low",
    why: "Sharing extends organic reach with zero ad spend.",
    recommendation: "Add lightweight share buttons on product pages.",
    impact: "Low",
    difficulty: "Easy",
    timeEstimate: "15 min",
  });

  checks.push({
    id: "mkt-social-proof",
    category: "marketing",
    title: "Social Proof",
    status: present >= 3 ? "pass" : present >= 1 ? "warn" : "fail",
    detail: `${present} of 7 major social channels linked`,
    priority: present === 0 ? "high" : "medium",
    why: "Visible social presence signals legitimacy and active brand.",
    recommendation:
      "Link at least your 2–3 most active social accounts from the footer. Skip channels you don't actively post on.",
    impact: "Medium",
    difficulty: "Easy",
    timeEstimate: "10 min",
  });

  return scoreCategory("marketing", checks);
}

// ----- scoring -----

function scoreCategory(key: CategoryKey, checks: Check[]): CategoryResult {
  let total = 0;
  let weight = 0;
  let passed = 0;
  let warnings = 0;
  let failed = 0;
  for (const c of checks) {
    if (c.status === "info") continue;
    const w = c.priority === "critical" ? 4 : c.priority === "high" ? 3 : c.priority === "medium" ? 2 : 1;
    weight += w;
    if (c.status === "pass") {
      total += w;
      passed++;
    } else if (c.status === "warn") {
      total += w * 0.5;
      warnings++;
    } else {
      failed++;
    }
  }
  const score = weight ? Math.round((total / weight) * 100) : 100;
  const benchmarkMap: Record<CategoryKey, number> = {
    seo: 72,
    performance: 65,
    setup: 78,
    retention: 60,
    marketing: 68,
  };
  return {
    key,
    label: CATEGORY_LABELS[key],
    weight: CATEGORY_WEIGHTS[key],
    score,
    benchmark: benchmarkMap[key],
    passed,
    warnings,
    failed,
    checks,
  };
}

function gradeFor(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function healthFor(score: number): AuditResult["health"] {
  if (score >= 85) return "Excellent";
  if (score >= 72) return "Good";
  if (score >= 58) return "Fair";
  if (score >= 40) return "Poor";
  return "Critical";
}

// ----- server fn -----

const inputSchema = z.object({
  url: z.string().min(3).max(500),
});

export const runAudit = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error("Audit engine not configured. Missing Firecrawl credentials.");
    }
    const url = normalizeUrl(data.url);
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("Invalid URL");
    }
    const origin = parsed.origin;
    const host = parsed.host.replace(/^www\./, "");

    const firecrawl = new Firecrawl({ apiKey });

    let html = "";
    let markdown = "";
    let links: string[] = [];
    let metadata: Record<string, unknown> = {};
    let screenshot: string | undefined;

    try {
      const res: any = await firecrawl.scrape(url, {
        formats: ["html", "markdown", "links", "screenshot"],
        onlyMainContent: false,
        waitFor: 1500,
      });
      const doc = res?.data ?? res;
      html = doc?.html ?? doc?.rawHtml ?? "";
      markdown = doc?.markdown ?? "";
      links = Array.isArray(doc?.links) ? doc.links : [];
      metadata = doc?.metadata ?? {};
      screenshot = doc?.screenshot;
    } catch (e: any) {
      throw new Error(
        "Could not reach the store. Verify the URL is correct and the site is publicly accessible.",
      );
    }

    if (!html || html.length < 500) {
      throw new Error("Store returned an empty or blocked page. Try the canonical homepage URL.");
    }

    const [robotsRes, sitemapRes] = await Promise.all([
      safeFetch(`${origin}/robots.txt`),
      safeFetch(`${origin}/sitemap.xml`),
    ]);
    const robotsTxt = robotsRes && robotsRes.ok ? await robotsRes.text().catch(() => null) : null;
    const sitemapStatus = sitemapRes ? sitemapRes.status : null;

    const ctx: Ctx = {
      url,
      origin,
      host,
      html,
      markdown,
      links,
      metadata,
      robotsTxt,
      sitemapStatus,
      screenshot,
    };

    const categories: CategoryResult[] = [
      analyzeSeo(ctx),
      analyzePerformance(ctx),
      analyzeSetup(ctx),
      analyzeRetention(ctx),
      analyzeMarketing(ctx),
    ];

    const overall = Math.round(
      categories.reduce((sum, c) => sum + (c.score * c.weight) / 100, 0),
    );
    const totalIssues = categories.reduce((s, c) => s + c.warnings + c.failed, 0);
    const criticalIssues = categories.reduce(
      (s, c) => s + c.checks.filter((k) => k.status === "fail" && (k.priority === "critical" || k.priority === "high")).length,
      0,
    );
    const warnings = categories.reduce((s, c) => s + c.warnings, 0);
    const opportunities = categories.reduce(
      (s, c) => s + c.checks.filter((k) => k.status !== "pass" && k.status !== "info").length,
      0,
    );

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
    const storeName =
      (titleMatch?.[1] ?? "")
        .split(/[|–—-]/)[0]
        .trim()
        .slice(0, 60) || host;

    const conversionPotential = Math.min(
      35,
      Math.round(((100 - overall) * 0.35 + warnings * 0.4 + criticalIssues * 1.2) * 10) / 10,
    );

    const result: AuditResult = {
      url,
      storeName,
      scannedAt: new Date().toISOString(),
      overallScore: overall,
      grade: gradeFor(overall),
      health: healthFor(overall),
      totalIssues,
      criticalIssues,
      warnings,
      opportunities,
      conversionPotential,
      categories,
      meta: {
        title: titleMatch?.[1],
        description: descMatch?.[1],
        theme: ctx.metadata.theme as string | undefined,
        themeIsFree: ctx.metadata.themeIsFree as boolean | undefined,
        isShopify: !!ctx.metadata.isShopify,
        screenshot,
      },
    };

    return result;
  });

// ============================================================================
// src/app/not-found.tsx
// ----------------------------------------------------------------------------
// Root 404 — shown for routes that do not match any locale path. It renders
// OUTSIDE the locale provider and does not load the site CSS, so it is fully
// self-contained: its own <html>/<body>, an inline <style> block, and a small
// client island (NotFoundClient) for the dynamic parts. Built once to
// out/404.html and served by the worker on unmatched paths.
//
// The random "you seem lost" pool (live tools + every article) is assembled
// here at build time and handed to the client, which picks one per visit.
// ============================================================================

import { tools } from "@/config/tools";
// This route renders outside [locale]/layout and is deliberately
// self-contained (its own <html>/<body> below). Its styles live in a real
// stylesheet so the check-css-coverage guard can see them; importing it here
// scopes the CSS to this page only - the site theme is not loaded.
import "./not-found.css";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CATALOGUE } from "@/content/catalogue/catalogue";
import { getAllArticles } from "@/lib/learn";
import { LOCALES } from "@/i18n/locales";
import NotFoundClient from "@/components/NotFoundClient";

export default function NotFound() {
  // Build the random pool at build time: live tools (valid hrefs from the tool
  // registry, display names from the catalogue) plus every article.
  const nameBySlug = new Map(CATALOGUE.map((c) => [c.slug, c.name]));
  const toolPool = tools
    .filter((t) => t.available)
    .map((t) => ({ k: "tool" as const, p: t.href, l: nameBySlug.get(t.id) ?? t.id }));
  const articlePool = getAllArticles("en").map((a) => ({ k: "learn" as const, p: `/learn/${a.slug}`, l: a.title }));
  const pool = [...toolPool, ...articlePool];
  const locales = LOCALES.map((l) => l.code);

  // Localized UI strings for the 404 chrome, all 16 locales. Read at build
  // time from the message catalogs (one small namespace each, ~14 keys), so
  // the client can pick the visitor's language after it resolves the locale
  // from window.location - a static export cannot know it server-side. The
  // Guru lines, the famous-errors console, and the BOFH excuses stay in
  // English on purpose: they are verbatim cultural and technical artifacts.
  const msgs: Record<string, Record<string, string>> = {};
  for (const l of locales) {
    try {
      const raw = JSON.parse(readFileSync(join(process.cwd(), "src/i18n/messages", l + ".json"), "utf8"));
      if (raw.notFound) msgs[l] = raw.notFound;
    } catch {
      /* locale file unreadable: en fallback applies client-side */
    }
  }

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#020617",
          color: "#f8fafc",
          minHeight: "100vh",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <NotFoundClient pool={pool} locales={locales} msgs={msgs} />
      </body>
    </html>
  );
}

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
import { CATALOGUE } from "@/content/catalogue/catalogue";
import { getAllArticles } from "@/lib/learn";
import { LOCALES } from "@/i18n/locales";
import NotFoundClient from "@/components/NotFoundClient";

const NF_CSS = `
* { box-sizing: border-box; }
.mono { font-family: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace; }
.nf-root { max-width: 720px; margin: 0 auto; padding: 3rem 1.25rem 4rem; display: flex; flex-direction: column; align-items: center; gap: 1.7rem; text-align: center; }
.nf-head { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; }
.nf-404 { font-size: clamp(4.5rem, 18vw, 8rem); font-weight: 800; line-height: 1; letter-spacing: 0.04em; background: linear-gradient(180deg, #22d3ee, #7c9cff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 0 40px rgba(34,211,238,0.22); }
.nf-sub { font-size: 1.4rem; font-weight: 600; color: #e6ecff; }
.nf-path { font-size: 0.82rem; color: #9aa6cc; margin-top: 0.5rem; border: 1px solid #1b2540; border-radius: 999px; padding: 0.35rem 0.85rem; background: rgba(255,255,255,0.02); word-break: break-all; }
.nf-dim { color: #5f6b91; }
.nf-arrow { color: #5f6b91; }
.nf-status { color: #f59e0b; }
.nf-quip { font-size: 1.15rem; font-weight: 600; color: #f59e0b; font-style: italic; margin: 0; }
.guru { width: 100%; max-width: 560px; background: #000; border: 3px solid #e23b3b; border-radius: 4px; padding: 1rem 1.1rem; color: #ff4d4d; text-align: center; animation: guru-blink 1.1s steps(1) infinite; }
.guru-l1 { font-size: 0.9rem; margin-bottom: 0.5rem; }
.guru-l2 { font-size: 1.05rem; font-weight: 700; letter-spacing: 0.02em; }
.guru-l3 { font-size: 0.76rem; color: #ff8a8a; margin-top: 0.5rem; }
@keyframes guru-blink { 0%,100% { border-color: #e23b3b; } 50% { border-color: #6f0f0f; } }
.nf-console { width: 100%; max-width: 560px; background: #0a0e1a; border: 1px solid #1b2540; border-radius: 10px; padding: 0.85rem 1rem; text-align: left; font-size: 0.8rem; line-height: 1.85; color: #c3ccea; }
.nf-cline { display: flex; gap: 0.55rem; align-items: baseline; }
.nf-cpre { flex: 0 0 3ch; text-align: right; font-weight: 700; font-size: 0.72rem; }
.nf-cpre-info { color: #22d3ee; }
.nf-cpre-warn { color: #f59e0b; }
.nf-cpre-err { color: #ff5555; }
.nf-ctext { color: #d7def5; }
.nf-bofh { width: 100%; max-width: 560px; text-align: left; background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.35); border-radius: 10px; padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 0.45rem; }
.nf-bofh-intro { margin: 0; font-size: 0.8rem; color: #9aa6cc; }
.nf-bofh-link { color: #f59e0b; text-decoration: underline; text-underline-offset: 2px; }
.nf-bofh-link:hover { color: #fbbf24; }
.nf-bofh-excuse { margin: 0; font-size: 0.98rem; font-weight: 600; color: #f59e0b; line-height: 1.5; }
.nf-bofh-wait { color: #5f6b91; font-weight: 400; font-style: italic; }
.nf-bofh-again { align-self: flex-start; margin-top: 0.15rem; font-size: 0.78rem; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 7px; background: transparent; color: #9aa6cc; border: 1px solid #1b2540; cursor: pointer; font-family: inherit; }
.nf-bofh-again:hover { color: #e6ecff; border-color: #33415c; }
.nf-lost { width: 100%; max-width: 560px; display: flex; flex-direction: column; align-items: center; gap: 0.85rem; margin-top: 0.4rem; }
.nf-lost-title { font-size: 0.95rem; color: #9aa6cc; margin: 0; }
.nf-pick { width: 100%; display: flex; align-items: center; gap: 0.7rem; text-decoration: none; background: rgba(34,211,238,0.05); border: 1px solid rgba(34,211,238,0.27); border-radius: 12px; padding: 0.85rem 1rem; transition: border-color 0.15s, background 0.15s, transform 0.15s; }
.nf-pick:hover { border-color: #22d3ee; background: rgba(34,211,238,0.1); transform: translateY(-1px); }
.nf-pick-empty { justify-content: center; color: #5f6b91; }
.nf-badge { flex: 0 0 auto; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.08em; padding: 0.2rem 0.45rem; border-radius: 5px; }
.nf-badge-tool { background: rgba(34,211,238,0.13); color: #22d3ee; }
.nf-badge-learn { background: rgba(245,158,11,0.13); color: #f59e0b; }
.nf-pick-label { flex: 1 1 auto; text-align: left; color: #f8fafc; font-weight: 600; font-size: 0.95rem; }
.nf-pick-arrow { flex: 0 0 auto; color: #22d3ee; font-size: 1.1rem; }
.nf-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; margin-top: 0.25rem; }
.nf-btn { text-decoration: none; font-size: 0.9rem; font-weight: 600; padding: 0.55rem 1.1rem; border-radius: 8px; background: linear-gradient(90deg, #22d3ee, #38bdf8); color: #021018; border: 1px solid transparent; cursor: pointer; font-family: inherit; }
.nf-btn:hover { filter: brightness(1.08); }
.nf-btn-ghost { background: transparent; color: #9aa6cc; border: 1px solid #1b2540; }
.nf-btn-ghost:hover { color: #e6ecff; border-color: #33415c; filter: none; }
@media (prefers-reduced-motion: reduce) { .guru { animation: none; } .nf-pick:hover { transform: none; } }
`;

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
        <style dangerouslySetInnerHTML={{ __html: NF_CSS }} />
        <NotFoundClient pool={pool} locales={locales} />
      </body>
    </html>
  );
}

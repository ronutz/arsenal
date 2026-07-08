# CLAUDE.md — arsenal (ronutz.com)

Onboarding context for Claude (Claude Code or chat sessions acting as ANVIL under CONCORD governance). Keep this file short; deep rules live in the CONCORD canon (private `concord` repo). PRIME (Rodolfo Nützmann) is the sole ratifier.

## What this is

Next.js 15 **static export** (`output: "export"`) PWA deployed as Cloudflare Workers static assets; the Worker handles `/api/*` only, everything else is served straight from assets. 16 locales via next-intl (per-locale ICU JSON in `src/i18n/messages/`); EN + pt-BR authored natively, the other 14 fall back to English per key. ~75 deterministic, local-compute tools ("tools that compute, never guess") + ~270 Learn articles (MDX in `src/content/learn/<locale>/`). No database, no server rendering at request time.

## Commands

- `npm run prebuild` — the guard chain (tool-articles, changelog, registry, vendor-namespace, tool-docs, user-guide, ICU messages, CSS coverage, OpenAPI parity). Run it before any build; a red guard is a hard stop.
- `npm run build` — full static export (~6900 pages). **Resource-constrained environments need the documented recipe:** clean first (`rm -rf .next out`, no swapfile ever), launch detached with `NODE_OPTIONS='--max-old-space-size=2560'`, verify rendered HTML in `.next/server/app/`, and treat a trailing ENOSPC during the final `out/` copy after `✓ Exporting (2/2)` as the known harmless ceiling.
- `npx tsc --noEmit` — typecheck; keep it at zero.
- Golden vectors: each tool's `verifyVectors()` must pass (run via `npx tsx`).

## Non-negotiable conventions

- **Every line of code is commented and documented** (CONCORD PRIME DIRECTIVE D-19). No exceptions.
- **New tools** ship the full D-49 shape: `compute.ts` (pure, deterministic, ReDoS-safe parsing), `golden-vectors.ts` (byte-exact, with a dated `GOLDEN_VECTOR_SET_ID`), `index.ts` (frozen manifest: inputDetectors, executionClass, goldenVectors, dangerousInputHandling, shareSafetyDefault, learnLinks, dated sources), a client component with an **Example/Clear button row** (D-83, example verbatim from a golden vector), wiring in `src/lib/tools/registry.ts` (run entry **and** API_TOOLS or API_EXCLUDED — D-72 parity is guard-enforced), `src/config/tools.ts`, the tool page map in `src/app/[locale]/tools/[slug]/page.tsx`, the catalogue, tool-docs in **en and pt-BR**, and at least one Learn article per locale pair (guard-enforced).
- **Facts come from vendor documentation fetched live, never from model memory.** Every technical claim carries a source with an access date. If canon or sources are absent, say so instead of reconstructing.
- **i18n:** edits to any page that exists in multiple locales update all of them in the same change; author EN + pt-BR natively; JSON writes are additions-only via `OrderedDict`, `ensure_ascii=False`, `indent=2`, trailing newline; never break ICU syntax; proper native diacritics always.
- **No em-dashes in English public copy** (AI-tell rule). Non-English locales keep their native punctuation (Russian тире, Chinese 破折号 stay).
- **CSS:** semantic custom-property tokens only (`--color-*`, `--surface-elevated`; `--surface-raised` does not exist). Every class referenced in a component must exist in a stylesheet (guard-enforced). Never write `*/` inside a CSS comment.
- **Never commit or push from an automated session.** Work is staged only; transfer is a fresh full-repo zip verified entry-for-entry against `git ls-files`. On the receiving side never use `git commit -am` (it silently drops new files).

## Layout quick map

`src/lib/tools/<slug>/` engines · `src/components/` tool UIs (existing class vocabulary first) · `src/app/[locale]/` pages (no root layout by design; `[locale]/layout.tsx` owns `<html>`) · `src/content/{learn,tool-docs,changelog,catalogue}` content · `scripts/` guards and generators · `public/` static assets.

## Where the deeper rules live

CONCORD canon (Charter, Architecture & Build Spec, Protocol, decision log D-nn) in the private `concord` repo — PRIME holds the authoritative copies and attaches them per session. When this file and canon disagree, canon wins; flag the drift.

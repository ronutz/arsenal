# Tool build run — definition of done

The canonical checklist for adding one tool to ARSENAL. A tool is **not shipped**
until every step here is complete. This file is the source of record because
working memory can be compacted and lose steps; read it at the start of every
tool build. Steps marked **[enforced]** have an automated guard that fails the
build if skipped.

## 1. Engine (deterministic, D-49)
- `src/lib/tools/<slug>/compute.ts` — pure compute, Web Crypto only, no clock,
  no randomness, no network egress. Clock/random are UI-layer inputs.
- `src/lib/tools/<slug>/golden-vectors.ts` — RFC/spec-anchored vectors + reject
  vectors. Verify the engine reproduces the published vectors **before** freezing
  (run a throwaway tsx script from the repo root).
- `src/lib/tools/<slug>/index.ts` — re-exports + frozen `manifest` (toolFamily,
  toolSlug, aliases, capability/execution class, `goldenVectors`, `sources`,
  `learnLinks`, credits) + async `run`.

## 2. UI component
- `src/components/<Name>Tool.tsx` — `"use client"`, `useTranslations("tools.<slug>")`,
  reuse the cidr/jwt CSS classes, race-guard async results.

## 3. Wiring
- `src/app/[locale]/tools/[slug]/page.tsx` — import the component + manifest, add
  the `TOOL_PAGES` entry.
- `src/config/tools.ts` — registry entry `{ id, href, category, available: true }`.
- `src/content/catalogue/catalogue.ts` — flip the entry from queued/accept/rank to
  `status: "live", disposition: "built", vectors: true` (drop rank/flags), then
  **re-rank the remaining accept tools gapless 1..N**.

## 4. i18n — EN + pt-BR (D-56)
- Add `tools.<slug>.{name, blurb, ...}` to `src/i18n/messages/en.json` AND
  `pt-BR.json`. Other locales are the Phase-2 campaign.

## 5. CSS
- Append any new classes to `src/app/components.css`; reuse theme vars from
  `globals.css`. Match/no-match use the fixed traffic-light hexes.

## 6. Related Learn articles — EN + pt-BR **[enforced]**
- **AIM for FIVE articles per tool (PRIME), not two.** Five is a TARGET, not a
  hard floor or ceiling:
  - **Never pad.** Do not invent filler articles just to reach five. If the
    tool's topic genuinely warrants only 3 or 4 substantive articles, ship that
    many — quality over count (warrant-based, per D-57).
  - **Exceed five** when the topic warrants more (e.g. `jwt` has 6).
  - Tools shipped earlier at ~2 (`diff`, `totp-hotp`, and any others) are
    under-served and should be brought up to ~5 warranted articles over time.
- Each article is **new** and specific to the tool, written in BOTH `en/` and
  `pt-BR/` under `src/content/learn/`, with frontmatter `relatedTools: ["<slug>"]`.
  Articles I author are `status: machine-draft` until PRIME reviews them.
- Cross-tag genuinely-related **existing** articles by adding `<slug>` to their
  `relatedTools` (en + pt-BR at minimum).
- Point the tool manifest `learnLinks` at the new article slugs.
- Guard: `scripts/check-tool-articles.mjs` (runs first in `prebuild`) enforces
  only the **≥1 EN + pt-BR minimum** — the five-aim cannot be hard-enforced
  because padding is forbidden, so it is a quality bar applied when authoring,
  not a build gate. The guard exists because totp-hotp once shipped without any
  articles.

## 7. Indexes & panels
- The Learn index (`/learn`), the `[slug]` article routes, and the in-tool Learn
  panel are all filesystem-derived: a rebuild updates them. Verify after build.

## 8. API worker (only if the tool gets a hosted endpoint)
- Engines are **arsenal-local**; ARSENAL has **no external engine dependency**.
  The Cloudflare worker (`worker/index.ts`) must import engines from
  `../src/lib/tools/...`. Do not introduce an external engine package: such a
  subpath would not be installed on a clean Cloudflare `npm clean-install` and
  would break `wrangler deploy`.
- Sanity-check the worker bundles: `npx esbuild worker/index.ts --bundle
  --format=esm --platform=neutral --outfile=/tmp/w.js` (esbuild is what wrangler
  uses); the bundle must import only arsenal-local engines.

## 9. Build & verify, then ship
- Full `npm run build` green: 0 IntlError/MISSING_MESSAGE, the tool page renders
  in en + pt-BR with title/blurb/References, the Learn panel lists the articles,
  the article pages render, live-tool and catalogue counts are correct.
- Zip tracked + untracked (`git ls-files` + `git ls-files --others
  --exclude-standard`), verify no `.next/`/`node_modules/`/`out/` leak, present.

**Only when 1–9 are done is the tool build run complete.**

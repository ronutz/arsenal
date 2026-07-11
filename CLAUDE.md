# CLAUDE.md — arsenal (ronutz.com)

Onboarding context for Claude (Claude Code or chat sessions acting as ANVIL under CONCORD governance). Keep this file short; deep rules live in the CONCORD canon (private `concord` repo). PRIME (Rodolfo Nützmann) is the sole ratifier.

## What this is

Next.js 15 **static export** (`output: "export"`) PWA deployed as Cloudflare Workers static assets; the Worker handles `/api/*` only, everything else is served straight from assets. 16 locales via next-intl (per-locale ICU JSON in `src/i18n/messages/`); EN + pt-BR authored natively, the other 14 fall back to English per key. ~75 deterministic, local-compute tools ("tools that compute, never guess") + ~270 Learn articles (MDX in `src/content/learn/<locale>/`). No database, no server rendering at request time.

## Commands

- `npm run prebuild` — the guard chain (tool-articles, changelog, registry, vendor-namespace, glossary, study-guides, tool-docs, user-guide, ICU messages, CSS coverage, lockfile platforms, OG cards, OpenAPI parity). Run it before any build; a red guard is a hard stop.
- `npm run build` — full static export (**9,893 pages / 16 locales**). The full export **no longer fits sandbox environments** (genuine mid-generation ENOSPC, not the old harmless trailing copy): sandbox verification is the partial build only — `VERIFY_LOCALES=en,pt-BR` via the documented env-gate on `LIVE_LOCALE_CODES` (~1,241 pages), clean first (`rm -rf .next out`, no swapfile ever), launch detached with `NODE_OPTIONS='--max-old-space-size=2560'`, verify rendered HTML in `.next/server/app/`, and remove the gate before staging. **The full 16-locale export belongs to GitHub Actions CI.**
- `npx tsc --noEmit` — typecheck; keep it at zero.
- Golden vectors: each tool's `verifyVectors()` must pass (run via `npx tsx`).

## Non-negotiable conventions

- **Every line of code is commented and documented** (CONCORD PRIME DIRECTIVE D-19). No exceptions.
- **New tools** ship the full D-49 shape: `compute.ts` (pure, deterministic, ReDoS-safe parsing), `golden-vectors.ts` (byte-exact, with a dated `GOLDEN_VECTOR_SET_ID`), `index.ts` (frozen manifest: inputDetectors, executionClass, goldenVectors, dangerousInputHandling, shareSafetyDefault, learnLinks, dated sources), a client component with an **Example/Clear button row** (D-83, example verbatim from a golden vector), wiring in `src/lib/tools/registry.ts` (run entry **and** API_TOOLS or API_EXCLUDED — D-72 parity is guard-enforced), `src/config/tools.ts`, the tool page map in `src/app/[locale]/tools/[slug]/page.tsx`, the catalogue, tool-docs in **en and pt-BR**, and at least one Learn article per locale pair (guard-enforced). **Tool documentation is authored as Markdown but presented as a web page** at `/tools/<slug>/docs` (auto-rendered from the `.md` via `src/lib/toolDocs.ts`), with the raw Markdown accessible from that page via a "View as Markdown" link (the `.md` twin is emitted by `gen-machine-legible`, and the tool page links to its docs page under the family chip). Authors write only the Markdown; the web page, the in-tool link, and the download come for free.
- **Facts come from vendor documentation fetched live, never from model memory.** Every technical claim carries a source with an access date. If canon or sources are absent, say so instead of reconstructing.
- **i18n:** edits to any page that exists in multiple locales update all of them in the same change; author EN + pt-BR natively; JSON writes are additions-only via `OrderedDict`, `ensure_ascii=False`, `indent=2`, trailing newline; never break ICU syntax; proper native diacritics always.
- **No em-dashes in English public copy** (AI-tell rule). Non-English locales keep their native punctuation (Russian тире, Chinese 破折号 stay).
- **CSS:** semantic custom-property tokens only (`--color-*`, `--surface-elevated`; `--surface-raised` does not exist). Every class referenced in a component must exist in a stylesheet (guard-enforced). Never write `*/` inside a CSS comment.
- **Never commit or push from an automated session.** Work is staged only; transfer is a fresh full-repo zip verified entry-for-entry against `git ls-files`. On the receiving side never use `git commit -am` (it silently drops new files).

## Deploy pipeline (since 2026-07-10)

- **Production deploys run in GitHub Actions** (`.github/workflows/deploy.yml`): push to `main` builds the full 16-locale export on an ubuntu runner (disk freed first) and deploys via `cloudflare/wrangler-action`. **Pushing to main IS the deploy.**
- **Cloudflare Workers Builds is retired** (2026-07-09: ENOSPC at 9,893 pages during the `.next -> out/` copy; its 20 GB build disk cannot fit the full export and has no raise path). Do not reconnect it.
- **Local `npx wrangler deploy` is break-glass only**, and only from a clean, pushed tree:
  ```sh
  test -z "$(git status --porcelain)" && git fetch -q origin && \
  test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" && \
  npx wrangler deploy || echo "REFUSING: tree dirty or not pushed"
  ```
- **End-of-turn Deploy message template:** every build turn still ends with the commit message in a copyable code block; it now reads as the message for the commit **whose push to main triggers the GitHub Actions deploy** (no separate deploy step).
- Wrangler is pinned in `devDependencies` (>= 4.34.0, required for the 100,000-file asset cap on Paid). `wrangler.*` config at the repo root is shared by CI and break-glass deploys.

## Lockfile provenance (standing rule)

- **GitHub `main` is authoritative for `package-lock.json`. Never delete or regenerate it in a sandbox.** Sandbox lockfiles regenerated on Linux drop the cross-platform optional deps and break `npm ci` on Windows (the 2026-07-10 EUSAGE incident).
- Installs are **`npm ci` only**. Dependency changes via **targeted `npm install <pkg>@<version>` only**; afterwards re-verify the sentinels and `npm ci --dry-run`.
- Sentinels (run at session boot on the incoming snapshot AND again pre-zip; record PASS/FAIL in the wrap) — all four must be present in `package-lock.json`:
  `"node_modules/@esbuild/win32-x64"`, `"node_modules/@img/sharp-win32-x64"`, `"node_modules/@pagefind/windows-x64"`, `"node_modules/fsevents"` (guard-enforced by `scripts/check-lockfile-platforms.mjs` in prebuild).
- **Build outputs never enter the repo:** `.gitignore` covers `/.next/` and `/out/` (and generated `/public/og/`); keep it that way.

## Layout quick map

`src/lib/tools/<slug>/` engines · `src/components/` tool UIs (existing class vocabulary first) · `src/app/[locale]/` pages (no root layout by design; `[locale]/layout.tsx` owns `<html>`) · `src/content/{learn,tool-docs,changelog,catalogue}` content · `scripts/` guards and generators · `public/` static assets.

## Where the deeper rules live

CONCORD canon (Charter, Architecture & Build Spec, Protocol, decision log D-nn) in the private `concord` repo — PRIME holds the authoritative copies and attaches them per session. When this file and canon disagree, canon wins; flag the drift.

# arsenal — Roadmap

**Project:** ARSENAL — the private Services layer of ronutz.com (Next.js 15 static-export PWA on
Cloudflare Workers). Consumes the public `netcore` engine across the C-04/C-60 boundary.
**Version:** v1.0 · **Date:** 2026-06-26 (GMT-3) · **Governed by:** CONCORD (Protocol v2.0)

This is an **execution roadmap** derived from the ratified canon; it is not a decision ledger
(Protocol §10.1: the Platform Charter is the sole persistent memory). Each item cites its ratified
ID (`C-xx` seam / `D-xx` decision) or the Parking Lot (Charter Appendix C). Companion roadmaps:
`netcore/ROADMAP.md` (engine) and `concord/ROADMAP.md` (governance).

**Legend:** 🟢 shipped · 🔵 in progress · 🟡 next · ⚪ deferred · 🅿️ parked (Appendix C)

---

## 1. Engine cutover to `netcore` 0.2.0

- 🟡 Adopt `netcore` 0.2.0: `CidrTool` `cidrTool.run()` → `cidr()`, `usableHosts` → `hostCount`,
  optionally surface the new fields (`version`, `isPrivate`, `isSpecialUse`, `isGloballyReachable`,
  `classification`); delete `src/types/netcore.d.ts`; adopt the API seam (worker → `createApiHandler`,
  `build-openapi.mjs` → `toOpenAPI()` sourced from golden vectors, retire hand-authored
  `openapi.yaml`); bump dep to `^0.2.0`. **[C-04 API-first · C-60 Engine⟷Services · runbook Phase 4]**

## 2. Tools (build one tool + its Learn content end-to-end)

- 🟢 Live: jwt · pkce · base64 · hash · hmac · uuid · cidr (RFC-anchored golden vectors). **[C-21/C-03]**
- 🟡 X.509 / certificate decoder (ASN.1 / DER). **[§8]**
- 🟡 IPv6 toolkit. **[§8.K · RFC 4291]**
- ⚪ Cipher-suite decoder · IP converter · VLSM · reverse-DNS · epoch/NTP · URL parser · generic diff ·
  password/entropy. **[§8.K/§8.O · Appendix C]**
- ⚪ Regex toolkit (multi-flavor tester/visualizer, railroad diagrams, ReDoS warnings). **[§8.T]**
- ⚪ Encoding zoo + WAF evasion/normalization lab (F5 AWAF set); IT-unit converters. **[§8.O]**
- ⚪ Network-path/registry diagnostics (ping/traceroute/WHOIS-RDAP/ASN/RPKI/blacklist). **[C-87 · §8.N]**

## 3. Internationalization

- 🟢 Colophon fully localized in 16 locales — new CONCORD keys (pull-quote, six mechanics, named seat
  models, persistent-memory mechanic), trimmed body3/body4, and the vibe-coding section, all 15
  non-English locales. **[D-20 · D-48]**
- 🟢 `MachineTranslationNotice` discloses non-English locales as machine-assisted.
- 🟡 Russian and other dash-natural locales now use their natural punctuation (see the language-aware
  em-dash policy in `concord/ROADMAP.md`); English copy stays em-dash-free.
- ⚪ Arabic (`ar`) RTL pack (exercises RTL-ready layout). **[D-20]**
- ⚪ Finnish (`fi`) pack — on hold.

## 4. Static authority surface (Day-1 priority)

- 🟢 `/colophon` (CONCORD), 43 certification PDFs under `public/certs/`, contact channels
  (LinkedIn · YouTube · Instagram · official training). **[D-37 · D-48]**
- 🟡 History sections `/about/history/{pre-1996 | 1996-2020 | 2020-present}`, each potentially
  multi-page; indexed after the EXIF/PII scrub, phased tool-forward. **[D-41 · D-45]**
- 🟡 Recommendations & Reviews corpus (80 proofread captures, 2004→2025) — **pending PRIME publish
  sign-off; drop #25 (exact dup)**. **[D-37]**
- 🟡 Per-tool credits & sources (header brief + footer detail, per-tool show/hide). **[D-38 · D-39]**
- ⚪ Federated avatars (upload → IdP picture → opt-in Gravatar → jdenticon; one sharp re-encode +
  EXIF-strip pipeline; never hotlinked). **[D-46]**
- ⚠️ **Netskope credentials are PRIME-ATTESTED, not VERIFIED** — do NOT publish them as verified until
  the certificate PDFs are supplied. **[CertRecon v1.0]**
- ⚠️ Cert-expiry watch: Extreme ECP-Switching (2026-08-08), Fortinet FCP-NS (2026-08-19).

## 5. Themes / flavor

- 🟢 Theme system on semantic CSS-variable tokens; 26 themes; default Obsidian. **[D-19]**
- ⚪ Apple II hi-res theme variant. **[D-19]**
- ⚪ BBS / ANSI easter-egg section — static, decorative, **do NOT localize**; never a hidden path
  ("no backdoor" rule). **[§6.5]**

## 6. Persistence & preferences

- ⚪ HTTP-cookie preference-persistence brainstorm — within local-first / BYO-cloud-sync / no-account.
  **[§6.5]**
- ⚪ Opt-in share affordances ("tool only" vs "with data" via the URL-fragment model); FortiOS-style
  feature show/hide. **[§6.4 · §6.5 · C-67]**

## 7. Platform / commercial

- ⚪ TipJar — BYO-TipJar provider allowlist (GitHub Sponsors · Stripe Payment Link · Ko-fi · BMC);
  commission-taker named as ronutz, never NTZ. **[D-33 · D-44 · §9.4]**
- ⚪ Tool-specific funding mechanism. **[D-40]**
- ⚪ "Request this training" lead-routing → configurable provider-routing registry (Red Education
  default; Direct/self off until PRIME + Red Education green-light). **[C-63 · D-47]**
- ⚪ Admin on-the-fly feature toggles + per-user feature visibility. **[C-23 · C-39 · C-80 · C-67]**
- ⚪ Contributor public pages (read-only first; tips gated; noindex below a threshold). **[D-40 · D-43]**
- ⚪ Documented API at `/api` + `/docs` (Swagger UI vendored same-origin under strict CSP) + embeddable
  client-side module. **[C-04]**
- 🅿️ Metered hosted API · Pro · Team/Enterprise · public Store (review + signing) · team/org accounts ·
  community-pot unlocks (phased). **[D-29 · D-34 · Appendix C]**

## 8. Brand copy & evidence

- 🟡 Reconcile the hero-thesis text to the locked D-02 wording (finding **F1**). **[D-02]**
- 🟡 Refresh the LinkedIn banner; drop the stale "MVP x3" line. **[Brand Charter §2.3]**

---

## Changelog

- **v1.0 — 2026-06-26 (ANVIL):** Initial ARSENAL roadmap, split out from the consolidated 0.2.0
  draft into its own per-project file. Captures the engine cutover, the tools pipeline, i18n, the
  static authority surface, themes, persistence, the commercial surface, and the open brand-copy
  items; carries forward the Netskope evidence gap and the cert-expiry watch. For PRIME ratification.

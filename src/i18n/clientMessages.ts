// ============================================================================
// src/i18n/clientMessages.ts
// ----------------------------------------------------------------------------
// CLIENT MESSAGE SLICING (D-decision A1, ratified 2026-07-10).
//
// PROBLEM this solves: the root [locale]/layout.tsx used to pass the ENTIRE
// message pack (5,257 keys, ~423 KB minified en) to NextIntlClientProvider on
// EVERY page. Next.js serializes that whole object into each page's inline RSC
// hydration payload, so a typical page weighed ~546 KB of which ~97% was the
// inlined catalog - the same bloat that overran Cloudflare Workers Builds'
// disk on the full 16-locale export (see page-weight-message-slicing-proposal).
//
// A1 = a small GLOBAL client allowlist (this file) at the root provider, plus
// per-route NESTED providers that add only the namespace a given route's client
// components actually consume. next-intl merges a nested provider's messages
// over the outer one, so a tool page ends up with {global chrome + that tool's
// namespace} and nothing else.
//
// This file is the SINGLE SOURCE OF TRUTH for the global set. The build guard
// scripts/check-client-messages.mjs statically verifies that every client
// component's useTranslations("ns") is covered by (this global set) UNION (the
// nested provider on its route), so a missing namespace is a red build, never a
// runtime MISSING_MESSAGE.
//
// WHAT QUALIFIES AS GLOBAL: a namespace consumed by a client component that can
// appear on ANY page - i.e. the site chrome in the shared header/footer. Route-
// scoped namespaces (a tool's own keys, the /api explorer, the dev tools, the
// home stats, the endorsements page) are deliberately NOT global; they ride a
// nested provider on their own route.
// ============================================================================

/**
 * Namespaces every page's client chrome needs. Kept deliberately tiny.
 * - theme:            ThemeSwitcher (header)              ~47 B
 * - languageSwitcher: LanguageSwitcher (header)           ~89 B
 * - languageStatus:   LanguageSwitcher fallback notice    ~651 B
 * - search:           Search overlay (header)             ~565 B
 * Total ~1.35 KB vs the former ~423 KB pack.
 */
export const GLOBAL_CLIENT_NAMESPACES = [
  "theme",
  "languageSwitcher",
  "languageStatus",
  "search",
] as const;

import type { AbstractIntlMessages } from "next-intl";

/**
 * Return a copy of `messages` containing only the given namespaces, which may
 * be DOTTED paths (e.g. "tools.cidr", "devOther.fingerprint") as well as
 * top-level names (e.g. "theme"). For a dotted path, only that nested branch is
 * copied - so a tool page's slice carries `{ tools: { cidr: {...} } }`, NOT the
 * whole 203 KB `tools` namespace. This is what keeps A1's per-route payload
 * minimal while still letting `useTranslations("tools.cidr")` resolve.
 *
 * Missing paths are skipped silently - completeness is guaranteed at build time
 * by scripts/check-client-messages.mjs, so this stays defensive at runtime.
 */
export function pickNamespaces(
  messages: AbstractIntlMessages,
  namespaces: readonly string[],
): AbstractIntlMessages {
  const out: Record<string, unknown> = {};
  for (const ns of namespaces) {
    const parts = ns.split(".");
    // Navigate into the source pack along the dotted path.
    let src: unknown = messages;
    let ok = true;
    for (const part of parts) {
      if (src && typeof src === "object" && part in (src as Record<string, unknown>)) {
        src = (src as Record<string, unknown>)[part];
      } else {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    // Rebuild the same nested shape in the output so the path resolves.
    let dst = out;
    for (let i = 0; i < parts.length - 1; i++) {
      dst[parts[i]] = (dst[parts[i]] as Record<string, unknown>) || {};
      dst = dst[parts[i]] as Record<string, unknown>;
    }
    dst[parts[parts.length - 1]] = src;
  }
  return out as AbstractIntlMessages;
}

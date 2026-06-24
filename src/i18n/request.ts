// ============================================================================
// src/i18n/request.ts
// ----------------------------------------------------------------------------
// next-intl REQUEST CONFIG — loads the right message pack per request, with
// ENGLISH FALLBACK baked in.
//
// WHY: Every locale is registered and selectable (D-20), but most are 'stub'
// today — they have no pack, or only a partial one. A user who picks German
// must still get a fully-rendered page, not missing-key errors. So this loader:
//   1. always loads the English pack as the base (the source of truth), then
//   2. deep-merges the requested locale's pack on top (if any exists).
// The result: any key the requested locale is missing transparently shows the
// English string. Adding real German later = dropping de.json in; no code change.
//
// This is the runtime half of the "language pack" architecture; the registry
// (locales.ts) is the declarative half.
// ============================================================================

import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";
import { DEFAULT_LOCALE, isValidLocale } from "./locales";

/**
 * deepMerge — merge `override` onto `base`, recursively. Used to layer a
 * locale's (possibly partial) pack over the complete English base so missing
 * keys fall back to English instead of breaking. Pure; returns a new object.
 */
function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseVal = out[key];
    if (
      value && typeof value === "object" && !Array.isArray(value) &&
      baseVal && typeof baseVal === "object" && !Array.isArray(baseVal)
    ) {
      out[key] = deepMerge(baseVal as Record<string, unknown>, value as Record<string, unknown>);
    } else if (value !== undefined && value !== "") {
      // Only override when the locale actually provides a non-empty value;
      // an empty string in a pack should NOT blank out the English fallback.
      out[key] = value;
    }
  }
  return out;
}

/**
 * Load a locale's JSON pack from src/i18n/messages/. Returns {} if the file
 * doesn't exist yet (a stub locale) — the English base then fills everything.
 */
async function loadPack(locale: string): Promise<Record<string, unknown>> {
  try {
    // Dynamic import keeps each pack a separate, lazily-loaded chunk.
    const mod = await import(`./messages/${locale}.json`);
    return (mod.default ?? mod) as Record<string, unknown>;
  } catch {
    // No pack file for this locale yet → stub. English base covers it.
    return {};
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` comes from the [locale] route segment (see middleware).
  let locale = await requestLocale;

  // Guard: if the URL carried an unregistered/garbage locale, fall back to default.
  if (!locale || !isValidLocale(locale)) {
    locale = DEFAULT_LOCALE;
  }

  // 1) English base (always complete). 2) requested locale's pack on top.
  const base = await loadPack(DEFAULT_LOCALE);
  const requested = locale === DEFAULT_LOCALE ? {} : await loadPack(locale);
  const messages = deepMerge(base, requested);

  // deepMerge produces a structurally-valid message tree (strings + nested
  // objects). Cast to next-intl's exact recursive message type. The cast is
  // sound: every value in our packs is a string or a nested object of strings.
  return { locale, messages: messages as unknown as AbstractIntlMessages };
});

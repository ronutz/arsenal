// ============================================================================
// src/app/[locale]/dev/other/serial-console/page.tsx
// ----------------------------------------------------------------------------
// REDIRECT STUB (2026-07-16): SUNSET 2026-10-01 (PRIME: "should not last
// forever") - delete this folder and SerialConsoleRedirect.tsx after that
// date; external links will have had a full quarter to update.
// The WebSerial console moved to
// /dev/other/web-serial-console so the address matches the tool's name.
// Static export cannot issue HTTP redirects, so this stub client-replaces to
// the new slug and offers a plain link as the no-JS fallback. noindex keeps
// the stub out of search; the canonical page is the new slug.
// ============================================================================
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import SerialConsoleRedirect from "@/components/SerialConsoleRedirect";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function SerialConsoleMovedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SerialConsoleRedirect locale={locale} />;
}

// ============================================================================
// src/app/[locale]/dev/out/speed-test/page.tsx
// ----------------------------------------------------------------------------
// SPEED TEST - a /dev/out tool page (2026-10-26). Red room wrapper, compact
// environment notice, the explicit-egress client component, and inline about,
// licence and sources blocks (this room's tools live outside the catalogue, so
// provenance renders here rather than through the tool-page map). The page's
// own Content-Security-Policy (public/_headers) lets it connect to 'self' and
// https://speed.cloudflare.com, nothing else; the engine's code is a separate
// file from this site, fetched only when the reader presses Start. The one
// link to another site (the engine's repository) opens in a new tab.
// ============================================================================
// The metadata type for generateMetadata.
import type { Metadata } from "next";
// The nested provider that hands the client component its message slice.
import MessageSlice from "@/components/MessageSlice";
// Server-side translations and the static-export locale hook.
import { getTranslations, setRequestLocale } from "next-intl/server";
// The site header.
import Header from "@/components/Header";
// The site footer.
import SiteFooter from "@/components/SiteFooter";
// The room's notice (compact on tool pages).
import EnvOutNotice from "@/components/EnvOutNotice";
// The tool itself.
import DevOutSpeedTestTool from "@/components/DevOutSpeedTestTool";
// Locale-aware internal links.
import { Link } from "@/i18n/navigation";
// The rel every link to another site carries (it opens in a new tab: PRIME 2026-10-27).
import { externalRel } from "@/lib/links";
// The engine's version and repository, declared once beside the code that drives it.
import { SOURCE_SNAPSHOT } from "@/lib/dev-out/speed-test/compute";

/**
 * The page's title and description, per locale.
 * @param params the route parameters (the locale)
 * @returns the metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  // The locale of this export.
  const { locale } = await params;
  // The room's messages.
  const t = await getTranslations({ locale, namespace: "devOut" });
  // Title and description from devOut.speed.
  return {
    title: t("speed.metaTitle"),
    description: t("speed.metaDescription"),
  };
}

/**
 * The speed test page.
 * @param params the route parameters (the locale)
 * @returns the page
 */
export default async function SpeedTestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // The locale of this export.
  const { locale } = await params;
  // Static rendering for this locale.
  setRequestLocale(locale);
  // The room's messages.
  const t = await getTranslations("devOut");

  return (
    <div className="env-out">
      <Header />
      <main id="main">
        <section className="section">
          <div className="container devfun-page-container">
            <div className="devfun-head">
              {/* The tool's name and the room's badge. */}
              <h1 className="devfun-title">
                {t("tools.speedTest.name")} <span className="envout-badge mono">{t("badge")}</span>
              </h1>
              {/* One line on what it does. */}
              <p className="devfun-tagline">{t("tools.speedTest.blurb")}</p>
            </div>

            {/* The room's rules, compact. */}
            <EnvOutNotice compact />

            {/* The tool, with only its own messages sliced in. */}
            <MessageSlice namespaces={["devOut.speed"]}><DevOutSpeedTestTool /></MessageSlice>

            {/* About, licence and provenance, inline (off-catalogue room). */}
            <div className="devfun-head" style={{ marginTop: "2rem" }}>
              {/* The engine: what it is and how it measures. */}
              <p className="devfun-intro">{t("speed.about1")}</p>
              {/* Results logging, and how it is switched off. */}
              <p className="devfun-intro">{t("speed.about2")}</p>
              {/* What Cloudflare sees and says it does with it. */}
              <p className="devfun-intro">{t("speed.about3")}</p>
              {/* Why packet loss is left out. */}
              <p className="devfun-intro">{t("speed.about4")}</p>
              {/* Why there is no grade. */}
              <p className="devfun-intro">{t("speed.about5")}</p>
              {/* What the numbers are a measurement of. */}
              <p className="devfun-intro">{t("speed.about6")}</p>
              {/* The engine and its licence, as the MIT licence asks: the copyright line and where the full text is. */}
              <p className="tools-note">
                {t("speed.engineLabel")}:{" "}
                {/* Another site: a new tab, with the site's rel rule. */}
                <a href={SOURCE_SNAPSHOT.repository} target="_blank" rel={externalRel(SOURCE_SNAPSHOT.repository)}>
                  @cloudflare/speedtest
                </a>{" "}
                {SOURCE_SNAPSHOT.engineVersion}, {t("speed.engineLicence")}
              </p>
              {/* Sources, each read on the date given (the documents themselves are in English). */}
              <p className="tools-note">
                {t("speed.sourcesLabel")}: @cloudflare/speedtest {SOURCE_SNAPSHOT.engineVersion}, README and
                dist/speedtest.js (the README of the v{SOURCE_SNAPSHOT.engineVersion} tag; configuration, defaults,
                results logging, packet loss, the TURN server and the scores) · speed.cloudflare.com, Privacy and Speed
                Test · Cloudflare, Aggregated Internet Measurement · WHATWG Fetch, credentials and the Origin header ·
                NIST, Metric (SI) prefixes (all read 2026-10-27) · W3C Resource Timing,
                Timing-Allow-Origin and transferSize · W3C Referrer Policy, strict-origin-when-cross-origin · W3C Network
                Error Logging · W3C Content Security Policy Level 3, connect-src (2026-10-26; the W3C editor&apos;s
                drafts again 2026-10-27)
              </p>
              {/* Back to the room. */}
              <p className="tools-note">
                <Link href="/dev/out" className="devout-door-link">
                  {t("backToOut")}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

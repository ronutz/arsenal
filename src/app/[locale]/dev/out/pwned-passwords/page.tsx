// ============================================================================
// src/app/[locale]/dev/out/pwned-passwords/page.tsx
// ----------------------------------------------------------------------------
// PWNED PASSWORDS CHECK - the third /dev/out tool page (2026-10-26). Red room
// wrapper, compact environment notice, the explicit-egress client component,
// and inline about, attribution and sources blocks (this room's tools live
// outside the catalogue, so provenance renders here rather than through the
// tool-page map). The page's own Content-Security-Policy (public/_headers)
// lets it connect to 'self' and https://api.pwnedpasswords.com, nothing else.
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
import DevOutPwnedPasswordsTool from "@/components/DevOutPwnedPasswordsTool";
// Locale-aware internal links.
import { Link } from "@/i18n/navigation";

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
  // Title and description from devOut.pwned.
  return {
    title: t("pwned.metaTitle"),
    description: t("pwned.metaDescription"),
  };
}

/**
 * The Pwned Passwords check page.
 * @param params the route parameters (the locale)
 * @returns the page
 */
export default async function PwnedPasswordsPage({
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
                {t("tools.pwnedPasswords.name")}{" "}
                <span className="envout-badge mono">{t("badge")}</span>
              </h1>
              {/* One line on what it does. */}
              <p className="devfun-tagline">{t("tools.pwnedPasswords.blurb")}</p>
            </div>

            {/* The room's rules, compact. */}
            <EnvOutNotice compact />

            {/* The tool, with only its own messages sliced in. */}
            <MessageSlice namespaces={["devOut.pwned"]}><DevOutPwnedPasswordsTool /></MessageSlice>

            {/* About, attribution and provenance, inline (off-catalogue room). */}
            <div className="devfun-head" style={{ marginTop: "2rem" }}>
              {/* What Pwned Passwords is and how the range search keeps the password private. */}
              <p className="devfun-intro">{t("pwned.about1")}</p>
              {/* Padding, and what the request does not carry. */}
              <p className="devfun-intro">{t("pwned.about2")}</p>
              {/* Why the email search is not offered. */}
              <p className="devfun-intro">{t("pwned.about3")}</p>
              {/* Attribution, as the service welcomes it: Have I Been Pwned, with a link to haveibeenpwned.com. */}
              <p className="tools-note">
                {t("pwned.attributionLabel")}:{" "}
                <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener noreferrer">
                  Have I Been Pwned
                </a>{" "}
                (haveibeenpwned.com). {t("pwned.attributionNote")}
              </p>
              {/* Sources, each read on the date given (the documents themselves are in English). */}
              <p className="tools-note">
                {t("pwned.sourcesLabel")}: Have I Been Pwned API v3, Pwned Passwords section (range search, padding,
                incremental searching, CORS, rate limiting, licence; 2026-10-26) · haveibeenpwned.com/Passwords
                (2026-10-26) · Troy Hunt, Enhancing Pwned Passwords Privacy with Padding (5 March 2020; read
                2026-10-26) · W3C Web Cryptography API, SHA-1 digest · WHATWG Encoding Standard, TextEncoder ·
                WHATWG Fetch Standard, credentials and cache modes · W3C Referrer Policy, no-referrer (all 2026-10-26)
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

// ============================================================================
// src/app/[locale]/privacy/page.tsx
// ----------------------------------------------------------------------------
// PRIVACY NOTICE — an accurate, plain-language account of what the site does
// and does not do with visitor data.
//
// Written to match the site's actual behaviour (verified in code), not to make
// blanket claims: the site's own code sets no cookies and runs no analytics or
// trackers; tools run in-browser; the contact form opens the visitor's own mail
// client (no server POST); what is touched is a few device-local preferences,
// the aggregate count, and what Cloudflare does as the host: connection logs
// (incl. IP), Workers Logs of each request through the Worker, its bot check
// (an injected script and the __cf_bm / cf_clearance cookies), and the Network
// Error Logging reports a browser may send it when a request fails. Covers the
// disclosure essentials common to the GDPR and Brazil's LGPD (controller +
// contact, what is/ isn't processed, legal bases, international processing, data
// subject rights, children, changes). Statically generated; reuses the colophon
// CSS classes so no new styling is required. Linked from the shared footer.
//
// This is a good-faith factual disclosure, not legal advice or a certification
// of compliance; the controller should review it and may seek qualified counsel.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { contactEmail } from "@/config/contact";
// The notice's own revision record (audit F14, 2026-10-18): the date printed below is data, not a string per pack.
import { PRIVACY_REVISIONS, latestPrivacyRevision, formatRevisionDate } from "@/config/privacyRevisions";
// The public source of the count and the provider's retention page (B9, 2026-10-26): what this page says, checkable.
import {
  COUNTING_WRITE_SOURCE,
  COUNTING_READ_SOURCE,
  COUNTING_CONFIG_SOURCE,
  COUNTING_RETENTION_SOURCE,
  COUNTING_RETENTION_READ,
} from "@/config/countingSource";
// What Cloudflare does as the host, each fact from its own documentation (privacy round 3, 2026-10-26).
import {
  WORKERS_LOGS_SOURCE,
  WORKERS_LOGS_FIELDS_SOURCE,
  WORKERS_LOGS_RETENTION_SOURCE,
  BOT_SCRIPT_SOURCE,
  BOT_COOKIES_SOURCE,
  BOT_CLEARANCE_SOURCE,
  BOT_PASSAGE_SOURCE,
  NEL_SOURCE,
  NEL_SPEC_SOURCE,
  PROVIDER_SOURCES_READ,
} from "@/config/providerSources";
// The type of a rich-text chunk, for the source links.
import type { ReactNode } from "react";

/**
 * PAGE TITLE (2026-09-26). Shipped with no generateMetadata export, so it
 * inherited the site-wide default <title> and shared one string with thirteen
 * other pages. Title only: this slug is not in gen-og's STATIC_PAGES, so
 * ogImages() would name a card that does not exist and check-og would fail.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy_page" });
  // The title, and the page's own one-sentence description (PRIME 2026-10-26: it had inherited the site tagline as its
  // meta, og and twitter description). No openGraph is set here, so Next.js derives og:description and
  // twitter:description from `description`.
  return { title: t("title"), description: t("metaDescription") };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("privacy_page");

  // The contact address must never reach the served HTML or the locale JSON in
  // harvestable form. The privacy copy carries an {email} placeholder instead of
  // the literal address; we fill it here with a "user [at] domain" form (no "@",
  // no mailto:), matching the obfuscation the Contact page uses pre-hydration.
  const [emailUser, emailDomain] = contactEmail().split("@");
  const obfuscatedEmail = `${emailUser} [at] ${emailDomain}`;

  /** An outbound link that opens in a new tab, as the footer's source link does (it leaves the site). */
  const out = (href: string) => (chunks: ReactNode) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {chunks}
    </a>
  );
  // DATES IN BRITISH ORDER ON THE ENGLISH PAGE (ANVIL follow-up, 2026-10-26). The English copy is British ("1 December
  // 2026"), but Intl's plain "en" formats a long date the US way ("October 26, 2026"). Every date this page prints
  // (the read dates, "Last updated", the revision list) goes through dateLocale: en-GB for en, every other locale as is.
  const dateLocale = locale === "en" ? "en-GB" : locale;
  // THE COUNT, CHECKABLE (Round 1 batch B, B9, 2026-10-26). Under the section that says what the count writes and
  // never writes, one paragraph names the public files that do it and the provider page that says how long the store
  // keeps a row, with the date it was read; src/config/countingSource.ts holds the addresses and why.
  const countSource = t.rich("noTrackSource", {
    analytics: out(COUNTING_WRITE_SOURCE),
    stats: out(COUNTING_READ_SOURCE),
    config: out(COUNTING_CONFIG_SOURCE),
    retention: out(COUNTING_RETENTION_SOURCE),
    date: formatRevisionDate(COUNTING_RETENTION_READ, dateLocale),
  });

  /** A literal name (a cookie, a path) set in the monospace face the page already uses for its date line. */
  const lit = (chunks: ReactNode) => <span className="mono">{chunks}</span>;
  // WHAT THE HOST KEEPS AND SETS (privacy round 3, PRIME's decisions of 2026-10-26). Under the hosting section, two
  // paragraphs: the Workers Logs Cloudflare may keep of each request through the Worker (on by default, and
  // wrangler.jsonc does not turn them off), and the bot check Cloudflare adds to each page (a script and up to two
  // cookies). Each cites Cloudflare's pages, with the day they were read; src/config/providerSources.ts holds them.
  const hostingLogs = t.rich("hostingLogs", {
    logs: out(WORKERS_LOGS_SOURCE),
    fields: out(WORKERS_LOGS_FIELDS_SOURCE),
    pricing: out(WORKERS_LOGS_RETENTION_SOURCE),
    date: formatRevisionDate(PROVIDER_SOURCES_READ, dateLocale),
  });
  // The bot check: the injected script, then the two cookies and what Cloudflare says of them.
  const hostingBots = t.rich("hostingBots", {
    c: lit,
    jsd: out(BOT_SCRIPT_SOURCE),
    clearance: out(BOT_CLEARANCE_SOURCE),
    passage: out(BOT_PASSAGE_SOURCE),
    cookies: out(BOT_COOKIES_SOURCE),
    date: formatRevisionDate(PROVIDER_SOURCES_READ, dateLocale),
  });
  // Network Error Logging: the two headers Cloudflare adds, what a failing browser may report and to whom, what
  // Cloudflare says it keeps, and that the site's code neither sets the headers nor reads the reports.
  const hostingNel = t.rich("hostingNel", {
    c: lit,
    nel: out(NEL_SOURCE),
    spec: out(NEL_SPEC_SOURCE),
    date: formatRevisionDate(PROVIDER_SOURCES_READ, dateLocale),
  });

  // The "short version" points, rendered as a set of lead paragraphs.
  const short = ["short1", "short2", "short3", "short4"];

  // The body sections: each is a heading key + a body key.
  const sections = [
    ["controllerTitle", "controllerBody"],
    ["noTrackTitle", "noTrackBody"],
    ["browserTitle", "browserBody"],
    ["prefsTitle", "prefsBody"],
    ["shortcutsTitle", "shortcutsBody"],
    ["hostingTitle", "hostingBody"],
    ["toolsTitle", "toolsBody"],
    ["contactTitle", "contactBody"],
    ["intlTitle", "intlBody"],
    ["childrenTitle", "childrenBody"],
  ];

  return (
    <>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="colophon-hero">
            <div className="container colophon-container">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
            </div>
          </section>

          {/* The short version */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("shortTitle")}</h2>
              {short.map((k, i) => (
                <p
                  key={k}
                  className={i === 0 ? "colophon-lead" : "colophon-body"}
                >
                  {t(k)}
                </p>
              ))}
            </div>
          </section>

          {/* Body sections */}
          {sections.map(([titleKey, bodyKey]) => (
            <section className="section" key={titleKey}>
              <div className="container colophon-container">
                <h2 className="colophon-h2">{t(titleKey)}</h2>
                <p className="colophon-body">{t(bodyKey, { email: obfuscatedEmail })}</p>
                {/* The count's section closes with where its code can be read (B9). */}
                {titleKey === "noTrackTitle" && <p className="colophon-body">{countSource}</p>}
                {/* The hosting section closes with the host's own logs and bot check (privacy round 3). */}
                {titleKey === "hostingTitle" && <p className="colophon-body">{hostingLogs}</p>}
                {titleKey === "hostingTitle" && <p className="colophon-body">{hostingBots}</p>}
                {titleKey === "hostingTitle" && <p className="colophon-body">{hostingNel}</p>}
              </div>
            </section>
          ))}

          {/* Rights (one body plus two jurisdiction-specific notes) */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("rightsTitle")}</h2>
              <p className="colophon-body">{t("rightsBody", { email: obfuscatedEmail })}</p>
              <p className="colophon-body">{t("rightsGdpr")}</p>
              <p className="colophon-body">{t("rightsLgpd")}</p>
            </div>
          </section>

          {/* Changes + last-updated + back link */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("changesTitle")}</h2>
              <p className="colophon-body">{t("changesBody")}</p>
              {/* The date of the newest revision, formatted in the reader's language, followed by the record of
                  what changed and when: a reader can tell the notice's own revisions from the site's content date
                  in the footer. */}
              <p className="colophon-body mono">{t("updated", { date: formatRevisionDate(latestPrivacyRevision().date, dateLocale) })}</p>
              <ul className="colophon-body privacy-revisions">
                {PRIVACY_REVISIONS.map((r) => (
                  // Keyed by the note, not the day: two revisions may share a day (2026-10-26 has two).
                  <li key={r.key}>
                    <span className="mono">{formatRevisionDate(r.date, dateLocale)}</span>: {t(`revisions.${r.key}`)}
                  </li>
                ))}
              </ul>
              <Link href="/" className="btn btn-secondary colophon-back">
                {t("backHome")} →
              </Link>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}

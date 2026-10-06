// ============================================================================
// src/app/[locale]/contact/page.tsx
// ----------------------------------------------------------------------------
// CONTACT PAGE — "Get in touch".
//
// The destination for the Training landing CTA and the lead router's SELF slot.
// Presents what to reach out for (training, custom programs, advisory), the
// contact form (config-driven: mailto today, endpoint-ready for later), and the
// direct channels from the contact config. A dev-only reminder flags the
// placeholder email so it is never shipped silently. Statically generated.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ContactForm from "@/components/ContactForm";
import ObfuscatedEmail from "@/components/ObfuscatedEmail";
import { Link } from "@/i18n/navigation";
import { attributeRedEducationUrl, externalRel } from "@/config/redEducation";
import {
  contactEmail,
  contactChannels,
  contactEmailIsPlaceholder,
} from "@/config/contact";

/**
 * PAGE TITLE (2026-09-26). This route shipped with NO generateMetadata export
 * at all, so it inherited the site-wide default <title> from [locale]/layout.tsx
 * and shared one identical string with thirteen other pages. That is the exact
 * fault check-page-titles was written for on 2026-08-16; the fix that day
 * reached the index routes and never came back for these.
 *
 * Title only, deliberately: ogImages() would point at public/og/page/contact-<locale>.png,
 * and this slug is not in gen-og's STATIC_PAGES list, so the card does not exist
 * and check-og would fail on a manifest entry with nothing behind it. The page
 * keeps the default social card until the slug is added to that list.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("title") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contact");
  const tNav = await getTranslations("nav");

  const channels = contactChannels();

  // Split the email so ObfuscatedEmail assembles it at runtime, keeping the full
  // address out of the static HTML where spam harvesters would scrape it.
  const [emailUser, emailDomain] = contactEmail().split("@");

  // Dev-only: surface the placeholder email so it is not forgotten before launch.
  const showEmailReminder =
    process.env.NODE_ENV !== "production" && contactEmailIsPlaceholder();

  // Form copy, passed to the client component (which has no direct i18n access).
  const formCopy = {
    name: t("formName"),
    email: t("formEmail"),
    topic: t("formTopic"),
    topicTraining: t("topicTraining"),
    topicCustom: t("topicCustom"),
    topicAdvisory: t("topicAdvisory"),
    topicOther: t("topicOther"),
    message: t("formMessage"),
    send: t("formSend"),
    sending: t("formSending"),
    successTitle: t("successTitle"),
    successBody: t("successBody"),
    errorBody: t("errorBody"),
    required: t("formRequired"),
    // G8: the prefilled questions for the advisory and speaking routes.
    advisoryTemplate: t("intents.advisory.template"),
    speakingTemplate: t("intents.speaking.template"),
    // The course route's template, raw: its "{course}" is filled by the form from the link, not by ICU (2026-10-06).
    courseTemplate: t.raw("intents.course.template") as string,
  };
  // G8 (SCOUT, adopted 2026-10-05): the five routes by intent, each a card above the form. Training is booked
  // through Red Education, so that card leaves the site (attributed, the standing rule); advisory, speaking and
  // "something else" arrive at the form with the topic preselected; a correction goes to the section below
  // and, for a tool idea, to the ideas page. The form itself is unchanged.
  const trainingUrl = attributeRedEducationUrl(
    channels.find((c) => c.id === "training")?.url ?? "https://www.rededucation.com/",
    { pageType: "contact", locale, cta: "intent-training" },
  );
  const intents: { id: string; href: string; external?: boolean; secondary?: { href: string; label: string } }[] = [
    { id: "training", href: trainingUrl, external: true, secondary: { href: "/training", label: t("intents.training.secondary") } },
    { id: "advisory", href: "/contact?intent=advisory#contact-form", secondary: { href: "/advisory", label: t("intents.advisory.secondary") } },
    { id: "speaking", href: "/contact?intent=speaking#contact-form", secondary: { href: "/speaking", label: t("intents.speaking.secondary") } },
    { id: "correction", href: "#correction", secondary: { href: "/contribute", label: t("intents.correction.secondary") } },
    { id: "other", href: "/contact?intent=other#contact-form" },
  ];

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="contact-hero">
            <div className="container contact-container">
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
              {/* Site feedback (bugs, mistakes, inaccuracies) is a different
                  channel from booking/consulting: point it to the ideas page. */}
              <p className="contact-feedback">
                {t("feedbackNote")}{" "}
                <Link href="/contribute/tools">{t("feedbackLink")}</Link>.
              </p>
            </div>
          </section>

          {showEmailReminder && (
            <div className="container contact-container">
              <p className="dev-reminder">
                Dev note: contact email is still the placeholder. Set the real
                address in src/config/contact.ts before launch.
              </p>
            </div>
          )}

          {/* Routed by intent (G8): five cards, one per reason to write. */}
          <section className="section contact-intents-section">
            <div className="container contact-container">
              <h2 className="contact-section-label">{t("intentsTitle")}</h2>
              <ul className="contact-intents">
                {intents.map((i) => (
                  <li key={i.id} className="contact-intent">
                    {i.external ? (
                      <a className="contact-intent-main" href={i.href} target="_blank" rel={externalRel(i.href)}>
                        <span className="contact-intent-title">{t(`intents.${i.id}.title`)}</span>
                        <span className="contact-intent-desc">{t(`intents.${i.id}.desc`)}</span>
                        <span className="contact-intent-cta">{t(`intents.${i.id}.cta`)} →</span>
                      </a>
                    ) : i.href.startsWith("#") || i.href.startsWith("/contact?") ? (
                      // Same-page destinations: a plain anchor, so the hash and the query reach the form as written
                      // (the i18n Link would prefix the locale and the static page would reload anyway).
                      <a className="contact-intent-main" href={i.href.startsWith("#") ? i.href : `/${locale}${i.href}`}>
                        <span className="contact-intent-title">{t(`intents.${i.id}.title`)}</span>
                        <span className="contact-intent-desc">{t(`intents.${i.id}.desc`)}</span>
                        <span className="contact-intent-cta">{t(`intents.${i.id}.cta`)} →</span>
                      </a>
                    ) : (
                      <Link className="contact-intent-main" href={i.href}>
                        <span className="contact-intent-title">{t(`intents.${i.id}.title`)}</span>
                        <span className="contact-intent-desc">{t(`intents.${i.id}.desc`)}</span>
                        <span className="contact-intent-cta">{t(`intents.${i.id}.cta`)} →</span>
                      </Link>
                    )}
                    {i.secondary ? (
                      <Link className="contact-intent-secondary" href={i.secondary.href}>
                        {i.secondary.label} →
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </section>
          {/* Form + channels */}
          <section className="section">
            <div className="container contact-container">
              <div className="contact-layout">
                {/* The form */}
                <div className="contact-form-col">
                  <h2 className="contact-section-label">{t("formHeading")}</h2>
                  <ContactForm copy={formCopy} />
                </div>

                {/* Direct channels */}
                <aside className="contact-channels-col">
                  <h2 className="contact-section-label">{t("directHeading")}</h2>

                  {/* Email — rendered client-side (ObfuscatedEmail) so the plain
                      address is never in the static HTML for spam crawlers. */}
                  <ObfuscatedEmail
                    label={t("emailLabel")}
                    user={emailUser}
                    domain={emailDomain}
                  />

                  {/* Configured channels — routing from config, display text
                      from i18n (contact.channels.<id>.label/.description). */}
                  {channels.map((c) => (
                    <a
                      key={c.id}
                      className="contact-channel"
                      href={attributeRedEducationUrl(c.url, { pageType: "contact", locale, cta: c.id })}
                      {...(c.external
                        ? { target: "_blank", rel: externalRel(c.url) }
                        : {})}
                    >
                      <span className="contact-channel-label">{t(`channels.${c.id}.label`)}</span>
                      <span className="contact-channel-desc">{t(`channels.${c.id}.description`)}</span>
                    </a>
                  ))}
                </aside>
              </div>
            </div>
          </section>

          {/* Content removal / correction route (PRIME 2026-07-23). Pairs with
              the good-faith notice on every vendor-linked study guide. */}
          <section className="section" id="correction">
            <div className="container">
              <h2 className="contact-section-label">{t("takedownHeading")}</h2>
              <p className="colophon-body">
                {t("takedownBody")}{" "}
                <Link href="/disclaimer">{t("takedownLink")} →</Link>
              </p>
            </div>
          </section>
        </article>
        {/* Translations pointer (PRIME 2026-08-06). A mention rather than a
            section: the substance lives on /contribute/tools, and somebody on
            the contact page is already looking for a way to reach me. */}
        <section className="section">
          <div className="container section-narrow">
            <p className="section-body">{t("translations")}</p>
            <p className="section-cta">
              <Link href="/contribute/tools" className="section-cta-link">
                /contribute/tools &rarr;
              </Link>
            </p>
          </div>
        </section>

      </main>

      <SiteFooter />
    </>
  );
}

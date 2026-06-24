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
import {
  contactEmail,
  contactChannels,
  contactEmailIsPlaceholder,
} from "@/config/contact";

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
  };

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="contact-hero">
            <div className="container contact-container">
              <h1 className="contact-title">{t("title")}</h1>
              <p className="contact-lede">{t("lede")}</p>
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

                  {/* Email */}
                  <a className="contact-channel" href={`mailto:${contactEmail()}`}>
                    <span className="contact-channel-label">{t("emailLabel")}</span>
                    <span className="contact-channel-desc">{contactEmail()}</span>
                  </a>

                  {/* Configured channels */}
                  {channels.map((c) => (
                    <a
                      key={c.label}
                      className="contact-channel"
                      href={c.url}
                      {...(c.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      <span className="contact-channel-label">{c.label}</span>
                      <span className="contact-channel-desc">{c.description}</span>
                    </a>
                  ))}
                </aside>
              </div>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// src/app/[locale]/about/cv/page.tsx  -  the CV (/about/cv)
// ----------------------------------------------------------------------------
// WHY (PRIME, 27/10/2026 23:12: "Yes on the CV, but the e-mail address needs to
// be spam-crawler-proof"). One general CV in English and Portuguese, the version
// a training customer, a partner or a recruiter asks for. The role-tailored
// résumés and the cover letters stay private: tailoring works one-to-one, and a
// public set of ten reads as a search in ten directions.
//
// ONE SOURCE OF TRUTH. Nothing here is typed twice. The path is
// src/content/career/path.ts (the About page reads the same entries) with each
// entry's text in about.path.<key>; the credentials are
// src/content/certifications/data.ts (the Credentials page reads the same
// lists); the summary is the About page's own role line and lede; the profiles
// are the contact config's channels; the endorsement count is the testimonials
// file's. Correct a fact in its one place and both pages follow.
//
// THE ADDRESS. ProtectedEmail shows a button; the address is decoded in the
// browser only when the visitor asks (src/lib/protected-email.ts), so it is in
// no HTML, no page data and no bundle in readable form. "Save as PDF" prints the
// page through the browser after revealing it: there is no PDF on the server.
//
// The page sits under /about, so the about layout's PersonSchema (JSON-LD) is
// already on it.
//
// THE MEDIA KIT (PRIME, 27/10/2026 23:51: "How about including a media kit in the
// same page, with Bio, profile, etc?"). Below the CV, at #media-kit: bios in
// three lengths (written from facts the site already states, each with Copy),
// facts at a glance computed from the same data the CV reads, the talks from
// the Speaking page, the profiles and the protected address. Headshots join when
// PRIME supplies approved photos.
// ============================================================================
import { getTranslations, setRequestLocale } from "next-intl/server"; // translations
import { Link } from "@/i18n/navigation"; // locale-aware links
import Header from "@/components/Header"; // the site header
import SiteFooter from "@/components/SiteFooter"; // the site footer
import ProtectedEmail from "@/components/ProtectedEmail"; // the address behind a button
import CvPrintButton from "@/components/CvPrintButton"; // Save as PDF
import CopyTextButton from "@/components/CopyTextButton"; // Copy for the bios
import { CAREER_PATH, careerYears } from "@/content/career/path"; // the path
import { instructorAuthorizations, currentCertifications, recognition } from "@/content/certifications/data"; // credentials
import { contactChannels } from "@/config/contact"; // the profiles
import { TESTIMONIAL_COUNT } from "@/content/testimonials/data"; // the endorsements

/** The page's title: the CV's name and the person's. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // the locale
  const t = await getTranslations({ locale, namespace: "cv" }); // the page's words
  return { title: t("metaTitle"), description: t("metaDescription") }; // title and description
}

/** The profiles the CV lists, in this order (LinkedIn, Credly; the site itself is added first). */
const PROFILE_IDS = ["linkedin", "credly"] as const;

export default async function CvPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // the locale
  setRequestLocale(locale); // static rendering
  const t = await getTranslations("cv"); // the page's words
  const ta = await getTranslations("about"); // the About page's words (role, lede, path)
  const tc = await getTranslations("contact"); // the channel labels
  const ts = await getTranslations("speaking"); // the talks and the delivery languages
  const platforms = [...new Set(instructorAuthorizations.map((c) => c.issuer))]; // the platforms taught, from the authorizations
  const copyWords = { label: t("copyBio"), done: t("copiedBio") }; // the bios' Copy button
  const BIOS = ["bioShort", "bioMedium", "bioLong"] as const; // the three lengths
  const channels = contactChannels().filter((c) => (PROFILE_IDS as readonly string[]).includes(c.id)); // the profiles
  const path = [...CAREER_PATH].reverse(); // newest first, as a CV reads

  return (
    <>
      <Header />
      <main id="main" className="cv-page">
        <article className="container cv-container">
          {/* Back to About: the CV lives under it. */}
          <Link href="/about" className="article-back cv-noprint">← {t("backToAbout")}</Link>
          {/* The media kit is the second half of the page: a jump to it for the organiser or journalist who came for it. */}
          <p className="cv-jump cv-noprint"><a href="#media-kit">{t("jumpToKit")} ↓</a></p>

          {/* The head: name, role, place and languages, contact. */}
          <header className="cv-head">
            <p className="cv-eyebrow">{t("eyebrow")}</p>
            <h1 className="cv-name">Rodolfo Nützmann</h1>
            <p className="cv-role">{ta("role")}</p>
            <p className="cv-place">{t("place")}</p>
            <ul className="cv-contact">
              <li className="cv-contact-item">
                <span className="cv-contact-label">{t("emailLabel")}</span>
                <ProtectedEmail id="cv" copy={{ show: t("showEmail"), copy: t("copyEmail"), copied: t("copiedEmail") }} />
              </li>
              <li className="cv-contact-item">
                <span className="cv-contact-label">{t("siteLabel")}</span>
                <a href="https://ronutz.com" className="cv-contact-link">ronutz.com</a>
              </li>
              {channels.map((c) => (
                <li key={c.id} className="cv-contact-item">
                  <span className="cv-contact-label">{tc(`channels.${c.id}.label`)}</span>
                  <a href={c.url} className="cv-contact-link" target="_blank" rel="noopener noreferrer">{c.url.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "")}</a>
                </li>
              ))}
            </ul>
            <CvPrintButton label={t("print")} hint={t("printHint")} />
          </header>

          {/* Summary: the About page's lede. */}
          <section className="cv-section">
            <h2 className="cv-section-title">{t("summary")}</h2>
            <p className="cv-text">{ta("lede")}</p>
          </section>

          {/* Experience: the path, newest first. */}
          <section className="cv-section">
            <h2 className="cv-section-title">{t("experience")}</h2>
            <ol className="cv-jobs">
              {path.map((e) => (
                <li key={e.key} className="cv-job">
                  <p className="cv-job-head">
                    <span className="cv-job-years mono">{careerYears(e, ta("path.present"))}</span>
                    <span className="cv-job-where">{e.where ?? ta(`path.${e.key}Where`)}</span>
                  </p>
                  <p className="cv-text">{ta(`path.${e.key}`)}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Instructor authorizations: the Credentials page's list. */}
          <section className="cv-section">
            <h2 className="cv-section-title">{t("authorizations")}</h2>
            <ul className="cv-creds">
              {instructorAuthorizations.map((c) => (
                <li key={c.name} className="cv-cred">
                  <span className="cv-cred-name">{c.name}</span>
                  {c.period && <span className="cv-cred-period mono">{c.period}</span>}
                </li>
              ))}
            </ul>
          </section>

          {/* Current certifications: the Credentials page's list. */}
          <section className="cv-section">
            <h2 className="cv-section-title">{t("certifications")}</h2>
            <ul className="cv-creds">
              {currentCertifications.map((c) => (
                <li key={c.name} className="cv-cred">
                  <span className="cv-cred-name">{c.name}</span>
                  {c.period && <span className="cv-cred-period mono">{c.period}</span>}
                </li>
              ))}
            </ul>
          </section>

          {/* Recognition: the Credentials page's list. */}
          <section className="cv-section">
            <h2 className="cv-section-title">{t("recognition")}</h2>
            <ul className="cv-creds">
              {recognition.map((c) => (
                <li key={c.name} className="cv-cred">
                  <span className="cv-cred-name">{c.name}</span>
                  {c.period && <span className="cv-cred-period mono">{c.period}</span>}
                </li>
              ))}
            </ul>
          </section>

          {/* Where to read more: the full record, on the site and its evidence. */}
          <section className="cv-section cv-more">
            <h2 className="cv-section-title">{t("more")}</h2>
            <ul className="cv-more-links">
              <li><Link href="/about">{t("moreAbout")}</Link></li>
              <li><Link href="/about/credentials">{t("moreCredentials")}</Link></li>
              <li><Link href="/endorsements">{t("moreEndorsements", { count: TESTIMONIAL_COUNT })}</Link></li>
              <li><Link href="/training">{t("moreTraining")}</Link></li>
            </ul>
          </section>

          {/* ---- THE MEDIA KIT -------------------------------------------------------------------- */}
          <section id="media-kit" className="cv-kit">
            <h2 className="cv-kit-title">{t("kitTitle")}</h2>
            <p className="cv-text">{t("kitIntro")}</p>

            {/* The photo (PRIME supplied it on 27/10/2026), with downloads and the terms of use
                (LICENSES/LicenseRef-MediaKit-Photo.txt, registered in REUSE.toml). */}
            <div className="cv-section cv-photo">
              <h3 className="cv-section-title">{t("photo")}</h3>
              <img src="/img/people/rodolfo-nutzmann-400.jpg" width={200} height={200} alt={t("photoAlt")} className="cv-photo-img" />
              <p className="cv-photo-links cv-noprint">
                <a href="/img/people/rodolfo-nutzmann-400.jpg" download>{t("photoJpeg")}</a>
                <a href="/img/people/rodolfo-nutzmann-400.png" download>{t("photoPng")}</a>
              </p>
              <p className="cv-photo-use">{t("photoUse")}</p>
            </div>

            {/* The bios: three lengths, third person, each with Copy. */}
            <div className="cv-section">
              <h3 className="cv-section-title">{t("bios")}</h3>
              {BIOS.map((b) => (
                <div key={b} className="cv-bio">
                  <p className="cv-bio-head">
                    <span className="cv-bio-label">{t(`${b}Label`)}</span>
                    <span className="cv-noprint"><CopyTextButton text={t(b)} {...copyWords} /></span>
                  </p>
                  <p className="cv-text cv-bio-text">{t(b)}</p>
                </div>
              ))}
            </div>

            {/* Facts at a glance, computed from the data the CV reads. */}
            <div className="cv-section">
              <h3 className="cv-section-title">{t("facts")}</h3>
              <dl className="cv-facts">
                <dt>{t("factName")}</dt><dd>Rodolfo Nützmann</dd>
                <dt>{t("factRole")}</dt><dd>{ta("role")}</dd>
                <dt>{t("factBase")}</dt><dd>{t("factBaseValue")}</dd>
                <dt>{t("factSince")}</dt><dd className="mono">{CAREER_PATH[0].from}</dd>
                <dt>{t("factPlatforms")}</dt><dd>{platforms.join(" · ")}</dd>
                <dt>{t("factCerts")}</dt><dd className="mono">{currentCertifications.length}</dd>
                <dt>{t("factRecognition")}</dt><dd>{recognition.map((r) => `${r.name} (${r.period})`).join(" · ")}</dd>
                <dt>{t("factLanguages")}</dt><dd>{ts("factLanguage")}</dd>
              </dl>
            </div>

            {/* The talks, from the Speaking page. */}
            <div className="cv-section">
              <h3 className="cv-section-title">{t("talks")}</h3>
              <ul className="cv-more-links">
                <li><strong>{ts("talk1Title")}</strong>: {ts("talk1Sub")}</li>
                <li><strong>{ts("talk2Title")}</strong>: {ts("talk2Sub")}</li>
              </ul>
              {/* The way to the Speaking page, set apart from the list and coloured as a link (it read as plain text). */}
              <p className="cv-text cv-talks-link"><Link href="/speaking">{t("talksLink")} <span aria-hidden="true">&#8594;</span></Link></p>
            </div>

            {/* Contact for interviews and bookings: the same protected address. */}
            <div className="cv-section">
              <h3 className="cv-section-title">{t("kitContact")}</h3>
              <p className="cv-text">{t("kitContactBody")}</p>
              <ProtectedEmail id="cv" copy={{ show: t("showEmail"), copy: t("copyEmail"), copied: t("copiedEmail") }} />
            </div>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

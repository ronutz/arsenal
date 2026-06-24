// ============================================================================
// src/app/[locale]/learn/page.tsx
// ----------------------------------------------------------------------------
// THE LEARN SECTION INDEX — surface (b): the standalone reference/Learn area.
//
// Lists every article (for the active locale, English fallback) as a scannable
// set of cards. This is the independent "documentation / learn" section you
// asked for, distinct from the in-tool panels but fed by the SAME loader
// (src/lib/learn.ts) — one content source, two surfaces.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllArticles } from "@/lib/learn";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

export default async function LearnIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tNav = await getTranslations("nav");
  // Articles come from the shared loader (English fallback handled inside).
  const articles = getAllArticles(locale);

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container">
            <p className="hero-eyebrow">Learn</p>
            <h1 className="section-title" style={{ fontSize: "clamp(1.75rem, 5vw, 2.75rem)" }}>
              Network and security concepts, explained clearly.
            </h1>
            <p className="section-body" style={{ marginBottom: "2.5rem" }}>
              Practical explanations of the concepts behind the tools. Each article is written to
              build genuine understanding, not just to define a term.
            </p>

            <ul className="learn-grid">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link href={`/learn/${a.slug}`} className="learn-card">
                    <h2 className="learn-card-title">{a.title}</h2>
                    <p className="learn-card-summary">{a.summary}</p>
                    <span className="learn-card-cta">Read</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

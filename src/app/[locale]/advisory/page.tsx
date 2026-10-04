// ============================================================================
// src/app/[locale]/advisory/page.tsx
// ----------------------------------------------------------------------------
// ADVISORY — independent technical judgement for consequential decisions,
// delivered personally and contracted through Red Education.
//
// REVISED 2026-10-03 (PRIME: "implement all suggestions" of the independent
// review of this page). The review's diagnosis was that the page proved the
// author thoughtful and technically serious better than it made the engagement
// easy to understand, buy, justify internally and contract. Its priorities,
// all implemented here:
//   P0  "my own practice" against "contracted through Red Education" resolved;
//       independence defined precisely rather than broadly; an advisory
//       carve-out added to the site disclaimer.
//   P1  an example decision memorandum (fictional, labelled, its own page);
//       analogous work shown in the clients' own words; the absolute
//       anti-vendor sentences replaced; engagement SHAPES (not packages); the
//       page's title and description made advisory-specific.
//   P2  speaking reduced to one cross-link (it has its own page); the
//       endorsements segmented by kind; retained technical counsel added as the
//       third of three ways to engage; the public corpus linked as due
//       diligence.
// plus the follow-up PRIME wrote in the same review: when a decision leads to
// implementation, Red Education's Professional Services is one credible option,
// never the predetermined destination of the recommendation.
//
// WHAT THIS SUPERSEDES, so the history reads straight:
//   - 2026-08-12 placed the contracting card directly below the hero. The
//     review's funnel puts the commercial relationship after "how it works" and
//     before the call to action, where a reader meets it knowing what is being
//     contracted. Moved, and renamed "How this is contracted".
//   - 2026-09-05 (fourth round) kept Red Education out of the copy except in
//     that card. The review, and PRIME's own follow-up, bring it back in two
//     exact places: the precise definition of independence, and the
//     professional-services boundary. Nowhere else.
//   - 2026-08-06 removed the practice-corpus section as a claim about output
//     masquerading as a claim about independence. It returns under a different
//     argument: not proof of independence but public due diligence on how the
//     advisor reasons, placed after the evidence rather than inside the
//     independence argument.
//   - The flat "six kinds of work" became seven engagement shapes, each led by
//     the buyer's question and closed by what comes back, which resolves the
//     review's "one offer, then six offers" reading. The sentences PRIME liked
//     in the old cards were kept inside the shapes.
//
// WHY "ADVISORY" RATHER THAN "CONSULTING" (PRIME's ruling, 2026-08-06) still
// holds: consulting, to this industry, means the two-in-the-morning call.
// Advisory signals judgement, scoped and scheduled. The boundary section says
// so in words, and now also says where implementation can go afterwards.
//
// WHAT IS STILL DELIBERATELY ABSENT: training and enablement of every kind.
// All education flows through Red Education, and the page says so.
//
// ENTITY NAMING: the contracting company is Red Education, named. §9.4 keeps
// the private vehicle out of ordinary public copy, and nothing here needs it.
//
// STRUCTURE (the review's funnel): hero -> the problem -> your advisor -> when
// this is useful -> one model, seven shapes -> what you receive -> three ways
// to engage -> what independent means -> where this comes from (evidence) ->
// inspect the reasoning -> what I do not provide, and where implementation
// goes -> what I will not do -> how it runs -> how it is contracted -> contact.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ReduBrand from "@/components/ReduBrand";
// MARK (PRIME 2026-10-04): the Red Education wordmark on the two cards that name it.
import VendorMark from "@/components/VendorMark";
import { AdvisoryServiceSchema } from "@/components/AdvisoryServiceSchema";
import { TESTIMONIALS } from "@/content/testimonials/data";
import { ADVISORY_EVIDENCE_IDS } from "@/content/testimonials/kinds";
import { attributeRedEducationUrl, externalRel } from "@/config/redEducation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "advisory" });
  // The review found the page surfacing in search under the site's generic
  // title. The <title> and description are now the advisory proposition, by
  // name; the social card keeps the h1 as its alt text.
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    ...ogImages("page", "advisory", locale, t("title")),
  };
}

export default async function AdvisoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("advisory");
  // The era caption for the marks' alt text, and the year the current mark is looked up for.
  const tMarks = await getTranslations("partnerVendors");
  const markEra = (e: string) => tMarks("markEra", { era: e });
  // "since {year}" in the page's language, for the mark's alt text.
  const markSince = (y: number) => tMarks("markSince", { year: y });
  const thisYear = new Date().getFullYear();
  const tNav = await getTranslations("nav");

  // The "Not offered here" entries, DERIVED FROM THE MESSAGES rather than
  // hardcoded (one fact in one place; a new exclusion is an edit to the two
  // message files and nothing else). Capped so a malformed pack cannot spin.
  const exclusionIndices: number[] = [];
  for (let n = 1; n <= 20 && t.has(`exclusion${n}Term`); n += 1) {
    exclusionIndices.push(n);
  }

  // The five situations the engagement is useful in, same derivation.
  const whenIndices: number[] = [];
  for (let n = 1; n <= 10 && t.has(`when${n}Term`); n += 1) {
    whenIndices.push(n);
  }

  // The engagement shapes, same derivation: each has a title, the buyer's
  // question, what comes back, and the paragraph only experience writes.
  const shapeIndices: number[] = [];
  for (let n = 1; n <= 12 && t.has(`shape${n}Title`); n += 1) {
    shapeIndices.push(n);
  }

  // The three ways to engage, in order of commitment.
  // Their anchors, by position (see the list below): the retained arrangement's
  // is the one the second review asked for by name.
  const LAYER_ANCHORS: Record<number, string> = {
    1: "independent-decision-review",
    2: "executive-technical-advisory",
    3: "retained-technical-counsel",
  };
  const layerIndices: number[] = [];
  for (let n = 1; n <= 5 && t.has(`layer${n}Title`); n += 1) {
    layerIndices.push(n);
  }

  // The fourteen headings of the memorandum, listed in "What you receive" so a
  // reader sees the structure before opening the example. Same derivation as
  // the lists above; the example page uses the same headings in its body.
  const memoIndices: number[] = [];
  for (let n = 1; n <= 20 && t.has(`memoOutline${n}`); n += 1) {
    memoIndices.push(n);
  }

  // The evidence: entries chosen in kinds.ts, rendered verbatim from the
  // catalogue by id, each under the one-line framing the messages hold. The
  // framing is derived from the quotation's own text and never adds to it.
  const evidence = ADVISORY_EVIDENCE_IDS.map((id) => TESTIMONIALS.find((x) => x.id === id)).filter(
    (q): q is NonNullable<typeof q> => Boolean(q),
  );

  // The one outbound Red Education link on this page, attributed at render as
  // the standing UTM schema requires. It lands on the professional-services
  // page, which is a declared destination of check-red-education-links.
  const psUrl = attributeRedEducationUrl("https://www.rededucation.com/professional-services/", {
    pageType: "advisory",
    locale,
    cta: "professional-services",
  });

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          <AdvisoryServiceSchema locale={locale} name={t("title")} description={t("metaDescription")} />

          {/* Hero: the positioning statement the review recommended, narrowed
              at once to the domain, the moment and the deliverable. */}
          <section className="section">
            <div className="container section-narrow">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
              <p className="section-body">{t("positioning")}</p>
            </div>
          </section>

          {/* THE PROBLEM (PRIME 2026-09-05, from the boutique-services
              literature), kept first. The two absolute sentences the review
              flagged are gone: the copy now says most of what reaches the table
              carries a quota, not all of it, and that commercial interest
              changes the context of a recommendation rather than voiding it. */}
          <section className="section section-accent">
            <div className="container section-narrow">
              <h2 className="section-title">{t("problemTitle")}</h2>
              <p className="section-body" style={{ whiteSpace: "pre-line" }}>
                {t("problemBody")}
              </p>
            </div>
          </section>

          {/* YOUR ADVISOR (PRIME 2026-08-16): mirrors the /training block.
              The sentence "this practice is my own" is gone; the analysis is
              his and carries his name, and the contracting is stated below. */}
          <section className="section teach-advisor">
            <div className="container teach-container">
              <p className="teach-instructor-eyebrow">{t("advisorEyebrow")}</p>
              <div className="teach-instructor-card">
                <div className="teach-instructor-text">
                  <h2 className="teach-instructor-name">Rodolfo Nützmann</h2>
                  <p className="teach-instructor-body">{t("advisorBody")}</p>
                </div>
                <div className="teach-instructor-links">
                  <Link href="/about/credentials" className="teach-instructor-link teach-instructor-link--primary">
                    {t("advisorLinkCreds")}
                  </Link>
                  <Link href="/industry/chapters" className="teach-instructor-link">
                    {t("advisorLinkCareer")}
                  </Link>
                  <Link href="/endorsements" className="teach-instructor-link">
                    {t("advisorLinkEndorsements")}
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* WHEN THIS IS USEFUL: the buyer, stated rather than left to be
              inferred. Five situations; the review called this the single
              biggest aid to self-selection. */}
          <section className="section">
            <div className="container section-narrow">
              <h2 className="section-title">{t("whenTitle")}</h2>
              <p className="section-body">{t("whenLede")}</p>
              <ul className="advisory-when">
                {whenIndices.map((n) => (
                  <li key={n}>
                    <span className="advisory-when-term">{t(`when${n}Term`)}</span>
                    <span className="advisory-when-body">{t(`when${n}Body`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ONE MODEL, SEVERAL DECISIONS. Shapes, not packages: each card is the
              buyer's question, what comes back, and the paragraph that only
              somebody who has done it many times writes. */}
          <section className="section section-accent" id="shapes">
            <div className="container">
              <h2 className="section-title">{t("shapesTitle")}</h2>
              <p className="section-body" style={{ maxWidth: "70ch" }}>
                {t("shapesLede")}
              </p>
              <ul className="advisory-shapes">
                {shapeIndices.map((n) => (
                  <li key={n} className="advisory-shape">
                    <h3 className="advisory-shape-title">{t(`shape${n}Title`)}</h3>
                    <div className="advisory-shape-row">
                      <span className="advisory-shape-label">{t("shapeQuestionLabel")}</span>
                      <span className="advisory-shape-question">{t(`shape${n}Question`)}</span>
                      <span className="advisory-shape-label">{t("shapeOutputLabel")}</span>
                      <span className="advisory-shape-output">{t(`shape${n}Output`)}</span>
                    </div>
                    <p className="advisory-shape-body">{t(`shape${n}Body`)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* WHAT YOU RECEIVE. The review's single highest-value conversion
              point: show the deliverable. The structure is listed here and a
              complete fictional example lives on its own page. */}
          <section className="section" id="what-you-receive">
            <div className="container section-narrow">
              <h2 className="section-title">{t("receiveTitle")}</h2>
              <p className="section-body">{t("receiveBody")}</p>
              <ol className="advisory-memo-outline">
                {memoIndices.map((n) => (
                  <li key={n}>{t(`memoOutline${n}`)}</li>
                ))}
              </ol>
              <p className="section-cta">
                <Link href="/advisory/decision-memorandum" className="btn btn-secondary">
                  {t("receiveLink")}
                </Link>
              </p>
              <p className="advisory-note">{t("receiveNote")}</p>
            </div>
          </section>

          {/* THREE WAYS TO ENGAGE. The flagship, then the two shapes for
              questions that do not fit inside one decision, including the
              retained arrangement the review proposed in place of a
              "fractional CTO" label, with its exclusions stated. */}
          <section className="section section-accent" id="ways-to-engage">
            <div className="container section-narrow">
              <h2 className="section-title">{t("layersTitle")}</h2>
              <p className="section-body">{t("layersLede")}</p>
              <ol className="advisory-layers">
                {layerIndices.map((n) => (
                  // Each way to engage carries a stable, locale-agnostic anchor
                  // (second review, 2026-10-04): /advisory/#retained-technical-counsel
                  // lets a prospect be sent straight to the retained arrangement
                  // without giving it a page of its own before there is evidence
                  // for one. The ids are fixed here, not derived from the titles,
                  // so a rewording never breaks a link already sent.
                  <li key={n} className="advisory-layer" id={LAYER_ANCHORS[n] ?? undefined}>
                    <h3 className="advisory-layer-title">{t(`layer${n}Title`)}</h3>
                    <p className="advisory-layer-body">{t(`layer${n}Body`)}</p>
                  </li>
                ))}
              </ol>
              {/* The pricing basis (second review, item 11): how the money
                  behaves, since the figures come only after scoping. One fee per
                  scoped engagement, a term for the retainer, proposal and
                  invoice from Red Education; no numbers, which are not this
                  page's to publish. */}
              <p className="advisory-note advisory-layers-basis">{t("layersBasis")}</p>
            </div>
          </section>

          {/* INDEPENDENCE, DEFINED. The review's P0: say exactly which kinds of
              independence are claimed and which are not, now that the
              contracting party also sells training and professional services.
              The trust-equation paragraph is replaced by the sentence that is
              harder to argue with. ReduBrand styles the two mentions. */}
          <section className="section" id="independence">
            <div className="container section-narrow">
              <h2 className="section-title">{t("independenceTitle")}</h2>
              <p className="section-body" style={{ whiteSpace: "pre-line" }}>
                <ReduBrand>{t("independenceBody")}</ReduBrand>
              </p>
            </div>
          </section>

          {/* WHERE THIS COMES FROM, IN THE CLIENT'S WORDS. The 1996-2020 record
              paragraph, then the advisory-shaped endorsements verbatim: #38
              (procurement and selection, a client's word), #63 (design across
              suppliers, a client's word, featured since 2026-09-06), #42
              (analysis quality) and #28 (how designs were made). #70 stays
              out, as the 2026-09-06 decision recorded. Each quotation is the
              recorded English where the original is Portuguese, and says so. */}
          <section className="section section-accent">
            <div className="container section-narrow">
              <h2 className="section-title">{t("recordTitle")}</h2>
              <p className="section-body">{t("recordBody")}</p>
              <p className="section-body">{t("evidenceLede")}</p>
              <ul className="advisory-evidence">
                {evidence.map((q) => {
                  const text = q.textEnglish ?? q.text;
                  return (
                    <li key={q.id}>
                      <p className="advisory-evidence-frame">{t(`evidence${q.id}`)}</p>
                      <figure className="about-featured-quote">
                        <blockquote className="about-featured-quote-text">
                          {text.split("\n").map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </blockquote>
                        <figcaption className="about-featured-quote-meta">
                          <span className="about-featured-quote-author">{q.author}</span>
                          {q.title ? <span className="about-featured-quote-title">{q.title}</span> : null}
                          {q.relationship ? (
                            <span className="about-featured-quote-title">{q.relationship}</span>
                          ) : null}
                          <span className="about-featured-quote-source">
                            {q.source} &middot; {q.date}
                            {q.lang !== "EN" ? ` · ${t("evidenceTranslated")}` : ""}
                          </span>
                        </figcaption>
                      </figure>
                    </li>
                  );
                })}
              </ul>
              <p className="section-cta">
                <Link href="/endorsements?kind=advisory" className="btn btn-secondary">
                  {t("evidenceAllLink")}
                </Link>
              </p>
            </div>
          </section>

          {/* INSPECT THE REASONING. The corpus as public due diligence on how
              the advisor thinks, which is the argument the review made for it;
              not as proof of independence, which is the argument removed on
              2026-08-06. */}
          <section className="section">
            <div className="container section-narrow">
              <h2 className="section-title">{t("reasonTitle")}</h2>
              <p className="section-body">{t("reasonBody")}</p>
              <div className="advisory-corpus-links">
                <Link href="/tools" className="btn btn-secondary">{t("reasonLinkTools")}</Link>
                <Link href="/learn" className="btn btn-secondary">{t("reasonLinkLearn")}</Link>
                <Link href="/practice" className="btn btn-secondary">{t("reasonLinkPractice")}</Link>
                <Link href="/industry" className="btn btn-secondary">{t("reasonLinkIndustry")}</Link>
              </div>
            </div>
          </section>

          {/* THE BOUNDARY, then where implementation can go. The exclusions
              stay as a list a reader can scan; the professional-services card
              turns "I do not implement" from a dead end into a path, with Red
              Education as one credible option and the choice left with the
              client, as PRIME put it in the review. */}
          <section className="section section-accent" id="not-provided">
            <div className="container section-narrow">
              <h2 className="section-title">{t("scopeTitle")}</h2>
              <p className="section-body">{t("scopeIn")}</p>
              <h3 className="vendor-note-title advisory-scope-out-title">{t("scopeOutTitle")}</h3>
              <ul className="advisory-exclusions">
                {exclusionIndices.map((n) => (
                  <li key={n}>
                    <span className="advisory-exclusion-term">{t(`exclusion${n}Term`)}</span>
                    <span className="advisory-exclusion-body">
                      <ReduBrand>{t(`exclusion${n}Body`)}</ReduBrand>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="vendor-note advisory-ps" id="implementation">
                <VendorMark vendor="rededucation" year={thisYear} eraLabel={markEra} since={markSince} compact />
                <p className="vendor-note-title">{t("psTitle")}</p>
                <p className="vendor-note-body">
                  <ReduBrand>{t("psBody")}</ReduBrand>
                </p>
                <p className="vendor-note-body">
                  <a href={psUrl} target="_blank" rel={externalRel(psUrl)} className="advisory-ps-link">
                    {t("psLink")}
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* EARNING THE RIGHT (PRIME 2026-09-05): the negative promise a
              competitor cannot copy identically. Unchanged. */}
          <section className="section">
            <div className="container section-narrow">
              <h2 className="section-title">{t("earnTitle")}</h2>
              <p className="section-body">{t("earnBody")}</p>
            </div>
          </section>

          {/* How an engagement runs. Step two now says the scope names which
              kind of review a post-incident engagement is. */}
          <section className="section section-accent" id="how-an-engagement-runs">
            <div className="container section-narrow">
              <h2 className="section-title">{t("howTitle")}</h2>
              <ol className="course-list">
                <li>{t("howStep1")}</li>
                <li>{t("howStep2")}</li>
                <li>{t("howStep3")}</li>
                <li>{t("howStep4")}</li>
              </ol>
            </div>
          </section>

          {/* HOW THIS IS CONTRACTED: the former "Before you read further" card,
              where the funnel puts the commercial relationship. The amber
              phrase (PRIME 2026-09-05) is kept inside the translated string. */}
          <section className="section" id="how-this-is-contracted">
            <div className="container section-narrow">
              <div className="vendor-note">
                <VendorMark vendor="rededucation" year={thisYear} eraLabel={markEra} since={markSince} compact />
                <p className="vendor-note-title">{t("disclaimerTitle")}</p>
                <p className="vendor-note-body">
                  <ReduBrand>
                    {t.rich("disclaimerBody", {
                      amber: (chunks) => <span className="vendor-note-emphasis">{chunks}</span>,
                    })}
                  </ReduBrand>
                </p>
              </div>
            </div>
          </section>

          {/* Contact, and the one cross-link to speaking. */}
          <section className="section section-accent">
            <div className="container section-narrow">
              <h2 className="section-title">{t("ctaTitle")}</h2>
              <p className="section-body">{t("ctaBody")}</p>
              <p className="section-cta">
                <Link href="/contact" className="btn btn-primary">
                  {t("ctaButton")}
                </Link>
              </p>
              <p className="advisory-speaking-note">
                {t("speakingNote")} <Link href="/speaking">{t("speakingLink")}</Link>
              </p>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}

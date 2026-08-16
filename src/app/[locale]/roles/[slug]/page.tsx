// ============================================================================
// /roles/[slug] - one position.
//
// The nine sections run in a fixed order, and two of them sit side by side on
// purpose: what the role is ACCOUNTABLE FOR and what it is MEASURED ON. Those
// lists differ in every job worth writing about, and the distance between them
// is what `turnsOn` then names.
// ============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LIVE_LOCALE_CODES } from "@/i18n/locales";
import { ROLES, findRole, rolesLeadingHere } from "@/lib/roles";
import { practiceByRole, getPracticeArticle } from "@/lib/practice";

import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";
export function generateStaticParams() {
  return LIVE_LOCALE_CODES.flatMap((locale) => ROLES.map((r) => ({ locale, slug: r.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const role = findRole(slug);
  if (!role) return {};
  const t = await getTranslations({ locale, namespace: "roles" });
  return { title: `${role.title} - ${t("title")}`, description: role.whatItIs.slice(0, 155) };
}

export default async function RolePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const role = findRole(slug);
  if (!role) notFound();
  const t = await getTranslations({ locale, namespace: "roles" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  /* The citation, assembled from the parts the guard requires. A bare marker
     cannot reach this point - check-roles rejects it at build time. */
  const citation =
    role.provenance.kind === "documented"
      ? t("provenance.documented")
      : `${t(`provenance.${role.provenance.kind}`)} - ${role.provenance.where}, ${role.provenance.when}`;

  /* Articles from The Practice carrying any of this role's tags. Deduplicated
     by slug and capped, because a role tagged `second-line` matches most of the
     corpus and an uncapped list would bury the page it sits on. */
  /* WHO LEADS HERE — the reverse of "where it leads", computed rather than
     maintained, and filtered so a mutual pair appears once. See
     rolesLeadingHere() for why making every claim symmetric was the wrong
     repair. */
  const leadHere = rolesLeadingHere(slug).filter((r) => !role.adjacentRoles.includes(r.slug));

  /* Selection first, filter as fallback — see Role.practiceArticles. */
  const chosen = (role.practiceArticles ?? [])
    .map((slugName) => getPracticeArticle(locale, slugName))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const seen = new Set<string>();
  const derived = role.practiceRoles
    .flatMap((r) => practiceByRole(locale, r as never))
    .filter((a) => (seen.has(a.slug) ? false : (seen.add(a.slug), true)))
    .slice(0, 8);
  const practiceLinks = chosen.length > 0 ? chosen : derived;

  const List = ({ heading, items }: { heading: string; items: string[] }) => (
    <section className="article-related">
      <h2 className="article-related-title">{heading}</h2>
      <ul className="article-related-list">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </section>
  );

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
      <section className="section">
        <div className="container article-container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[
                { label: tNav("home"), href: "/" },
                { label: t("eyebrow"), href: "/roles" },
                { label: t(`groups.${role.group}.title`), href: "/roles" },
                { label: role.title },
              ]}
            />
          <p className="hero-eyebrow">
            <Link href="/roles">{t("eyebrow")}</Link> {"\u00b7"} {t(`groups.${role.group}.title`)}
          </p>
          <h1 className="article-title">{role.title}</h1>
          {/* PROVENANCE AS A PILL (PRIME 2026-08-16), built on the family-chip
              idiom the rest of the site already uses: a rounded chip whose hue
              comes from --chip-color, with a dot. Amber for a role PRIME held,
              cyan for one he worked alongside, muted for one written from
              published sources. Read from the stylesheet rather than invented —
              LESSONS 11. */}
          <p className="family-chip-row">
            <span
              className="family-chip mono"
              style={
                {
                  "--chip-color":
                    role.provenance.kind === "held"
                      ? "var(--accent-amber)"
                      : role.provenance.kind === "alongside"
                        ? "var(--accent-cyan)"
                        : "var(--color-muted)",
                } as React.CSSProperties
              }
            >
              <span className="family-chip-dot" aria-hidden />
              {citation}
            </span>
          </p>
          <p className="article-summary">{role.whatItIs}</p>
        </div>
      </section>

      {/* ---- THE WORK ITSELF --------------------------------------------------
           PRIME, 2026-08-16: the role pages were "unformatted... bad spacing,
           separation, bad layout, readability". The measurement agreed: NINE
           `article-related` blocks stacked inside ONE container, with no section
           bands at all.

           `article-related` is the READ-NEXT box - one box, at the end of an
           article. Using it nine times rendered the substance of the job (what
           the day is, what it answers for, how it is measured) in the visual
           weight of a footer, with no separation between any two of them.

           Now the SUBSTANCE gets real bands with the site's alternating rhythm,
           and `article-related` is left to the NAVIGATION at the end, which is
           what it was built for. */}
      <section className="section">
        <div className="container article-container">
          <List heading={t("sections.theDay")} items={role.theDay} />
        </div>
      </section>

      <section className="section section-accent">
        <div className="container article-container">
          {/* Side by side, deliberately: what a role answers for and what it is
              measured on are rarely the same thing, and the distance between
              them is the argument this whole corpus makes. */}
          <List heading={t("sections.accountableFor")} items={role.accountableFor} />
          <List heading={t("sections.measuredOn")} items={role.measuredOn} />
        </div>
      </section>

      <section className="section">
        <div className="container article-container">
          <h2 className="section-title">{t("sections.receivesFrom")}</h2>
          <dl className="role-exchange">
            {role.receivesFrom.map((x, i) => (
              <div className="role-exchange-item" key={i}>
                <dt className="role-exchange-who">{x.who}</dt>
                <dd className="role-exchange-what">{x.what}</dd>
              </div>
            ))}
          </dl>

          <h2 className="section-title">{t("sections.serves")}</h2>
          <dl className="role-exchange">
            {role.serves.map((x, i) => (
              <div className="role-exchange-item" key={i}>
                <dt className="role-exchange-who">{x.who}</dt>
                <dd className="role-exchange-what">{x.what}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section section-accent">
        <div className="container article-container">
          <List heading={t("sections.stakeholders")} items={role.stakeholders} />
          <List heading={t("sections.requirements")} items={role.requirements} />
        </div>
      </section>

      {/* The single argument each page makes, given its own band and its own
          weight rather than a line inside a stack of boxes. */}
      <section className="section">
        <div className="container article-container">
          <h2 className="section-title">{t("sections.turnsOn")}</h2>
          <p className="role-turns-on">{role.turnsOn}</p>
        </div>
      </section>

      <section className="section section-accent">
        <div className="container article-container">

          {/* THE RECORD ITSELF. A citation that says "from the record" without
              showing the record is the badge this section was built to avoid,
              so a documented role prints its sources where the reader is. The
              guard already refuses a documented entry with no source; this is
              the half that makes the guarantee visible. */}
          {role.provenance.kind === "documented" && role.provenance.sources && (
            <section className="article-related">
              <h2 className="article-related-title">{t("sections.sources")}</h2>
              <ul className="article-related-list">
                {role.provenance.sources.map((src, i) => (
                  <li key={i}>
                    <a href={src.url} rel="noopener noreferrer" target="_blank" className="article-related-link">
                      <span className="article-related-link-title">{src.label}</span>
                    </a>
                    {/* The note beside the citation, where a reader is. A note
                        that a role has no professional body is a fact ABOUT the
                        role, and keeping it in the data would have hidden the
                        most honest sentence on the page. */}
                    {src.sourceNote ? (
                      <p className="article-related-link-summary">{src.sourceNote}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {role.adjacentRoles.length > 0 && (
            <section className="article-related">
              <h2 className="article-related-title">{t("sections.adjacent")}</h2>
              <ul className="article-related-list">
                {role.adjacentRoles.map((s) => {
                  const other = findRole(s);
                  return other ? (
                    <li key={s}>
                      <Link href={`/roles/${s}`} className="article-related-link">
                        <span className="article-related-link-title">{other.title}</span>
                        <span className="article-related-link-summary">
                          {t(`groups.${other.group}.title`)}
                        </span>
                      </Link>
                    </li>
                  ) : null;
                })}
              </ul>
            </section>
          )}

          {/* THE DOOR INTO THE PRACTICE, resolved rather than gestured at.
              The plan promised that a role page would list the articles already
              tagged with its role; a generic link to /practice was the shape of
              that promise without its substance. These are the actual articles,
              read from the same corpus the Practice index reads. */}
          {leadHere.length > 0 && (
            <section className="article-related">
              <h2 className="article-related-title">{t("sections.leadHere")}</h2>
              <ul className="article-related-list">
                {leadHere.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/roles/${r.slug}`} className="article-related-link">
                      <span className="article-related-link-title">{r.title}</span>
                      <span className="article-related-link-summary">
                        {t(`groups.${r.group}.title`)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {practiceLinks.length > 0 && (
            <section className="article-related">
              <h2 className="article-related-title">{t("sections.practice")}</h2>
              <p className="article-related-link-summary">{t("practiceLede")}</p>
              <ul className="article-related-list">
                {practiceLinks.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/practice/${a.slug}`} className="article-related-link">
                      <span className="article-related-link-title">{a.title}</span>
                      {a.thesis ? (
                        <span className="article-related-link-summary">{a.thesis}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="article-back">
                <Link href="/practice">{t("practiceLink")}</Link>
              </p>
            </section>
          )}
        </div>
      </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}

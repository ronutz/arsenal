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
import Link from "next/link";
import { LIVE_LOCALE_CODES } from "@/i18n/locales";
import { ROLES, findRole } from "@/lib/roles";
import { practiceByRole } from "@/lib/practice";

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

  /* The citation, assembled from the parts the guard requires. A bare marker
     cannot reach this point - check-roles rejects it at build time. */
  const citation =
    role.provenance.kind === "documented"
      ? t("provenance.documented")
      : `${t(`provenance.${role.provenance.kind}`)} - ${role.provenance.where}, ${role.provenance.when}`;

  /* Articles from The Practice carrying any of this role's tags. Deduplicated
     by slug and capped, because a role tagged `second-line` matches most of the
     corpus and an uncapped list would bury the page it sits on. */
  const seen = new Set<string>();
  const practiceLinks = role.practiceRoles
    .flatMap((r) => practiceByRole(locale, r as never))
    .filter((a) => (seen.has(a.slug) ? false : (seen.add(a.slug), true)))
    .slice(0, 8);

  const List = ({ heading, items }: { heading: string; items: string[] }) => (
    <section className="dig-section">
      <h2 className="dig-section-title">{heading}</h2>
      <ul className="dig-notes">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </section>
  );

  return (
    <main className="page">
      <section className="section">
        <div className="container section-narrow">
          <p className="eyebrow">
            <Link href={`/${locale}/roles`}>{t("eyebrow")}</Link> {"\u00b7"} {t(`groups.${role.group}.title`)}
          </p>
          <h1 className="page-title">{role.title}</h1>
          <p className="dig-record-explain mono">{citation}</p>
          <p className="page-lede">{role.whatItIs}</p>
        </div>
      </section>

      <section className="section">
        <div className="container section-narrow">
          <List heading={t("sections.theDay")} items={role.theDay} />
          {/* Side by side, deliberately. */}
          <List heading={t("sections.accountableFor")} items={role.accountableFor} />
          <List heading={t("sections.measuredOn")} items={role.measuredOn} />

          <section className="dig-section">
            <h2 className="dig-section-title">{t("sections.receivesFrom")}</h2>
            <dl className="dig-kv">
              {role.receivesFrom.map((x, i) => (
                <div key={i}><dt>{x.who}</dt><dd>{x.what}</dd></div>
              ))}
            </dl>
          </section>
          <section className="dig-section">
            <h2 className="dig-section-title">{t("sections.serves")}</h2>
            <dl className="dig-kv">
              {role.serves.map((x, i) => (
                <div key={i}><dt>{x.who}</dt><dd>{x.what}</dd></div>
              ))}
            </dl>
          </section>

          <List heading={t("sections.stakeholders")} items={role.stakeholders} />
          <List heading={t("sections.requirements")} items={role.requirements} />

          <section className="dig-section">
            <h2 className="dig-section-title">{t("sections.turnsOn")}</h2>
            <p className="dig-record-explain">{role.turnsOn}</p>
          </section>

          {/* THE RECORD ITSELF. A citation that says "from the record" without
              showing the record is the badge this section was built to avoid,
              so a documented role prints its sources where the reader is. The
              guard already refuses a documented entry with no source; this is
              the half that makes the guarantee visible. */}
          {role.provenance.kind === "documented" && role.provenance.sources && (
            <section className="dig-section">
              <h2 className="dig-section-title">{t("sections.sources")}</h2>
              <ul className="dig-notes">
                {role.provenance.sources.map((src, i) => (
                  <li key={i}>
                    <a href={src.url} rel="noopener noreferrer" target="_blank">{src.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {role.adjacentRoles.length > 0 && (
            <section className="dig-section">
              <h2 className="dig-section-title">{t("sections.adjacent")}</h2>
              <ul className="dig-notes">
                {role.adjacentRoles.map((s) => {
                  const other = findRole(s);
                  return other ? (
                    <li key={s}><Link href={`/${locale}/roles/${s}`}>{other.title}</Link></li>
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
          {practiceLinks.length > 0 && (
            <section className="dig-section">
              <h2 className="dig-section-title">{t("sections.practice")}</h2>
              <p className="dig-record-explain">{t("practiceLede")}</p>
              <ul className="dig-notes">
                {practiceLinks.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/${locale}/practice/${a.slug}`}>{a.title}</Link>
                    {a.thesis ? <> {"\u2014"} <span className="dig-record-explain">{a.thesis}</span></> : null}
                  </li>
                ))}
              </ul>
              <p className="mono">
                <Link href={`/${locale}/practice`}>{t("practiceLink")}</Link>
              </p>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

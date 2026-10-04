// ============================================================================
// src/app/[locale]/advisory/decision-memorandum/page.tsx
// ----------------------------------------------------------------------------
// THE EXAMPLE DECISION MEMORANDUM — a complete, fictional instance of the
// written analysis an advisory engagement produces.
//
// WHY (PRIME 2026-10-03, from the advisory review). The advisory page said
// "a written answer" many times and never showed one. The review called
// showing it the single highest-value conversion improvement: a buyer who sees
// the document understands at once what is being purchased. So this page is
// the document, with the fourteen headings every engagement uses, written
// about an organisation that does not exist.
//
// FICTION, STATED THREE TIMES. In the notice card above the document, in the
// document's own status line, and in the page description. No client document
// is published, and nothing here is advice to a reader; the disclaimer page's
// advisory carve-out says the same in legal terms.
//
// CONTENT LIVES IN MDX, one file per authored locale under
// src/content/advisory/<locale>/, with the English file as the fallback for
// the fourteen other locales, exactly as Learn does it. The body is rendered
// through the same MDX pipeline as Learn (remark-gfm for the two tables) inside
// .article-body, so headings, lists and tables take the article styles.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

/** The memorandum's frontmatter: the fields the page shows above the body. */
interface MemoFrontmatter {
  slug: string;
  title: string;
  summary: string;
  /** The decision in one sentence. */
  decision: string;
  /** Who the (fictional) document was prepared for. */
  prepared: string;
  /** The status line: always the fiction notice. */
  status: string;
  /** Last substantive edit, ISO. */
  updated: string;
}

/** Where the memorandum files live; English is the fallback. */
const CONTENT_ROOT = path.join(process.cwd(), "src", "content", "advisory");

/** Load the memorandum for a locale, falling back to English per file. */
function loadMemo(locale: string): { data: MemoFrontmatter; body: string } {
  const candidates = [path.join(CONTENT_ROOT, locale, "decision-memorandum.mdx"), path.join(CONTENT_ROOT, "en", "decision-memorandum.mdx")];
  const file = candidates.find((f) => fs.existsSync(f)) ?? candidates[1];
  const { data, content } = matter(fs.readFileSync(file, "utf-8"));
  return { data: data as MemoFrontmatter, body: content };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "advisoryMemo" });
  // Title and description only: this slug is not in gen-og's static page list,
  // so no social card is named (check-og fails on a card with nothing behind it).
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function DecisionMemorandumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("advisoryMemo");
  const tNav = await getTranslations("nav");
  const memo = loadMemo(locale);

  // The labels of the meta block come from the advisory page's outline keys,
  // so the two pages name the same things the same way.
  const tAdv = await getTranslations("advisory");

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero: eyebrow, the document's title, its one-paragraph summary. */}
          <section className="section">
            <div className="container section-narrow">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{memo.data.title}</h1>
              <p className="page-hero-lede">{memo.data.summary}</p>
            </div>
          </section>

          <section className="section">
            <div className="container section-narrow">
              {/* The fiction notice, in the amber card the site uses for the
                  things a reader must know before reading on. */}
              <div className="vendor-note memo-notice">
                <p className="vendor-note-title">{t("noticeTitle")}</p>
                <p className="vendor-note-body">{t("noticeBody")}</p>
              </div>

              {/* The document. The meta block names the decision, the
                  audience and the status; the body is the fourteen sections. */}
              <div className="memo-document">
                <dl className="memo-meta">
                  <dt>{tAdv("memoOutline1")}</dt>
                  <dd>{memo.data.decision}</dd>
                  <dt>{t("preparedLabel")}</dt>
                  <dd>{memo.data.prepared}</dd>
                  <dt>{t("statusLabel")}</dt>
                  <dd>{memo.data.status}</dd>
                  <dt>{t("updatedLabel")}</dt>
                  <dd>{memo.data.updated}</dd>
                </dl>
                <div className="article-body">
                  <MDXRemote source={memo.body} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
                </div>
              </div>

              {/* The way back, and the one ask. */}
              <div className="memo-foot">
                <Link href="/advisory" className="btn btn-secondary">
                  {t("backLink")}
                </Link>
                <Link href="/contact" className="btn btn-primary">
                  {t("ctaButton")}
                </Link>
                <p className="advisory-note" style={{ margin: 0 }}>
                  {t("ctaBody")}
                </p>
              </div>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}

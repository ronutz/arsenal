// ============================================================================
// src/lib/translationGuide.ts
// ----------------------------------------------------------------------------
// The translators' guide, rendered for the contribute page (PRIME 2026-10-19
// 17:11: "The guide should be in https://ronutz.com/contribute/"). The guide is
// authored as Markdown beside the packs it describes, in English
// (src/i18n/messages/CONTRIBUTING-TRANSLATIONS.md), with native editions beside
// it as CONTRIBUTING-TRANSLATIONS.<locale>.md (pt-BR; es and de since 2026-11-09, fr the same day,
// written with the interface); every other locale reads the English one, as it
// reads English for any phrase its pack lacks.
//
// Rendering follows src/lib/toolDocs.ts: remark-parse (not MDX, so "{count}" in
// the guide is text, not an expression), GFM for the tables, remark-rehype
// WITHOUT allowDangerousHtml (the guide carries no raw HTML, so the output is
// escaped), rehype-stringify. The page inserts the result with
// dangerouslySetInnerHTML, which therefore carries only escaped output.
// ============================================================================
import fs from "node:fs"; // the guide is read at build time
import path from "node:path"; // and located from the repository root
import { unified } from "unified"; // the Markdown pipeline
import remarkParse from "remark-parse"; // Markdown to mdast
import remarkGfm from "remark-gfm"; // tables
import remarkRehype from "remark-rehype"; // mdast to hast, raw HTML not allowed
import rehypeStringify from "rehype-stringify"; // hast to an HTML string
// Links to other sites open in a new tab (PRIME 2026-10-27; src/lib/rehypeExternalLinks.ts).
import rehypeExternalLinks from "@/lib/rehypeExternalLinks";

/** The folder that holds the packs and the guide. */
const DIR = path.join(process.cwd(), "src", "i18n", "messages");

/** The guide's file for a locale: its own edition when one exists; otherwise the English guide. */
function guideFile(locale: string): string {
  // The locale's native edition (pt-BR, es, de), when it has one.
  const own = path.join(DIR, `CONTRIBUTING-TRANSLATIONS.${locale}.md`);
  // English has no suffix; any other locale with a file reads its own.
  if (locale !== "en" && fs.existsSync(own)) return own;
  // The English reference for everyone else.
  return path.join(DIR, "CONTRIBUTING-TRANSLATIONS.md");
}

/**
 * The guide as HTML for one locale, without its top-level heading (the page
 * supplies its own section heading), so the page's heading levels stay in order.
 */
export async function getTranslationGuideHtml(locale: string): Promise<string> {
  // The Markdown, read at build time.
  const md = fs.readFileSync(guideFile(locale), "utf8");
  // The first line is the document's "# " title; the page has its own heading, so it is dropped.
  const titled = md.replace(/^# [^\n]*\n+/, "");
  // Its "## " sections become "### ", one level under the page's section heading (h2).
  const body = titled.replace(/^## /gm, "### ");
  // Markdown to escaped HTML.
  const file = await unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeExternalLinks).use(rehypeStringify).process(body);
  // The HTML string.
  return String(file);
}

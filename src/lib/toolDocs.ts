// ============================================================================
// src/lib/toolDocs.ts
// ----------------------------------------------------------------------------
// TOOL DOCUMENTATION reader + Markdown -> HTML renderer.
//
// Each built tool has hand-authored documentation in Markdown at
// src/content/tool-docs/<locale>/<slug>.md (en + pt-BR, guard-enforced by
// check-tool-docs.mjs, D-77). Per the 2026-07-10 directive, this documentation
// is presented as a WEB PAGE (/tools/<slug>/docs), from which the raw Markdown
// stays downloadable (/<locale>/tools/<slug>.md, emitted by gen-machine-legible).
//
// WHY a plain unified pipeline and NOT MDXRemote: tool docs are pure Markdown,
// not MDX. Some contain literal "<module>" placeholders and "{ ... }" snippets
// (all inside indented or fenced code blocks). MDX would try to parse "<x>" as
// JSX and "{" as an expression and break. remark-parse instead treats those as
// code, and rehype-stringify HTML-escapes them, so they render literally and
// safely. remark-rehype runs WITHOUT allowDangerousHtml: the docs carry no raw
// HTML, so nothing dangerous is emitted (any stray prose "<tag>" is simply
// dropped, never executed).
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const DOCS_ROOT = path.join(process.cwd(), "src", "content", "tool-docs");
const SOURCE_LOCALE = "en";

// Shared, configured once. remark-gfm gives tables/strikethrough/task-lists,
// matching the Learn articles' Markdown feature set.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify);

/** Render a Markdown string to safe, escaped HTML. */
async function markdownToHtml(md: string): Promise<string> {
  const file = await processor.process(md);
  return String(file);
}

/** Every tool-doc slug (the source-locale set; equals the built-tool set). */
export function getAllToolDocSlugs(): string[] {
  return fs
    .readdirSync(path.join(DOCS_ROOT, SOURCE_LOCALE))
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/** True if a doc exists for this slug (source locale). */
export function hasToolDoc(slug: string): boolean {
  return fs.existsSync(path.join(DOCS_ROOT, SOURCE_LOCALE, `${slug}.md`));
}

/**
 * Rendered HTML for a tool's documentation in the given locale, with English
 * fallback (matching next-intl's per-key fallback for the rest of the site).
 * A single leading H1 is stripped when present: 14 docs open with "# <Tool>",
 * which the page already renders as its own <h1>, so we avoid a duplicate.
 * Returns null if no doc exists for the slug.
 */
export async function getToolDocHtml(
  slug: string,
  locale: string,
): Promise<string | null> {
  const localized = path.join(DOCS_ROOT, locale, `${slug}.md`);
  const fallback = path.join(DOCS_ROOT, SOURCE_LOCALE, `${slug}.md`);
  const file = fs.existsSync(localized)
    ? localized
    : fs.existsSync(fallback)
      ? fallback
      : null;
  if (!file) return null;
  let md = fs.readFileSync(file, "utf8");
  md = md.replace(/^\s*#\s+.*\r?\n/, ""); // strip one leading H1 if present
  return markdownToHtml(md);
}

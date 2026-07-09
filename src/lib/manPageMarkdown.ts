// ============================================================================
// src/lib/manPageMarkdown.ts
// ----------------------------------------------------------------------------
// A DELIBERATELY SMALL Markdown -> HTML renderer for the "." context panel's
// inline man page (T-DOT, phase 1).
//
// WHY NOT next-mdx-remote. The site already renders Learn articles with
// next-mdx-remote + remark-gfm, but that pipeline is server/RSC-oriented and
// heavy to invoke on the client for a string fetched at runtime. The man page
// only needs to render the D-77 tool-doc subset, which a survey of all 162
// authored docs (en + pt-BR) shows is small and fixed:
//     headings (## / ###), paragraphs, "-" bullet lists, fenced code blocks,
//     and inline spans: `code`, **bold**, *italic*, [text](url).
// No ordered lists, no tables, no blockquotes, no raw HTML blocks. So a compact
// purpose-built renderer is the right tradeoff: no new dependency, no bundle
// growth, and total control over escaping.
//
// SAFETY. Everything is HTML-escaped FIRST; only the known Markdown tokens are
// then turned into tags. The docs contain many angle-bracket fragments inside
// inline code (e.g. `<vendor>`, generics) - these must render as literal text,
// which escaping guarantees. Link href values are additionally restricted to
// http(s), root-relative, and anchor targets, so a doc can never smuggle a
// javascript: URL. The output is a trusted HTML string the panel injects with
// dangerouslySetInnerHTML; because the input is our own authored, in-repo docs
// and every byte is escaped before tokenizing, this is safe by construction.
// ============================================================================

/** Escape the five HTML-significant characters so all source renders literally. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Only allow safe link targets. Everything else (javascript:, data:, etc.) is
 * dropped to plain text. Values are already HTML-escaped when this runs.
 */
function safeHref(raw: string): string | null {
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("/")) return v; // root-relative in-app link
  if (v.startsWith("#")) return v; // same-page anchor
  return null;
}

/**
 * Render inline spans within one already-HTML-escaped line. Order matters: code
 * first (so ** or * inside code is left alone), then links, then bold, then
 * italic. Because the string is pre-escaped, the marker characters (`*`, `` ` ``,
 * `[`) survive escaping unchanged and can be matched here.
 */
function renderInline(escaped: string): string {
  let out = escaped;

  // `inline code` -> <code>…</code>. Non-greedy, no backticks inside.
  out = out.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`);

  // [text](href) -> <a>. href is validated; unsafe targets fall back to text.
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, href) => {
    const safe = safeHref(href);
    if (!safe) return text;
    const external = /^https?:\/\//i.test(safe);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${safe}"${attrs}>${text}</a>`;
  });

  // **bold** -> <strong>. Matched before single-* italic.
  out = out.replace(/\*\*([^*]+)\*\*/g, (_m, b) => `<strong>${b}</strong>`);

  // *italic* -> <em>. Single asterisks not adjacent to another asterisk.
  out = out.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, (_m, i) => `<em>${i}</em>`);

  return out;
}

/**
 * Render a D-77 tool-doc Markdown string to a trusted HTML string.
 * Block-level pass over lines; inline pass per line via renderInline.
 */
export function manPageToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];

  let inCode = false; // inside a ``` fenced block
  let codeBuf: string[] = [];
  let listBuf: string[] = []; // accumulating <li> items
  let paraBuf: string[] = []; // accumulating a paragraph's lines

  const flushPara = () => {
    if (paraBuf.length) {
      html.push(`<p>${renderInline(esc(paraBuf.join(" ")))}</p>`);
      paraBuf = [];
    }
  };
  const flushList = () => {
    if (listBuf.length) {
      html.push(`<ul>${listBuf.join("")}</ul>`);
      listBuf = [];
    }
  };

  for (const raw of lines) {
    // Fenced code: toggle on ```; buffer verbatim (escaped) until the closer.
    if (raw.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${codeBuf.map(esc).join("\n")}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        flushPara();
        flushList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(raw);
      continue;
    }

    // Heading: # .. ###### . Close any open para/list first.
    const h = /^(#{1,6})\s+(.*)$/.exec(raw);
    if (h) {
      flushPara();
      flushList();
      const level = h[1].length;
      html.push(`<h${level}>${renderInline(esc(h[2]))}</h${level}>`);
      continue;
    }

    // Bullet list item: "- " or "* ".
    const li = /^[-*]\s+(.*)$/.exec(raw);
    if (li) {
      flushPara();
      listBuf.push(`<li>${renderInline(esc(li[1]))}</li>`);
      continue;
    }

    // Blank line: paragraph / list separator.
    if (raw.trim() === "") {
      flushPara();
      flushList();
      continue;
    }

    // Otherwise: paragraph text (a list must break before a paragraph starts).
    flushList();
    paraBuf.push(raw.trim());
  }

  // Close anything still open at EOF.
  if (inCode && codeBuf.length) {
    html.push(`<pre><code>${codeBuf.map(esc).join("\n")}</code></pre>`);
  }
  flushPara();
  flushList();

  return html.join("\n");
}

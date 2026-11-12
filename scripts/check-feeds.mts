#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-feeds.mts   (PREBUILD, right after scripts/gen-feeds.mts)
// ----------------------------------------------------------------------------
// EVERY SERIES HAS ITS FEED, AND EVERY FEED PARSES (PRIME 12/11/2026 12:42,
// "My desk", phase 3). The series pages link a feed for each series in the
// reader's language (src/lib/feeds.ts); a link to a feed that was not made,
// or to a file a feed reader cannot read, is a broken promise that no page
// check would see. This guard reads the files scripts/gen-feeds.mts wrote
// under public/feeds/ and fails the build when:
//
//   1. a live language has no feed of its own, or a series has no feed in a
//      live language (at the address src/lib/feeds.ts gives), or a file is
//      there that no language or series accounts for;
//   2. a feed is not well-formed XML (a strict parser below: balanced
//      elements, quoted and unique attributes, only the five predefined
//      entities and character references, no characters XML 1.0 forbids, no
//      DOCTYPE), or not RSS 2.0 in the shape the generator promises: one
//      channel with a title, its page, a description, its language and its
//      own address (atom:link rel="self"); items with a title, a link and the
//      same link as a permanent guid, and a date that reads as one;
//   3. an item's link is not the address the site's own links use for that
//      article from a page in that language, or names an article that does
//      not exist; a series feed's items are not exactly the series' opener
//      and written parts, in reading order; a language's feed is empty or
//      longer than fifty items;
//   4. a feed in a language without the Learn articles does not say they
//      open in English (feeds.englishNote);
//   5. public/_headers no longer serves /feeds/* as application/rss+xml, or
//      the Worker (worker/index.ts) answers a feed's address with anything but
//      the file itself (its locale gate redirecting it, say).
// The parser is tested on broken documents first, so a parser that accepts
// everything cannot pass.
// ============================================================================

// Files and paths.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// The series and the articles each one is made of.
import { LEARN_SERIES, seriesArticles } from "../src/content/learn/series";
// The articles as the pages load them.
import { getArticle } from "../src/lib/learn";
// The languages the site is published in.
import { LIVE_LOCALE_CODES } from "../src/i18n/locales";
// Where a link to an article goes from a page in a language, and which languages carry the articles.
import { carriesAuthoredContent, linkLocaleFor } from "../src/i18n/corpus-routing";
// The feeds' addresses.
import { FEEDS_DIR, FEED_MEDIA_TYPE, feedUrlForLocale, feedUrlForSeries } from "../src/lib/feeds";
// The origin and the language feed's length, from the generator.
import { LOCALE_FEED_ITEMS, ORIGIN } from "./gen-feeds.mts";
// The Worker, to check that it serves a feed's address as the file.
import worker from "../worker/index";

/** Repository root. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** The tag on every line of output. */
const TAG = "[check-feeds]";
/** What went wrong. */
const errors: string[] = [];

// ---- A strict XML well-formedness parser -------------------------------------------
/** One element: its name, its attributes, its child elements and its text. */
interface XmlNode {
  /** The element's name. */
  name: string;
  /** Its attributes, values decoded. */
  attrs: Record<string, string>;
  /** Its child elements, in order. */
  children: XmlNode[];
  /** Its own text (not its children's), decoded. */
  text: string;
}

/** A name as XML allows it (the ASCII subset the feeds use, plus any letter). */
const NAME = /^[A-Za-z_À-�][A-Za-z0-9._:\-·À-�]*/;
/** The five predefined entities. */
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

/**
 * Whether a code point may appear in an XML 1.0 document.
 *
 * @param c the code point
 * @returns true when it is allowed
 */
function xmlChar(c: number): boolean {
  // Tab, line feed, carriage return, and the ranges the specification lists.
  return c === 0x9 || c === 0xa || c === 0xd || (c >= 0x20 && c <= 0xd7ff) || (c >= 0xe000 && c <= 0xfffd) || (c >= 0x10000 && c <= 0x10ffff);
}

/**
 * Decode the references in a run of text or an attribute value, refusing anything that is not one.
 *
 * @param raw the raw text
 * @param where where it is, for the error
 * @returns the decoded text
 * @throws on a bare "&", an unknown entity or a reference to a character XML forbids
 */
function decode(raw: string, where: string): string {
  // Each "&" must start a reference.
  return raw.replace(/&([^;]*);?/g, (m, body: string) => {
    // No closing ";": a bare ampersand.
    if (!m.endsWith(";")) throw new Error(`a bare "&" in ${where}`);
    // A named entity.
    if (body in ENTITIES) return ENTITIES[body];
    // A character reference, decimal or hexadecimal.
    const num = /^#(\d+)$/.exec(body) ?? /^#x([0-9A-Fa-f]+)$/.exec(body);
    if (!num) throw new Error(`the unknown reference "&${body};" in ${where}`);
    const c = parseInt(num[1], body.startsWith("#x") ? 16 : 10);
    if (!xmlChar(c)) throw new Error(`a reference to a character XML forbids in ${where}`);
    return String.fromCodePoint(c);
  });
}

/**
 * Parse a document, or say why it is not well-formed.
 *
 * @param src the document
 * @returns its root element
 * @throws with the reason and the offset when it is not well-formed
 */
export function parseXml(src: string): XmlNode {
  // Every character allowed.
  for (const ch of src) if (!xmlChar(ch.codePointAt(0) ?? 0)) throw new Error(`a character XML forbids (U+${(ch.codePointAt(0) ?? 0).toString(16).toUpperCase()})`);
  // Where the parser is.
  let i = 0;
  // Skip white space.
  const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  // Skip comments and white space between nodes.
  const misc = () => {
    for (;;) {
      ws();
      if (!src.startsWith("<!--", i)) return;
      const end = src.indexOf("-->", i + 4);
      if (end < 0) throw new Error(`an unclosed comment at ${i}`);
      if (src.slice(i + 4, end).includes("--")) throw new Error(`"--" inside a comment at ${i}`);
      i = end + 3;
    }
  };
  // The XML declaration, if any, first of all.
  if (src.startsWith("<?xml", 0)) {
    const end = src.indexOf("?>");
    if (end < 0) throw new Error("an unclosed XML declaration");
    if (!/^<\?xml\s+version="1\.[0-9]"(\s+encoding="[A-Za-z][A-Za-z0-9._-]*")?(\s+standalone="(yes|no)")?\s*$/.test(src.slice(0, end))) throw new Error("a malformed XML declaration");
    i = end + 2;
  }
  // Nothing before the root but white space and comments; a DOCTYPE is not something a feed here carries.
  misc();
  if (src.startsWith("<!DOCTYPE", i)) throw new Error("a DOCTYPE (refused: no feed needs one)");
  /**
   * One element, from its "<".
   *
   * @returns the element
   */
  const element = (): XmlNode => {
    // The opening "<" and the name.
    if (src[i] !== "<") throw new Error(`an element expected at ${i}`);
    i++;
    const nm = NAME.exec(src.slice(i, i + 200));
    if (!nm) throw new Error(`an element name expected at ${i}`);
    const node: XmlNode = { name: nm[0], attrs: {}, children: [], text: "" };
    i += nm[0].length;
    // The attributes, each separated by white space, quoted and named once.
    for (;;) {
      const before = i;
      ws();
      // The end of the tag: empty, or with content.
      if (src.startsWith("/>", i)) { i += 2; return node; }
      if (src[i] === ">") { i++; break; }
      // An attribute needs white space before it.
      if (i === before) throw new Error(`white space expected before an attribute at ${i}`);
      const an = NAME.exec(src.slice(i, i + 200));
      if (!an) throw new Error(`an attribute name expected at ${i}`);
      i += an[0].length;
      ws();
      if (src[i] !== "=") throw new Error(`"=" expected after ${an[0]} at ${i}`);
      i++;
      ws();
      const q = src[i];
      if (q !== '"' && q !== "'") throw new Error(`a quoted value expected for ${an[0]} at ${i}`);
      const end = src.indexOf(q, i + 1);
      if (end < 0) throw new Error(`an unclosed value for ${an[0]} at ${i}`);
      const raw = src.slice(i + 1, end);
      if (raw.includes("<")) throw new Error(`"<" inside the value of ${an[0]} at ${i}`);
      if (an[0] in node.attrs) throw new Error(`the attribute ${an[0]} twice on <${node.name}>`);
      node.attrs[an[0]] = decode(raw, `the value of ${an[0]}`);
      i = end + 1;
    }
    // The content, up to the matching end tag.
    let text = "";
    for (;;) {
      if (i >= src.length) throw new Error(`<${node.name}> is never closed`);
      // The end tag, which must name this element.
      if (src.startsWith("</", i)) {
        i += 2;
        const en = NAME.exec(src.slice(i, i + 200));
        if (!en || en[0] !== node.name) throw new Error(`</${en?.[0] ?? "?"}> closes <${node.name}> at ${i}`);
        i += en[0].length;
        ws();
        if (src[i] !== ">") throw new Error(`">" expected to end </${node.name}> at ${i}`);
        i++;
        node.text = text;
        return node;
      }
      // A comment.
      if (src.startsWith("<!--", i)) { const end = src.indexOf("-->", i + 4); if (end < 0) throw new Error(`an unclosed comment at ${i}`); i = end + 3; continue; }
      // A CDATA section, taken as text.
      if (src.startsWith("<![CDATA[", i)) { const end = src.indexOf("]]>", i + 9); if (end < 0) throw new Error(`an unclosed CDATA section at ${i}`); text += src.slice(i + 9, end); i = end + 3; continue; }
      // A processing instruction or a declaration: not something a feed here carries.
      if (src.startsWith("<?", i) || src.startsWith("<!", i)) throw new Error(`an unexpected "${src.slice(i, i + 2)}" at ${i}`);
      // A child element.
      if (src[i] === "<") { node.children.push(element()); continue; }
      // A run of text, up to the next "<".
      const next = src.indexOf("<", i);
      const raw = src.slice(i, next < 0 ? src.length : next);
      if (raw.includes("]]>")) throw new Error(`"]]>" in text at ${i}`);
      text += decode(raw, `the text of <${node.name}>`);
      i += raw.length;
    }
  };
  // The root.
  if (src[i] !== "<") throw new Error("no root element");
  const root = element();
  // Nothing after it but white space and comments.
  misc();
  if (i !== src.length) throw new Error(`content after the root element at ${i}`);
  return root;
}

/**
 * The child elements of a node with a given name.
 *
 * @param n the node
 * @param name the name
 * @returns them, in order
 */
const kids = (n: XmlNode, name: string): XmlNode[] => n.children.filter((c) => c.name === name);

/**
 * The text of a node's one child of a given name, or null when it has not exactly one.
 *
 * @param n the node
 * @param name the child's name
 * @returns the text, trimmed, or null
 */
function one(n: XmlNode, name: string): string | null {
  // Exactly one.
  const k = kids(n, name);
  return k.length === 1 ? k[0].text.trim() : null;
}

// ---- 0. The parser is not vacuous: it refuses broken documents ----------------------
for (const [doc, why] of [
  ["<rss><channel></rss>", "an element closed by another's end tag"],
  ["<rss>AT&T</rss>", "a bare ampersand"],
  ["<rss>&nbsp;</rss>", "an entity XML does not define"],
  ['<rss a="1" a="2"/>', "an attribute given twice"],
  ["<rss a=1/>", "an unquoted attribute"],
  ["<rss>\u0001</rss>", "a control character"],
  ["<rss/><rss/>", "two roots"],
  ["<rss><title>x</title>", "an element never closed"],
  ['<!DOCTYPE rss SYSTEM "x"><rss/>', "a DOCTYPE"],
] as const) {
  // Each must be refused.
  let refused = false;
  try { parseXml(doc); } catch { refused = true; }
  if (!refused) errors.push(`the XML parser accepted ${why}: ${JSON.stringify(doc)}`);
}
// And a well-formed one accepted, references decoded.
try {
  const ok = parseXml('<?xml version="1.0" encoding="UTF-8"?>\n<a b="x &amp; y"><c>&lt;d&gt; &#233;&#x00E9;</c><e/></a>\n');
  if (ok.attrs.b !== "x & y" || ok.children[0].text !== "<d> éé" || ok.children.length !== 2) errors.push("the XML parser misread a well-formed document");
} catch (e) {
  errors.push(`the XML parser refused a well-formed document: ${(e as Error).message}`);
}

// ---- 1-4. The feeds ------------------------------------------------------------------
/** The message packs of the live languages, for the English-pages sentence. */
const PACKS: Record<string, Record<string, Record<string, string>>> = Object.fromEntries(
  LIVE_LOCALE_CODES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, "src", "i18n", "messages", `${l}.json`), "utf8"))]),
);

/** Every file the feeds should be, as root-relative addresses. */
const expected = new Set<string>();
/** How many feeds were read and found good. */
let good = 0;
/** How many items they hold in all. */
let itemCount = 0;

/**
 * Read one feed and check it against what it must be.
 *
 * @param url its root-relative address
 * @param locale its language
 * @param channelLink the page its channel must name
 * @param slugs the articles it must list in order, or null for a language's feed (any articles, at most fifty)
 */
function checkFeed(url: string, locale: string, channelLink: string, slugs: string[] | null): void {
  // Expected, whatever happens next.
  expected.add(url);
  // The file.
  const file = path.join(ROOT, "public", ...url.split("/").filter(Boolean));
  if (!fs.existsSync(file)) { errors.push(`${url}: missing (run scripts/gen-feeds.mts)`); return; }
  // Parsed.
  let root: XmlNode;
  try {
    root = parseXml(fs.readFileSync(file, "utf8"));
  } catch (e) {
    errors.push(`${url}: not well-formed XML: ${(e as Error).message}`);
    return;
  }
  // The failures of this feed, collected before they are counted.
  const bad: string[] = [];
  // RSS 2.0 with the Atom namespace for the self link.
  if (root.name !== "rss" || root.attrs.version !== "2.0") bad.push('the root is not <rss version="2.0">');
  if (root.attrs["xmlns:atom"] !== "http://www.w3.org/2005/Atom") bad.push("the Atom namespace is not declared");
  // One channel.
  const channels = kids(root, "channel");
  if (channels.length !== 1) { errors.push(`${url}: ${channels.length} channels`); return; }
  const ch = channels[0];
  // Its title, page, description and language.
  if (!one(ch, "title")) bad.push("the channel has no title");
  if (one(ch, "link") !== channelLink) bad.push(`the channel's page is ${one(ch, "link")}, not ${channelLink}`);
  const description = one(ch, "description") ?? "";
  if (!description) bad.push("the channel has no description");
  if (one(ch, "language") !== locale) bad.push(`the channel's language is ${one(ch, "language")}, not ${locale}`);
  // In a language without the articles, the sentence that says they open in English.
  const note = PACKS[locale]?.feeds?.englishNote;
  if (!carriesAuthoredContent(locale) && (!note || !description.endsWith(note))) bad.push("the description does not say the articles open in English (feeds.englishNote)");
  // Its own address.
  const self = kids(ch, "atom:link").filter((n) => n.attrs.rel === "self");
  if (self.length !== 1 || self[0].attrs.href !== `${ORIGIN}${url}` || self[0].attrs.type !== FEED_MEDIA_TYPE) bad.push("the channel's atom:link rel=self is missing or names another address");
  // A build date, when there is one, that reads as a date.
  const built = one(ch, "lastBuildDate");
  if (built !== null && Number.isNaN(Date.parse(built))) bad.push(`lastBuildDate "${built}" is not a date`);
  // The items.
  const items = kids(ch, "item");
  const got: string[] = [];
  for (const it of items) {
    // A title, a link, and the link again as a permanent guid.
    const title = one(it, "title");
    const link = one(it, "link") ?? "";
    const guid = kids(it, "guid");
    if (!title) bad.push("an item without a title");
    if (guid.length !== 1 || guid[0].text.trim() !== link || guid[0].attrs.isPermaLink !== "true") bad.push(`the item ${link} has no matching permanent guid`);
    // A date that reads as one, when there is one.
    const pub = one(it, "pubDate");
    if (pub !== null && Number.isNaN(Date.parse(pub))) bad.push(`the item ${link} has pubDate "${pub}", not a date`);
    // The link: the address the site's own links use for the article from a page in this language.
    const m = /^https:\/\/ronutz\.com\/([A-Za-z-]+)\/learn\/([a-z0-9-]+)\/$/.exec(link);
    if (!m) { bad.push(`the item link ${link} is not an article address`); continue; }
    if (m[1] !== linkLocaleFor(locale, `/learn/${m[2]}`)) bad.push(`the item link ${link} is not where a link from a ${locale} page goes`);
    if (!getArticle(m[2], "en")) bad.push(`the item link ${link} names no article`);
    got.push(m[2]);
  }
  // A series' items: exactly its opener and written parts, in reading order.
  if (slugs !== null && JSON.stringify(got) !== JSON.stringify(slugs)) bad.push(`the items are not the series' articles in reading order (${got.length} listed, ${slugs.length} expected)`);
  // A language's items: some, and no more than the original feed's fifty.
  if (slugs === null && (got.length === 0 || got.length > LOCALE_FEED_ITEMS)) bad.push(`${got.length} items (expected 1 to ${LOCALE_FEED_ITEMS})`);
  // Counted.
  for (const b of bad) errors.push(`${url}: ${b}`);
  if (bad.length === 0) good++;
  itemCount += got.length;
}

// Each live language: its own feed, then every series.
for (const locale of LIVE_LOCALE_CODES) {
  checkFeed(feedUrlForLocale(locale), locale, `${ORIGIN}/${locale}/learn/`, null);
  for (const s of LEARN_SERIES) {
    // The series' articles that exist (a missing one is scripts/check-learn-series.mjs's to report).
    const slugs = seriesArticles(s).filter((slug) => getArticle(slug, locale) !== null);
    checkFeed(feedUrlForSeries(locale, s.id), locale, `${ORIGIN}/${locale}/learn/series/#${s.id}`, slugs);
  }
}

// No file that no language or series accounts for.
{
  /** Every file under public/feeds/, as an address. */
  const found: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else found.push(`/${path.relative(path.join(ROOT, "public"), p).split(path.sep).join("/")}`);
    }
  };
  walk(path.join(ROOT, "public", FEEDS_DIR));
  for (const f of found) if (!expected.has(f)) errors.push(`${f}: no language or series accounts for this file`);
}

// ---- 5. The served type ---------------------------------------------------------------------
{
  // The rule in public/_headers: the path, then its Content-Type line.
  const headers = fs.readFileSync(path.join(ROOT, "public", "_headers"), "utf8");
  if (!new RegExp(`^/${FEEDS_DIR}/\\*\\s*\\n\\s+Content-Type:\\s*${FEED_MEDIA_TYPE.replace("+", "\\+")}`, "m").test(headers)) {
    errors.push(`public/_headers no longer serves /${FEEDS_DIR}/* as ${FEED_MEDIA_TYPE} (with nosniff, a browser would show it as plain text)`);
  }
}

// The Worker serves each language's feeds as files: one language feed and one series feed per language, asked of a
// stand-in for the static assets, which must be asked for exactly that address and nothing else.
for (const locale of LIVE_LOCALE_CODES) {
  for (const url of [feedUrlForLocale(locale), feedUrlForSeries(locale, LEARN_SERIES[0].id)]) {
    // The addresses the stand-in was asked for.
    const asked: string[] = [];
    const env = { ASSETS: { fetch: async (r: Request) => { asked.push(new URL(r.url).pathname); return new Response("<rss/>", { status: 200 }); } } };
    // The request as a feed reader sends it.
    const res = await worker.fetch(new Request(`${ORIGIN}${url}`), env as never);
    if (res.status !== 200 || asked.length !== 1 || asked[0] !== url) errors.push(`${url}: the Worker answers ${res.status}${res.headers.get("location") ? ` to ${res.headers.get("location")}` : ""} instead of serving the file`);
  }
}

// ---- The verdict -----------------------------------------------------------------------------
if (errors.length > 0) {
  // Each failure, named (the first 60).
  console.error(`${TAG} FAIL: ${errors.length} problem(s) with the Learn feeds:`);
  for (const e of errors.slice(0, 60)) console.error(`  - ${e}`);
  if (errors.length > 60) console.error(`  ... and ${errors.length - 60} more.`);
  console.error("  The series pages link these feeds (src/lib/feeds.ts). Run scripts/gen-feeds.mts, or fix it, before the build.");
  process.exit(1);
}
// What was checked.
console.log(`${TAG} OK: ${good} feeds (${LIVE_LOCALE_CODES.length} languages, ${LEARN_SERIES.length} series in each) are where src/lib/feeds.ts says, well-formed RSS 2.0, ${itemCount} items in all, each linked where the site's own links go; no stray file; /${FEEDS_DIR}/* served by the Worker as files, as ${FEED_MEDIA_TYPE}.`);

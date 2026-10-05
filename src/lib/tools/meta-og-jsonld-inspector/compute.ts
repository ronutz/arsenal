// ============================================================================
// src/lib/tools/meta-og-jsonld-inspector/compute.ts
// ----------------------------------------------------------------------------
// THE META, OPEN GRAPH & JSON-LD INSPECTOR (engine). Paste a page, or just its
// head; out comes everything the head declares, read the way each standard
// reads it: the title and the character encoding (HTML Living Standard), every
// meta element classified (the standard's own names, the WHATWG MetaExtensions
// registry, the pragma directives, Open Graph's RDFa property form), every link
// element with its rel tokens (the standard's link types, canonical per RFC
// 6596, hreflang alternates, icons, manifest), the Open Graph object with its
// arrays and structured properties (ogp.me), the twitter:* card properties
// (as registered in MetaExtensions), the robots and googlebot rules (Google's
// published list), the viewport, and every JSON-LD data block parsed and
// outlined (JSON-LD 1.1 section 7). Each finding quotes the sentence it rests
// on.
//
// The parser is parse5, the same spec-compliant HTML parser the HTML structure
// explainer and the CSS selector tester run. Nothing is executed, fetched or
// rendered: no URL is resolved or requested, scripts stay text, JSON is parsed
// with JSON.parse and never evaluated. The engine runs identically in the
// browser and in the API.
//
// Sources (read 2026-10-05): HTML Living Standard 4.1.1, 4.2.2, 4.2.5,
// 4.2.5.1 to 4.2.5.4, 4.6.7; WHATWG wiki MetaExtensions (last edited 12 October
// 2023); HTML+RDFa 1.1 (2015) section 4; the Open Graph protocol (ogp.me);
// JSON-LD 1.1 (W3C Recommendation 16 July 2020) sections 3.1, 4 and 7; RFC 6596;
// Google Search Central "Meta tags and attributes that Google supports" (last
// updated 2025-12-10) and "Robots meta tag ... specifications" (last updated
// 2026-03-24); WCAG 2.2 SC 1.4.4.
// ============================================================================

import { parse, type DefaultTreeAdapterTypes as T } from "parse5";

/** The input. */
export interface HeadInput {
  /** The HTML: a whole page, or just the head's contents. */
  html: string;
}

/** The size ceiling (characters). */
export const HTML_MAX_CHARS = 300000;

/** How many JSON-LD nodes one block lists (the counts cover the whole block). */
export const JSONLD_NODES_MAX = 200;

/** How a meta element identifies itself. */
export type MetaKind =
  // name="..." (document metadata, 4.2.5.1 and the registry).
  | "name"
  // http-equiv="..." (a pragma directive, 4.2.5.3).
  | "http-equiv"
  // charset="..." (the character encoding declaration).
  | "charset"
  // itemprop="..." (microdata).
  | "itemprop"
  // property="..." (RDFa; the Open Graph form, conforming through HTML+RDFa 1.1).
  | "property"
  // None of the five: non-conforming ("Exactly one of the name, http-equiv, charset, and itemprop attributes must be specified").
  | "none";

/** How a meta element's key is classified. */
export type MetaClass =
  // A standard metadata name (4.2.5.1).
  | "standard"
  // A name registered in the WHATWG MetaExtensions wiki.
  | "registered"
  // A twitter:* card property (registered in MetaExtensions).
  | "twitter"
  // An Open Graph property (property="og:..." and the vertical namespaces).
  | "opengraph"
  // A pragma directive the standard defines.
  | "pragma"
  // A pragma the standard calls non-conforming (content-language, set-cookie).
  | "nonconforming"
  // The charset declaration.
  | "charset"
  // Microdata.
  | "itemprop"
  // Nothing the standard or the registry knows.
  | "unknown";

/** One meta element. */
export interface MetaRow {
  /** Its index in document order. */
  id: number;
  /** How it identifies itself. */
  kind: MetaKind;
  /** The key (the name, http-equiv, property or itemprop value; "charset" for a charset declaration), as written. */
  key: string | null;
  /** The content attribute, or the charset value; null when absent. */
  content: string | null;
  /** The classification of the key. */
  cls: MetaClass;
  /** The message key describing a known name or pragma (e.g. "description", "viewport", "refresh"), or null. */
  describe: string | null;
  /** The media attribute, when present (theme-color may carry one). */
  media: string | null;
  /** The source line (null for an element the parser created, which cannot happen for meta). */
  line: number | null;
  /** True when the element sits inside head. */
  inHead: boolean;
}

/** One link element. */
export interface LinkRow {
  /** Its index. */
  id: number;
  /** The rel tokens, lower-cased, in order. */
  rels: string[];
  /** Which rel tokens the HTML Standard defines (4.6.7). */
  knownRels: string[];
  /** The href, as written. */
  href: string | null;
  /** hreflang, type, sizes, media, as, title, when present. */
  hreflang: string | null;
  type: string | null;
  sizes: string | null;
  media: string | null;
  as: string | null;
  title: string | null;
  /** The source line. */
  line: number | null;
  /** True when inside head. */
  inHead: boolean;
}

/** One Open Graph property, in document order. */
export interface OgProperty {
  /** The property, as written (lower-cased for comparison elsewhere). */
  property: string;
  /** The content. */
  content: string;
  /** The source line. */
  line: number | null;
  /** The namespace (og, article, book, profile, music, video, payment, or another prefix). */
  namespace: string;
  /** The root property this structured property attaches to (og:image for og:image:width), or null for a root property. */
  structuredOf: string | null;
  /** True for a structured property that precedes any root it could attach to (ogp.me: "Put structured properties after you declare their root tag"). */
  orphan: boolean;
  /** Whether ogp.me lists this property (core, optional, structured or a vertical type's property). */
  known: boolean;
}

/** One og:image (or og:video / og:audio) with its structured properties. */
export interface OgMedia {
  /** og:image, og:video or og:audio. */
  root: string;
  /** The URL (the root tag's content). */
  url: string;
  /** Structured properties, when given. */
  secureUrl: string | null;
  type: string | null;
  width: string | null;
  height: string | null;
  alt: string | null;
  /** The source line of the root tag. */
  line: number | null;
}

/** One twitter:* property. */
export interface TwitterProperty {
  /** The name, as written. */
  name: string;
  /** The content. */
  content: string;
  /** The source line. */
  line: number | null;
  /** True when the WHATWG MetaExtensions registry lists the name. */
  registered: boolean;
}

/** One robots rule token. */
export interface RobotsToken {
  /** The token as written. */
  raw: string;
  /** The rule name, lower-cased, without its value (max-snippet, unavailable_after, ...). */
  rule: string;
  /** The value after the colon, when the rule takes one. */
  value: string | null;
  /** Google's status for the rule: current, retired (no longer used), or unknown to its list. */
  status: "current" | "retired" | "unknown";
}

/** One robots-style meta (name=robots, googlebot, googlebot-news, or another crawler token). */
export interface RobotsRow {
  /** The name, lower-cased. */
  name: string;
  /** The tokens. */
  tokens: RobotsToken[];
  /** The source line. */
  line: number | null;
}

/** One JSON-LD node outline entry. */
export interface JsonLdNode {
  /** The @type (joined with ", " when an array), or null. */
  type: string | null;
  /** The @id, or null. */
  id: string | null;
  /** A name-like property (name, headline, title), or null. */
  name: string | null;
  /** Nesting depth (0 = top level or a @graph member). */
  depth: number;
}

/** One JSON-LD data block. */
export interface JsonLdBlock {
  /** Its index among script elements of type application/ld+json. */
  index: number;
  /** The source line of the script element. */
  line: number | null;
  /** The type attribute as written. */
  typeAttr: string;
  /** Whether the text parsed as JSON. */
  valid: boolean;
  /** JSON.parse's message when it did not. */
  error: string | null;
  /** The @context as a string (an IRI), "object" for an object context, "array" for an array, or null when absent. */
  context: string | null;
  /** True when the top level is a @graph. */
  graph: boolean;
  /** The outline of nodes (cut at JSONLD_NODES_MAX). */
  nodes: JsonLdNode[];
  /** How many nodes the block holds (whole block). */
  nodeCount: number;
  /** How many nodes lack a @type. */
  untyped: number;
  /** True when the text contains a sequence JSON-LD 1.1 section 7.2 says to escape ("</script", "<!--"). */
  unsafeSequence: boolean;
  /** The text length. */
  length: number;
}

/** A finding, tied to a message key and the sentence it rests on. */
export interface Finding {
  /** The rule id, M1 to M44. */
  rule: string;
  /** error = a conformance requirement broken; warning = a should-rule or a consumer's documented expectation; info = a fact worth knowing; good = what the page gets right. */
  severity: "error" | "warning" | "info" | "good";
  /** The source line, when one element is at issue. */
  line: number | null;
  /** Message parameters. */
  params: Record<string, string | number>;
}

/** The result. */
export interface HeadResult {
  /** The document mode the parser chose. */
  mode: "no-quirks" | "limited-quirks" | "quirks";
  /** Whether a DOCTYPE was present. */
  doctype: boolean;
  /** html lang, or null. */
  lang: string | null;
  /** The title element(s): the first one's text, how many there were, the first one's line. */
  title: { text: string | null; count: number; line: number | null; length: number };
  /** The character encoding declaration. */
  charset: { value: string | null; source: "charset" | "http-equiv" | null; line: number | null; count: number; byteOffsetEnd: number | null };
  /** The base element's href, or null. */
  base: string | null;
  /** Every meta element. */
  metas: MetaRow[];
  /** Every link element. */
  links: LinkRow[];
  /** rel=canonical links. */
  canonical: { href: string; line: number | null }[];
  /** rel=alternate hreflang links. */
  hreflang: { lang: string; href: string | null; line: number | null }[];
  /** rel=icon / apple-touch-icon / manifest links. */
  icons: { rel: string; href: string | null; sizes: string | null; type: string | null }[];
  /** The Open Graph reading. */
  openGraph: {
    /** True when any og: (or vertical namespace) property is present. */
    present: boolean;
    /** Every property in document order. */
    properties: OgProperty[];
    /** The first value of each root property (ogp.me: "The first tag (from top to bottom) is given preference during conflicts"), by lower-cased name. */
    first: Record<string, string>;
    /** How many values each root property has (arrays). */
    counts: Record<string, number>;
    /** The media objects with their structured properties. */
    media: OgMedia[];
    /** og:type (first), or null. */
    type: string | null;
    /** Which of the four required properties are present. */
    required: { "og:title": boolean; "og:type": boolean; "og:image": boolean; "og:url": boolean };
    /** The vertical namespaces present (article, book, profile, music, video, payment), with how many properties each. */
    namespaces: Record<string, number>;
  };
  /** The twitter:* reading. */
  twitter: { present: boolean; properties: TwitterProperty[]; card: string | null };
  /** The robots-style metas. */
  robots: RobotsRow[];
  /** The viewport, parsed. */
  viewport: { raw: string; parts: Record<string, string>; zoomRestricted: boolean; line: number | null } | null;
  /** The refresh pragma, parsed. */
  refresh: { raw: string; seconds: number | null; url: string | null; line: number | null } | null;
  /** The JSON-LD blocks. */
  jsonLd: JsonLdBlock[];
  /** Scripts whose type is not application/ld+json but whose text looks like JSON-LD (contains "@context"). */
  jsonLdLookalikes: { typeAttr: string; line: number | null }[];
  /** The findings, by severity (error, warning, info, good) and then by rule. */
  findings: Finding[];
  /** Counts. */
  counts: { metas: number; links: number; og: number; twitter: number; jsonLd: number; findings: { error: number; warning: number; info: number; good: number } };
}

// --- The vocabularies -------------------------------------------------------

/** 4.2.5.1 Standard metadata names. */
export const STANDARD_META_NAMES: ReadonlySet<string> = new Set(["application-name", "author", "description", "generator", "keywords", "referrer", "theme-color", "color-scheme"]);

/** Names registered in the WHATWG MetaExtensions wiki that the inspector describes (a subset of the registry: the ones with wide use). */
export const REGISTERED_META_NAMES: ReadonlySet<string> = new Set(["viewport", "robots", "googlebot", "googlebot-news", "google", "google-site-verification", "msvalidate.01", "rating", "format-detection", "apple-mobile-web-app-capable", "apple-mobile-web-app-title", "apple-mobile-web-app-status-bar-style", "mobile-web-app-capable", "msapplication-tilecolor", "msapplication-tileimage", "msapplication-config", "yandex-verification", "p:domain_verify", "fb:app_id", "fb:pages", "csrf-token", "csrf-param", "creator", "publisher", "copyright", "dcterms.title", "dcterms.creator", "dcterms.date", "dc.title", "dc.creator", "dc.date", "dc.description", "geo.position", "geo.placename", "geo.region", "icbm", "revisit-after", "news_keywords", "article:published_time", "article:modified_time", "og:title", "og:description", "og:image", "og:url", "og:type", "og:site_name", "og:locale", "handheldfriendly", "mobileoptimized", "skype_toolbar", "pinterest", "pinterest-rich-pin", "referrer-policy", "monetization", "darkreader-lock", "web_author", "web-author", "bingbot", "slurp", "duckduckbot", "baiduspider", "yandexbot", "verify-v1", "wot-verification", "norton-safeweb-site-verification", "alexaverifyid", "msapplication-starturl", "msapplication-navbutton-color", "msapplication-window", "msapplication-task", "msapplication-tooltip", "msapplication-square70x70logo", "msapplication-square150x150logo", "msapplication-wide310x150logo", "msapplication-square310x310logo", "msapplication-notification", "theme-color-dark", "supported-color-schemes", "twitter:card", "twitter:site", "twitter:site:id", "twitter:creator", "twitter:creator:id", "twitter:title", "twitter:description", "twitter:image", "twitter:image:src", "twitter:image:width", "twitter:image:height", "twitter:image0", "twitter:image1", "twitter:image2", "twitter:image3", "twitter:url", "twitter:domain", "twitter:player", "twitter:player:width", "twitter:player:height", "twitter:player:stream", "twitter:player:stream:content_type", "twitter:app:name:iphone", "twitter:app:id:iphone", "twitter:app:url:iphone", "twitter:app:name:ipad", "twitter:app:id:ipad", "twitter:app:url:ipad", "twitter:app:name:googleplay", "twitter:app:id:googleplay", "twitter:app:url:googleplay", "twitter:app:country", "twitter:label1", "twitter:data1", "twitter:label2", "twitter:data2"]);

/** The twitter:* names the MetaExtensions wiki registers (the card properties). */
export const TWITTER_REGISTERED: ReadonlySet<string> = new Set([...REGISTERED_META_NAMES].filter((n) => n.startsWith("twitter:")));

/** The card types the wiki names for twitter:card. */
export const TWITTER_CARD_TYPES: ReadonlySet<string> = new Set(["summary", "photo", "app", "player"]);

/** Card types in common use that the wiki does not list (reported as such, without a normative source). */
export const TWITTER_CARD_COMMON: ReadonlySet<string> = new Set(["summary_large_image"]);

/** The names the inspector has a description for (a message key per name). */
export const DESCRIBED_META_NAMES: ReadonlySet<string> = new Set(["application-name", "author", "description", "generator", "keywords", "referrer", "theme-color", "color-scheme", "viewport", "robots", "googlebot", "googlebot-news", "google", "google-site-verification", "msvalidate.01", "rating", "format-detection", "apple-mobile-web-app-capable", "apple-mobile-web-app-title", "mobile-web-app-capable", "msapplication-tilecolor", "msapplication-tileimage", "yandex-verification"]);

/** The pragma directives the standard defines (4.2.5.3), with their status. */
export const PRAGMAS: Readonly<Record<string, "conforming" | "nonconforming">> = Object.freeze({
  "content-language": "nonconforming",
  "content-type": "conforming",
  "default-style": "conforming",
  "refresh": "conforming",
  "set-cookie": "nonconforming",
  "x-ua-compatible": "conforming",
  "content-security-policy": "conforming",
});

/** The link types the HTML Standard defines (4.6.7), as rel tokens on link. */
export const HTML_LINK_TYPES: ReadonlySet<string> = new Set(["alternate", "canonical", "author", "bookmark", "dns-prefetch", "expect", "external", "help", "icon", "manifest", "modulepreload", "license", "next", "nofollow", "noopener", "noreferrer", "opener", "pingback", "preconnect", "prefetch", "preload", "prev", "privacy-policy", "search", "stylesheet", "tag", "terms-of-service"]);

/** rel tokens outside the standard that the inspector lists as icons. */
export const ICON_RELS: ReadonlySet<string> = new Set(["icon", "apple-touch-icon", "apple-touch-icon-precomposed", "mask-icon", "shortcut", "manifest"]);

/** Open Graph: the core and optional root properties (ogp.me). */
export const OG_ROOT: ReadonlySet<string> = new Set(["og:title", "og:type", "og:image", "og:url", "og:audio", "og:description", "og:determiner", "og:locale", "og:locale:alternate", "og:site_name", "og:video"]);

/** Open Graph: the structured properties of og:image, og:video and og:audio. */
export const OG_STRUCTURED: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "og:image": ["url", "secure_url", "type", "width", "height", "alt"],
  "og:video": ["url", "secure_url", "type", "width", "height", "alt"],
  "og:audio": ["url", "secure_url", "type"],
});

/** Open Graph: the global object types (ogp.me "Object Types"). */
export const OG_TYPES: ReadonlySet<string> = new Set(["music.song", "music.album", "music.playlist", "music.radio_station", "video.movie", "video.episode", "video.tv_show", "video.other", "article", "book", "payment.link", "profile", "website"]);

/** Open Graph: the vertical namespaces' properties (ogp.me). */
export const OG_VERTICAL: Readonly<Record<string, readonly string[]>> = Object.freeze({
  article: ["article:published_time", "article:modified_time", "article:expiration_time", "article:author", "article:section", "article:tag"],
  book: ["book:author", "book:isbn", "book:release_date", "book:tag"],
  profile: ["profile:first_name", "profile:last_name", "profile:username", "profile:gender"],
  music: ["music:duration", "music:album", "music:album:disc", "music:album:track", "music:musician", "music:song", "music:song:disc", "music:song:track", "music:release_date", "music:creator"],
  video: ["video:actor", "video:actor:role", "video:director", "video:writer", "video:duration", "video:release_date", "video:tag", "video:series"],
  payment: ["payment:description", "payment:currency", "payment:amount", "payment:expires_at", "payment:recipient_name", "payment:recipient_logo"],
});

/** Google's robots rules: the current ones (with whether they take a value) and the retired ones. */
export const ROBOTS_RULES: Readonly<Record<string, { status: "current" | "retired"; value: boolean }>> = Object.freeze({
  all: { status: "current", value: false },
  noindex: { status: "current", value: false },
  nofollow: { status: "current", value: false },
  none: { status: "current", value: false },
  nosnippet: { status: "current", value: false },
  indexifembedded: { status: "current", value: false },
  "max-snippet": { status: "current", value: true },
  "max-image-preview": { status: "current", value: true },
  "max-video-preview": { status: "current", value: true },
  notranslate: { status: "current", value: false },
  noimageindex: { status: "current", value: false },
  unavailable_after: { status: "current", value: true },
  noarchive: { status: "retired", value: false },
  nocache: { status: "retired", value: false },
  nositelinkssearchbox: { status: "retired", value: false },
  // index and follow are the defaults written out; Google's table lists "all" as the default and does not list these two, but they are universally understood.
  index: { status: "current", value: false },
  follow: { status: "current", value: false },
});

/** The crawler names a robots-style meta may address (name=robots and the user agent tokens Google documents). */
export const ROBOTS_NAMES: ReadonlySet<string> = new Set(["robots", "googlebot", "googlebot-news", "bingbot", "slurp", "duckduckbot", "baiduspider", "yandexbot"]);

// --- Helpers ------------------------------------------------------------------

/** Read an attribute, or null. */
function attr(el: T.Element, name: string): string | null {
  // Find (parse5 lower-cases HTML attribute names).
  const a = el.attrs.find((x) => x.name === name);
  // Value or null.
  return a ? a.value : null;
}

/** The source line of an element, or null for one the parser created. */
function lineOf(el: T.Element): number | null {
  // parse5's location, when the element came from the source.
  const loc = el.sourceCodeLocation;
  // Null for implied elements.
  return loc ? loc.startLine : null;
}

/** The byte offset where an element's start tag ends, in UTF-8 bytes of the source, or null. */
function byteEnd(src: string, el: T.Element): number | null {
  // The location.
  const loc = el.sourceCodeLocation;
  // Null for implied elements.
  if (!loc) return null;
  // Characters to bytes.
  return new TextEncoder().encode(src.slice(0, loc.endOffset)).length;
}

/** The text content of an element (concatenated text nodes), trimmed. */
function textOf(el: T.ParentNode): string {
  // Collect.
  let out = "";
  for (const c of el.childNodes) {
    if (c.nodeName === "#text") out += (c as T.TextNode).value;
    else if ("childNodes" in c) out += textOf(c as T.ParentNode);
  }
  return out;
}

/** True when the element has an ancestor named head. */
function inHead(el: T.Element): boolean {
  // Walk up.
  let cur: T.ParentNode | null = el.parentNode;
  while (cur) {
    if ((cur as T.Element).tagName === "head") return true;
    cur = (cur as T.Element).parentNode ?? null;
  }
  return false;
}

/** Whether a URL string is absolute (has a scheme). */
function isAbsolute(u: string): boolean {
  // scheme ":" per RFC 3986.
  return /^[A-Za-z][A-Za-z0-9+.-]*:/.test(u.trim());
}

/** Lower-case and trim. */
const lc = (s: string | null): string | null => (s === null ? null : s.trim().toLowerCase());

/** Split a comma-separated token list, trimming, dropping empties. */
const commaList = (s: string): string[] => s.split(",").map((x) => x.trim()).filter(Boolean);

/** Parse a viewport content attribute into parts (comma or semicolon separated key=value pairs). */
function parseViewport(raw: string): Record<string, string> {
  // The parts.
  const parts: Record<string, string> = {};
  for (const piece of raw.split(/[,;]/)) {
    const [k, ...rest] = piece.split("=");
    const key = k.trim().toLowerCase();
    if (key) parts[key] = rest.join("=").trim();
  }
  return parts;
}

/** Parse a refresh content attribute: "N" or "N; url=..." (the standard's algorithm, loosely: a number, then an optional URL after a comma or semicolon). */
function parseRefresh(raw: string): { seconds: number | null; url: string | null } {
  // The number.
  const m = /^\s*(\d+(?:\.\d+)?)?/.exec(raw);
  const seconds = m && m[1] !== undefined ? Number(m[1]) : null;
  // The URL part, after a comma or semicolon, with an optional "url=" and optional quotes.
  const rest = raw.slice(m ? m[0].length : 0).replace(/^\s*[;,]?\s*/, "");
  const um = /^(?:url\s*=\s*)?['"]?([^'"]*)['"]?\s*$/i.exec(rest);
  const url = rest && um && um[1] ? um[1] : null;
  return { seconds, url };
}

/** Outline a JSON-LD value: every node object (an object that is not a value object), depth-first. */
function outlineJsonLd(value: unknown, depth: number, out: JsonLdNode[], counter: { nodes: number; untyped: number }): void {
  // Arrays: each member.
  if (Array.isArray(value)) { for (const v of value) outlineJsonLd(v, depth, out, counter); return; }
  // Only objects are nodes.
  if (value === null || typeof value !== "object") return;
  const o = value as Record<string, unknown>;
  // A value object (@value) is not a node; a context object is not a node.
  if ("@value" in o) return;
  // The node's type, id and name.
  const t = o["@type"];
  const type = Array.isArray(t) ? t.map(String).join(", ") : typeof t === "string" ? t : null;
  const id = typeof o["@id"] === "string" ? (o["@id"] as string) : null;
  const nm = o["name"] ?? o["headline"] ?? o["title"];
  const name = typeof nm === "string" ? nm : null;
  // A top-level object that only carries @context and @graph is a container, not a node: count its members instead.
  const keys = Object.keys(o).filter((k) => k !== "@context");
  const container = keys.length > 0 && keys.every((k) => k === "@graph" || k === "@id");
  if (!container) {
    counter.nodes++;
    if (type === null) counter.untyped++;
    if (out.length < JSONLD_NODES_MAX) out.push({ type, id, name, depth });
  }
  // Recurse into every property's value (nested nodes, @graph members, arrays).
  for (const [k, v] of Object.entries(o)) {
    if (k === "@context") continue;
    outlineJsonLd(v, container ? depth : depth + 1, out, counter);
  }
}

// --- The engine ----------------------------------------------------------------

/** run: the engine. */
export function run(input: HeadInput): HeadResult {
  // The source.
  const src = input.html;
  // The ceiling.
  if (src.length > HTML_MAX_CHARS) throw new Error(`The HTML is ${src.length.toLocaleString("en")} characters; the ceiling is ${HTML_MAX_CHARS.toLocaleString("en")}.`);
  // Parse as a document (a head fragment pasted alone still yields html/head/body; the parser puts meta, link, title and script where they belong).
  const doc = parse(src, { sourceCodeLocationInfo: true, scriptingEnabled: false });
  // The findings.
  const findings: Finding[] = [];
  const add = (rule: string, severity: Finding["severity"], line: number | null, params: Record<string, string | number> = {}) => findings.push({ rule, severity, line, params });

  // Walk the whole tree once, collecting the elements of interest.
  const metas: T.Element[] = []; const links: T.Element[] = []; const titles: T.Element[] = []; const scripts: T.Element[] = []; const bases: T.Element[] = [];
  let html: T.Element | null = null; let doctype = false;
  const walk = (n: T.ParentNode) => {
    for (const c of n.childNodes) {
      if (c.nodeName === "#documentType") doctype = true;
      if (!("tagName" in c)) continue;
      const el = c as T.Element;
      // SVG and MathML carry their own title/script/link; only HTML-namespace elements count here.
      if (el.namespaceURI === "http://www.w3.org/1999/xhtml") {
        switch (el.tagName) {
          case "html": html = html ?? el; break;
          case "meta": metas.push(el); break;
          case "link": links.push(el); break;
          case "title": titles.push(el); break;
          case "script": scripts.push(el); break;
          case "base": bases.push(el); break;
        }
      }
      walk(el);
    }
  };
  walk(doc);

  // --- The root and the title ----------------------------------------------------
  const lang = html ? attr(html, "lang") : null;
  // 4.1.1: "Authors are encouraged to specify a lang attribute on the root html element".
  if (html && (lang === null || lang.trim() === "")) add("M42", "warning", lineOf(html), { what: lang === null ? "missing" : "empty" });
  const titleText = titles.length ? textOf(titles[0]).replace(/\s+/g, " ").trim() : null;
  const title = { text: titleText, count: titles.length, line: titles.length ? lineOf(titles[0]) : null, length: titleText ? titleText.length : 0 };
  if (titles.length === 0) add("M1", "error", null);
  if (titles.length > 1) add("M2", "error", lineOf(titles[1]), { n: titles.length });
  if (titles.length >= 1 && title.length === 0) add("M3", "warning", title.line);
  if (titles.length === 1 && title.length > 0) add("M44", "good", title.line, { what: "title" });

  // --- The meta elements -------------------------------------------------------------
  const rows: MetaRow[] = [];
  // The charset declaration(s).
  const charsets: { value: string; source: "charset" | "http-equiv"; el: T.Element }[] = [];
  // description count, application-name per lang, color-scheme count.
  let descriptions = 0; let colorSchemes = 0; const appNames = new Map<string, number>();
  // Open Graph properties and twitter properties, in order.
  const og: OgProperty[] = []; const tw: TwitterProperty[] = [];
  // Robots rows.
  const robots: RobotsRow[] = [];
  // Viewport and refresh.
  let viewport: HeadResult["viewport"] = null; let refresh: HeadResult["refresh"] = null;
  // The head element (for the CSP pragma's placement rule).
  const headEl = html ? (html as T.Element).childNodes.find((c) => (c as T.Element).tagName === "head") ?? null : null;
  // Outside-head metas.
  let outside = 0;
  for (const el of metas) {
    const id = rows.length; const line = lineOf(el); const head = inHead(el);
    const name = attr(el, "name"); const httpEquiv = attr(el, "http-equiv"); const charset = attr(el, "charset"); const itemprop = attr(el, "itemprop"); const property = attr(el, "property");
    const content = attr(el, "content"); const media = attr(el, "media");
    // The kind: the first of the standard's four, then property, then none.
    const kind: MetaKind = name !== null ? "name" : httpEquiv !== null ? "http-equiv" : charset !== null ? "charset" : itemprop !== null ? "itemprop" : property !== null ? "property" : "none";
    // 4.2.5: exactly one of the four; property is the RDFa form; several at once is also a violation.
    const present = [name, httpEquiv, charset, itemprop].filter((x) => x !== null).length;
    if (present === 0 && property === null) add("M34", "error", line);
    if (present > 1) add("M34", "error", line, { what: "several" });
    // content must accompany name, http-equiv and itemprop.
    if ((name !== null || httpEquiv !== null || itemprop !== null) && content === null) add("M35", "error", line, { what: (name ?? httpEquiv ?? itemprop) as string });
    if (!head) outside++;
    // Classify.
    let cls: MetaClass = "unknown"; let key: string | null = null; let describe: string | null = null;
    if (kind === "charset") {
      cls = "charset"; key = "charset";
      if (charset !== null) charsets.push({ value: charset, source: "charset", el });
    } else if (kind === "http-equiv") {
      key = httpEquiv; const k = lc(httpEquiv) ?? "";
      const status = PRAGMAS[k];
      cls = status === undefined ? "unknown" : status === "nonconforming" ? "nonconforming" : "pragma";
      describe = status === undefined ? null : k;
      // The Encoding declaration state carries a charset in content: "text/html; charset=utf-8".
      if (k === "content-type" && content !== null) { const m = /charset\s*=\s*["']?\s*([^\s;"']+)/i.exec(content); if (m) charsets.push({ value: m[1], source: "http-equiv", el }); }
      if (status === "nonconforming") add("M40", "warning", line, { what: k });
      if (k === "x-ua-compatible" && content !== null && content.trim().toLowerCase() !== "ie=edge") add("M41", "warning", line, { what: content.trim() });
      if (k === "refresh" && content !== null) { const r = parseRefresh(content); refresh = { raw: content, seconds: r.seconds, url: r.url, line }; add("M37", "info", line, { seconds: r.seconds ?? 0, url: r.url ?? "" , what: r.url ? "redirect" : "reload" }); }
      if (k === "content-security-policy") { add("M38", "info", line); if (el.parentNode !== headEl) add("M39", "warning", line); }
    } else if (kind === "name") {
      key = name; const k = lc(name) ?? "";
      if (STANDARD_META_NAMES.has(k)) { cls = "standard"; describe = k; }
      else if (k.startsWith("twitter:")) { cls = "twitter"; }
      else if (REGISTERED_META_NAMES.has(k)) { cls = "registered"; describe = DESCRIBED_META_NAMES.has(k) ? k : null; }
      else cls = "unknown";
      // Counting rules.
      if (k === "description") { descriptions++; if (content !== null && content.trim() === "") add("M6", "warning", line); }
      if (k === "color-scheme") colorSchemes++;
      if (k === "application-name") { const l = (attr(el, "lang") ?? "").toLowerCase(); appNames.set(l, (appNames.get(l) ?? 0) + 1); }
      // twitter:*.
      if (k.startsWith("twitter:")) tw.push({ name: name as string, content: content ?? "", line, registered: TWITTER_REGISTERED.has(k) });
      // robots-style.
      if (ROBOTS_NAMES.has(k) && content !== null) {
        const tokens: RobotsToken[] = commaList(content).map((raw) => {
          const [r, ...rest] = raw.split(":"); const rule = r.trim().toLowerCase(); const value = rest.length ? rest.join(":").trim() : null;
          const def = ROBOTS_RULES[rule];
          return { raw, rule, value, status: def ? def.status : "unknown" };
        });
        robots.push({ name: k, tokens, line });
      }
      // viewport.
      if (k === "viewport" && content !== null && viewport === null) {
        const parts = parseViewport(content);
        const us = (parts["user-scalable"] ?? "").toLowerCase(); const ms = parseFloat(parts["maximum-scale"] ?? "");
        const zoomRestricted = us === "no" || us === "0" || (!Number.isNaN(ms) && ms < 2);
        viewport = { raw: content, parts, zoomRestricted, line };
        if (zoomRestricted) add("M11", "warning", line, { what: us === "no" || us === "0" ? "user-scalable=" + us : "maximum-scale=" + parts["maximum-scale"] });
      }
      // Open Graph written with name= instead of property= (seen in the wild): read it as Open Graph too, with a note.
      if (/^(og|article|book|profile|music|video|payment):/.test(k) && content !== null) { og.push(ogProperty(name as string, content, line)); add("M20", "info", line, { what: name as string, which: "name" }); cls = "opengraph"; }
    } else if (kind === "property") {
      key = property; const k = lc(property) ?? "";
      cls = /^(og|article|book|profile|music|video|payment|fb):/.test(k) ? "opengraph" : "unknown";
      if (cls === "opengraph" && content !== null && !k.startsWith("fb:")) og.push(ogProperty(property as string, content, line));
    } else if (kind === "itemprop") { cls = "itemprop"; key = itemprop; }
    rows.push({ id, kind, key, content: kind === "charset" ? charset : content, cls, describe, media, line, inHead: head });
    // An unknown name, outside the standard and the registry.
    if (kind === "name" && cls === "unknown") add("M36", "info", line, { what: name as string });
  }
  // The counting rules' findings.
  if (descriptions === 0) add("M4", "info", null);
  if (descriptions > 1) add("M5", "error", null, { n: descriptions, what: "description" });
  if (descriptions === 1) add("M44", "good", null, { what: "description" });
  if (colorSchemes > 1) add("M5", "error", null, { n: colorSchemes, what: "color-scheme" });
  for (const [l, n] of appNames) if (n > 1) add("M5", "error", null, { n, what: l ? `application-name (lang ${l})` : "application-name" });
  if (outside > 0) add("M43", "info", null, { n: outside });

  // --- The charset ------------------------------------------------------------------
  const cs = charsets[0];
  const charsetOut: HeadResult["charset"] = { value: cs ? cs.value : null, source: cs ? cs.source : null, line: cs ? lineOf(cs.el) : null, count: charsets.length, byteOffsetEnd: cs ? byteEnd(src, cs.el) : null };
  if (charsets.length === 0) add("M7", "error", null);
  if (charsets.length > 1) add("M9", "error", lineOf(charsets[1].el), { n: charsets.length });
  if (cs && cs.value.trim().toLowerCase() !== "utf-8") add("M8", "error", lineOf(cs.el), { what: cs.value });
  if (cs && charsetOut.byteOffsetEnd !== null && charsetOut.byteOffsetEnd > 1024) add("M8", "error", lineOf(cs.el), { what: cs.value, which: "late", bytes: charsetOut.byteOffsetEnd });
  if (cs && charsets.length === 1 && cs.value.trim().toLowerCase() === "utf-8" && (charsetOut.byteOffsetEnd ?? 0) <= 1024) add("M44", "good", lineOf(cs.el), { what: "charset" });

  // --- The link elements ---------------------------------------------------------------
  const linkRows: LinkRow[] = []; const canonical: HeadResult["canonical"] = []; const hreflang: HeadResult["hreflang"] = []; const icons: HeadResult["icons"] = [];
  for (const el of links) {
    const rels = (attr(el, "rel") ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    const href = attr(el, "href"); const line = lineOf(el);
    linkRows.push({ id: linkRows.length, rels, knownRels: rels.filter((r) => HTML_LINK_TYPES.has(r)), href, hreflang: attr(el, "hreflang"), type: attr(el, "type"), sizes: attr(el, "sizes"), media: attr(el, "media"), as: attr(el, "as"), title: attr(el, "title"), line, inHead: inHead(el) });
    if (rels.includes("canonical") && href !== null) canonical.push({ href, line });
    if (rels.includes("alternate") && attr(el, "hreflang") !== null) hreflang.push({ lang: attr(el, "hreflang") as string, href, line });
    const iconRel = rels.find((r) => ICON_RELS.has(r));
    if (iconRel) icons.push({ rel: rels.join(" "), href, sizes: attr(el, "sizes"), type: attr(el, "type") });
  }
  if (canonical.length === 0) add("M12", "info", null);
  if (canonical.length > 1) add("M13", "warning", canonical[1].line, { n: canonical.length });
  if (canonical.length === 1) add("M44", "good", canonical[0].line, { what: "canonical" });
  if (canonical.length >= 1 && !isAbsolute(canonical[0].href)) add("M14", "info", canonical[0].line, { what: canonical[0].href });
  if (hreflang.length > 0) add("M45", "info", hreflang[0].line, { n: hreflang.length, what: hreflang.some((h) => h.lang.toLowerCase() === "x-default") ? "xdefault" : "none" });

  // --- Open Graph ----------------------------------------------------------------------
  // Attach structured properties to the nearest preceding root of their kind; a structured property with no root before it is an orphan.
  const first: Record<string, string> = {}; const counts: Record<string, number> = {}; const media: OgMedia[] = []; const namespaces: Record<string, number> = {};
  let lastRoot: { name: string; media: OgMedia | null } | null = null;
  for (const p of og) {
    const k = p.property.toLowerCase();
    if (p.namespace !== "og") namespaces[p.namespace] = (namespaces[p.namespace] ?? 0) + 1;
    if (p.structuredOf === null) {
      // A root property: arrays keep the first value.
      if (!(k in first)) first[k] = p.content;
      counts[k] = (counts[k] ?? 0) + 1;
      if (k === "og:image" || k === "og:video" || k === "og:audio") { const m: OgMedia = { root: k, url: p.content, secureUrl: null, type: null, width: null, height: null, alt: null, line: p.line }; media.push(m); lastRoot = { name: k, media: m }; }
      else lastRoot = { name: k, media: null };
    } else {
      // A structured property: attach to the most recent root of its kind.
      const target = media.length && lastRoot && lastRoot.name === p.structuredOf && lastRoot.media ? lastRoot.media : [...media].reverse().find((m) => m.root === p.structuredOf) ?? null;
      const sub = k.slice(p.structuredOf.length + 1);
      if (target === null) { p.orphan = true; add("M18", "warning", p.line, { what: p.property, which: p.structuredOf }); }
      else if (sub === "url") target.url = target.url || p.content;
      else if (sub === "secure_url") target.secureUrl = p.content;
      else if (sub === "type") target.type = p.content;
      else if (sub === "width") target.width = p.content;
      else if (sub === "height") target.height = p.content;
      else if (sub === "alt") target.alt = p.content;
    }
    if (!p.known) add("M20", "info", p.line, { what: p.property, which: "unknown" });
  }
  const ogPresent = og.length > 0;
  const required = { "og:title": "og:title" in first, "og:type": "og:type" in first, "og:image": "og:image" in first, "og:url": "og:url" in first };
  if (!ogPresent) add("M21", "info", null);
  if (ogPresent) {
    const missing = (Object.keys(required) as (keyof typeof required)[]).filter((r) => !required[r]);
    if (missing.length) add("M16", "warning", null, { what: missing.join(", "), n: missing.length });
    else add("M44", "good", null, { what: "opengraph" });
    for (const m of media) if (m.root === "og:image" && (m.alt === null || m.alt.trim() === "")) add("M17", "warning", m.line, { what: m.url });
    const locale = first["og:locale"];
    if (locale !== undefined && !/^[a-z]{2,3}_[A-Z]{2}$/.test(locale.trim())) add("M19", "warning", null, { what: locale });
    const type = first["og:type"];
    if (type !== undefined && !OG_TYPES.has(type.trim().toLowerCase()) && !type.includes(":")) add("M20", "info", null, { what: `og:type=${type}`, which: "type" });
    for (const m of media) if (!isAbsolute(m.url)) add("M46", "info", m.line, { what: m.url, which: m.root });
    if (first["og:url"] !== undefined && !isAbsolute(first["og:url"])) add("M46", "info", null, { what: first["og:url"], which: "og:url" });
    if (first["og:url"] !== undefined && canonical.length >= 1 && first["og:url"].trim() !== canonical[0].href.trim()) add("M15", "info", null, { what: first["og:url"], which: canonical[0].href });
  }

  // --- twitter:* -------------------------------------------------------------------------
  const cardRow = tw.find((t) => t.name.toLowerCase() === "twitter:card");
  const card = cardRow ? cardRow.content.trim() : null;
  if (tw.length > 0 && card === null) add("M22", "warning", tw[0].line);
  if (card !== null && !TWITTER_CARD_TYPES.has(card.toLowerCase())) add("M23", "info", cardRow!.line, { what: card, which: TWITTER_CARD_COMMON.has(card.toLowerCase()) ? "common" : "unknown" });
  for (const t of tw) if (!t.registered) add("M24", "info", t.line, { what: t.name });

  // --- robots ------------------------------------------------------------------------------
  for (const r of robots) {
    for (const tk of r.tokens) {
      if (tk.rule === "noindex" || tk.rule === "none") add("M30", "info", r.line, { what: tk.raw, which: r.name });
      if (tk.status === "retired") add("M32", "info", r.line, { what: tk.rule, which: r.name });
      if (tk.status === "unknown") add("M33", "info", r.line, { what: tk.raw, which: r.name });
    }
  }
  // Conflicts between the rules one crawler receives: robots and googlebot both address Google's main crawler (Google: "In the case of
  // conflicting robots (or googlebot) meta tags, the more restrictive tag applies"); googlebot-news and other crawlers are read on their own.
  const groups = new Map<string, { rules: string[]; line: number | null }>();
  for (const r of robots) {
    const g = r.name === "googlebot" ? "robots" : r.name;
    const cur = groups.get(g) ?? { rules: [], line: r.line };
    cur.rules.push(...r.tokens.map((t) => t.rule));
    groups.set(g, cur);
  }
  for (const [g, { rules: all, line }] of groups) {
    const conflicts: string[] = [];
    if ((all.includes("index") || all.includes("all")) && (all.includes("noindex") || all.includes("none"))) conflicts.push("index / noindex");
    if ((all.includes("follow") || all.includes("all")) && (all.includes("nofollow") || all.includes("none"))) conflicts.push("follow / nofollow");
    if (all.includes("max-snippet") && all.includes("nosnippet")) conflicts.push("max-snippet / nosnippet");
    if (conflicts.length) add("M31", "warning", line, { what: conflicts.join("; "), which: g === "robots" ? "robots / googlebot" : g });
  }
  if (viewport === null) add("M10", "info", null);

  // --- JSON-LD ---------------------------------------------------------------------------------
  const jsonLd: JsonLdBlock[] = []; const lookalikes: HeadResult["jsonLdLookalikes"] = [];
  for (const el of scripts) {
    const typeAttr = (attr(el, "type") ?? "").trim(); const text = textOf(el); const line = lineOf(el);
    if (typeAttr.toLowerCase().split(";")[0].trim() === "application/ld+json") {
      const block: JsonLdBlock = { index: jsonLd.length, line, typeAttr, valid: true, error: null, context: null, graph: false, nodes: [], nodeCount: 0, untyped: 0, unsafeSequence: /<\/script|<!--/i.test(text), length: text.length };
      try {
        const v = JSON.parse(text) as unknown;
        const top = Array.isArray(v) ? v[0] : v;
        const ctxv = top && typeof top === "object" ? (top as Record<string, unknown>)["@context"] : undefined;
        block.context = typeof ctxv === "string" ? ctxv : Array.isArray(ctxv) ? "array" : ctxv && typeof ctxv === "object" ? "object" : null;
        block.graph = !!(top && typeof top === "object" && "@graph" in (top as object));
        const counter = { nodes: 0, untyped: 0 };
        outlineJsonLd(v, 0, block.nodes, counter);
        block.nodeCount = counter.nodes; block.untyped = counter.untyped;
        if (block.context === null) add("M26", "warning", line, { n: block.index + 1 });
        if (block.untyped > 0) add("M27", "info", line, { n: block.index + 1, count: block.untyped });
        if (block.nodeCount > 0 && block.context !== null && block.untyped === 0) add("M44", "good", line, { what: "jsonld", n: block.index + 1 });
      } catch (e) {
        block.valid = false; block.error = (e as Error).message;
        add("M25", "error", line, { n: block.index + 1, what: block.error });
      }
      if (block.unsafeSequence) add("M28", "warning", line, { n: block.index + 1 });
      jsonLd.push(block);
    } else if (/"@context"/.test(text) && /^(application\/json|text\/plain|application\/javascript|text\/javascript|)$/i.test(typeAttr.toLowerCase().split(";")[0].trim())) {
      // Looks like JSON-LD but the type attribute is not application/ld+json.
      lookalikes.push({ typeAttr, line }); add("M29", "info", line, { what: typeAttr || "(none)" });
    }
  }

  // --- Order and count ------------------------------------------------------------------------
  const order = { error: 0, warning: 1, info: 2, good: 3 };
  findings.sort((a, b) => order[a.severity] - order[b.severity] || Number(a.rule.slice(1)) - Number(b.rule.slice(1)) || (a.line ?? 0) - (b.line ?? 0));
  const fc = { error: 0, warning: 0, info: 0, good: 0 };
  for (const f of findings) fc[f.severity]++;
  // Done.
  return {
    mode: doc.mode, doctype, lang, title, charset: charsetOut, base: bases.length ? attr(bases[0], "href") : null,
    metas: rows, links: linkRows, canonical, hreflang, icons,
    openGraph: { present: ogPresent, properties: og, first, counts, media, type: first["og:type"] ?? null, required, namespaces },
    twitter: { present: tw.length > 0, properties: tw, card },
    robots, viewport, refresh, jsonLd, jsonLdLookalikes: lookalikes, findings,
    counts: { metas: rows.length, links: linkRows.length, og: og.length, twitter: tw.length, jsonLd: jsonLd.length, findings: fc },
  };
}

/** Build an OgProperty from a property name and content: namespace, root/structured, known. */
function ogProperty(property: string, content: string, line: number | null): OgProperty {
  // Lower-cased for the tables.
  const k = property.toLowerCase();
  // The namespace is the part before the first colon.
  const namespace = k.slice(0, k.indexOf(":"));
  // Structured: og:image:width etc., attached to og:image / og:video / og:audio.
  let structuredOf: string | null = null;
  for (const root of Object.keys(OG_STRUCTURED)) if (k.startsWith(root + ":") && OG_STRUCTURED[root].includes(k.slice(root.length + 1))) structuredOf = root;
  // Known: a root, a structured property, or a vertical namespace's property (arrays of structured sub-properties such as music:album:disc included).
  const known = OG_ROOT.has(k) || structuredOf !== null || Object.values(OG_VERTICAL).some((list) => list.includes(k));
  return { property, content, line, namespace, structuredOf, orphan: false, known };
}

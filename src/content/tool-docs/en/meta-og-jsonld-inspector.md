## What it does

Takes a page, or just the contents of its head, and reads what it declares the way each standard reads it. The HTML is parsed inertly with parse5 (the parser behind the HTML structure explainer and the CSS selector tester), so a head pasted without `html` or `head` tags is placed where the parser puts it, exactly as a browser would. Nothing is fetched, resolved, executed or rendered: URLs stay strings, scripts stay text, JSON is parsed with `JSON.parse` and never evaluated. The hosted API runs the same code.

## What it reads, and against what

- **title and encoding** (HTML Living Standard 4.2.2, 4.2.5.4): one title with text; a character encoding declaration, `utf-8`, once, with the element ending within the first 1024 bytes (the byte offset is shown).
- **Every meta element** (4.2.5): classified by how it identifies itself, name, http-equiv, charset, itemprop, or RDFa's property (the Open Graph form, conforming through HTML+RDFa 1.1), and by what the key is: one of the eight standard metadata names (4.2.5.1), a name registered in the WHATWG MetaExtensions wiki (viewport, robots, the verification names, twitter:* and others), a pragma directive (4.2.5.3: content-type, default-style, refresh, x-ua-compatible, content-security-policy) or one the standard calls non-conforming (content-language, set-cookie), or unknown. Each known name carries the standard's or the registry's own sentence. The once-only rules (description, color-scheme, application-name per language) are checked, and a meta element with none of the identifying attributes or without `content` is an error.
- **Every link element** (4.6.7): the rel tokens with the ones the standard defines marked; `rel=canonical` per RFC 6596 (relative, several); `rel=alternate` with `hreflang` listed, with whether an `x-default` is among them; icons, apple-touch-icon, mask-icon and manifest.
- **Open Graph** (ogp.me): the four required properties (og:title, og:type, og:image, og:url), the optional ones, arrays (the first value is preferred, as ogp.me says), the structured properties of og:image, og:video and og:audio attached to the root before them, and a structured property with no root before it reported as such; og:locale's language_TERRITORY form; og:type against the global types; the vertical namespaces (article, book, profile, music, video, payment) and any property ogp.me does not list. Open Graph written with `name=` instead of `property=` is read too, with a note.
- **twitter:\*** card properties as registered in MetaExtensions: twitter:card with the four types the registry names (summary, photo, app, player; `summary_large_image` is reported as in common use, since X's own card documentation is no longer published), and every name checked against the registry.
- **robots, googlebot and the other crawler names** against Google's published rule list: current rules with their values (max-snippet, max-image-preview, max-video-preview, unavailable_after), retired rules (noarchive, nocache, nositelinkssearchbox), unknown ones, and conflicts within what one crawler receives ("the more restrictive rule applies").
- **viewport**, parsed into its parts, with a warning when `user-scalable=no` or a `maximum-scale` below 2 keeps users from the 200 percent of WCAG 2.2 SC 1.4.4; **refresh**, parsed into seconds and URL; a **Content Security Policy** in a meta element, handed to the CSP evaluator, and flagged when the meta element is not a child of head (the standard then ignores it).
- **JSON-LD** (JSON-LD 1.1 section 7): every `script type="application/ld+json"` parsed; the @context, whether the top level is a @graph, an outline of the nodes with @type, @id and a name-like property, nodes without @type counted; invalid JSON reported with the parser's message; the sequences section 7.2 says to escape (`</script`, `<!--`) flagged; a script of another type that contains `@context` reported as a look-alike.

## The findings

Forty-six rules, M1 to M46, each quoting the sentence it rests on: errors are conformance requirements broken (no title, two titles, two descriptions, no or non-UTF-8 or late charset, a meta without an identifying attribute or without content, invalid JSON-LD); warnings are should-rules and documented consumer expectations (a zoom-restricting viewport, several canonicals, a required Open Graph property missing, og:image without og:image:alt, a structured property before its root, a malformed og:locale, twitter:* without twitter:card, JSON-LD without @context, conflicting robots rules, a non-conforming pragma, a CSP meta outside head, no lang on the root); notes are facts worth knowing (no description, no viewport, no canonical, no Open Graph, a relative canonical or og:image, a noindex, a retired rule, a meta refresh, an unknown name); and "in order" marks what the page gets right.

## What it does not do

It does not fetch anything, so it cannot say whether an image exists, how large it is, whether a canonical target answers, or how a given platform will render a share card. It does not validate JSON-LD against the schema.org vocabulary; it reports the types and the structure. What a crawler or a social platform does with a tag is quoted from that party's published documentation, with its date; where a party has withdrawn its documentation (X's card markup), the inspector says so rather than guessing.

## Sources

- [HTML Living Standard, the meta element and metadata names](https://html.spec.whatwg.org/multipage/semantics.html#the-meta-element) (read 2026-10-05)
- [HTML Living Standard, link types](https://html.spec.whatwg.org/multipage/links.html#linkTypes) (read 2026-10-05)
- [WHATWG wiki, MetaExtensions](https://wiki.whatwg.org/wiki/MetaExtensions) (read 2026-10-05; last edited 12 October 2023)
- [The Open Graph protocol](https://ogp.me/) (read 2026-10-05)
- [HTML+RDFa 1.1, Second Edition, W3C Recommendation 17 March 2015](https://www.w3.org/TR/html-rdfa/) (read 2026-10-05)
- [JSON-LD 1.1, W3C Recommendation 16 July 2020, section 7](https://www.w3.org/TR/json-ld11/#embedding-json-ld-in-html-documents) (read 2026-10-05)
- [RFC 6596, The Canonical Link Relation](https://www.rfc-editor.org/rfc/rfc6596) (read 2026-10-05)
- [Google Search Central, Meta tags and attributes that Google supports](https://developers.google.com/search/docs/crawling-indexing/special-tags) (read 2026-10-05; last updated 2025-12-10)
- [Google Search Central, Robots meta tag, data-nosnippet, and X-Robots-Tag specifications](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) (read 2026-10-05; last updated 2026-03-24)
- [WCAG 2.2, SC 1.4.4 Resize Text](https://www.w3.org/TR/WCAG22/#resize-text) (read 2026-10-05)
- [parse5](https://github.com/inikulin/parse5) (read 2026-10-05)

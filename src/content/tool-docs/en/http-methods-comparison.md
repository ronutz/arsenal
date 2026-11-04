## What it does

Enter one to four HTTP (Hypertext Transfer Protocol) method names and the tool returns each one's protocol-level facts: whether it is safe, idempotent, and cacheable, what its request-body semantics are, whether CORS (Cross-Origin Resource Sharing) lets browsers send it without a preflight (the permission-asking OPTIONS request a browser fires before any non-simple cross-origin request), whether HTML forms can produce it declaratively, and which RFC defines it. Ask for two or more ("get vs query") and it also names exactly the properties where they differ. The table covers the nine core methods of RFC 9110, PATCH (RFC 5789), the WebDAV trio PROPFIND, REPORT, and SEARCH, and the headline row: QUERY, registered by RFC 10008 in June 2026 - the first new HTTP method since PATCH in 2010.

Under the field, a button per method in the table adds that method to the line or takes it out, so a comparison is built without typing; with four named, the others wait.

## The vocabulary, precisely

Safe means the client requests no state change; idempotent means repeating the identical request leaves the server in the same state, which is what makes automatic retries legal. Both are IANA-registered promises about intent - a generic cache, proxy, or retry layer can act on them without knowing anything about your API. Neither says anything about the payload: a QUERY body can carry the same injection attempt a POST body can, which is why the tool's closing note insists on POST-level inspection for QUERY.

Cacheability has three honest values in the table: GET and HEAD are the cacheable pair; POST and PATCH responses are cacheable only when explicit freshness information is present (in practice, almost never); QUERY is cacheable by design, with the RFC 10008 requirement that the cache key incorporate the request content - the mechanism that makes a body-carrying request cacheable, and the exact spot where a sloppy cache implementation turns into cache poisoning.

Request-body semantics separate four cases the ecosystem constantly conflates: bodies that are the point (POST, PUT, PATCH, QUERY, the WebDAV trio), bodies with no defined semantics that servers may reject outright (GET, HEAD, DELETE - RFC 9110 says so explicitly), bodies that are allowed but meaningless (OPTIONS), and bodies that are prohibited (CONNECT, TRACE).

## Why QUERY is the interesting row

QUERY is the missing middle the table makes visible: safe + idempotent + cacheable like GET, body like POST. It exists because GET forces queries into the URL (length limits, encoding pain, logging and Referer leakage) while POST /search lies to the infrastructure - nothing in the protocol marks it read-only, so nothing in the middle can cache or retry it. The comparison "post vs query" shows five properties flipping at once; "get vs query" shows the three that matter for adoption: the body, the CORS preflight (QUERY is not safelisted), and HTML forms (a form with method="query" falls back to GET today and drops the body).

## Worked examples

`query` alone gives the full RFC 10008 row. `get vs query` answers the canonical question with three differences. `post,query` shows the migration story: five flips. `put delete` shows the pair that is idempotent without being safe. `trace` and `connect` show the two methods forbidden a body. `search` tells the naming history: QUERY's early drafts were called SEARCH until the 2021 rename.

## Share results

Under the panels, **Share results** builds a link to this page, only when you press it, that carries the line as typed after the `#`, and nothing else: one to four method names, which say nothing about you. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. The HTTP message decoder's links that hand a method to this page use the same `#input=` and fill the field the same way.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the line is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The line fills the field as typing would and the page compares the methods; nothing is sent anywhere. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Provenance

Every safe/idempotent value is the IANA HTTP Method Registry's own column, cross-checked against RFC 9110 §9.3, RFC 10008, RFC 5789, and the WebDAV specifications (RFC 4918, 3253, 5323); CORS safelisting is per the WHATWG Fetch specification, and the forms status per the open WHATWG HTML discussion. All sources fetched 2026-07-20. The tool ships 19 golden vectors pinning every row, so any drift in the table breaks the build.

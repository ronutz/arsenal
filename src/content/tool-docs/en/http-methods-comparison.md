## What it does

Enter one to four HTTP (Hypertext Transfer Protocol) method names and the tool returns each one's protocol-level facts: whether it is safe, idempotent, and cacheable, what its request-body semantics are, whether CORS (Cross-Origin Resource Sharing) lets browsers send it without a preflight, whether HTML forms can produce it declaratively, and which RFC defines it. Ask for two or more ("get vs query") and it also names exactly the properties where they differ. The table covers the nine core methods of RFC 9110, PATCH (RFC 5789), the WebDAV trio PROPFIND, REPORT, and SEARCH, and the headline row: QUERY, registered by RFC 10008 in June 2026 - the first new HTTP method since PATCH in 2010.

## The vocabulary, precisely

Safe means the client requests no state change; idempotent means repeating the identical request leaves the server in the same state, which is what makes automatic retries legal. Both are IANA-registered promises about intent - a generic cache, proxy, or retry layer can act on them without knowing anything about your API. Neither says anything about the payload: a QUERY body can carry the same injection attempt a POST body can, which is why the tool's closing note insists on POST-level inspection for QUERY.

Cacheability has three honest values in the table: GET and HEAD are the cacheable pair; POST and PATCH responses are cacheable only when explicit freshness information is present (in practice, almost never); QUERY is cacheable by design, with the RFC 10008 requirement that the cache key incorporate the request content - the mechanism that makes a body-carrying request cacheable, and the exact spot where a sloppy cache implementation turns into cache poisoning.

Request-body semantics separate four cases the ecosystem constantly conflates: bodies that are the point (POST, PUT, PATCH, QUERY, the WebDAV trio), bodies with no defined semantics that servers may reject outright (GET, HEAD, DELETE - RFC 9110 says so explicitly), bodies that are allowed but meaningless (OPTIONS), and bodies that are prohibited (CONNECT, TRACE).

## Why QUERY is the interesting row

QUERY is the missing middle the table makes visible: safe + idempotent + cacheable like GET, body like POST. It exists because GET forces queries into the URL (length limits, encoding pain, logging and Referer leakage) while POST /search lies to the infrastructure - nothing in the protocol marks it read-only, so nothing in the middle can cache or retry it. The comparison "post vs query" shows five properties flipping at once; "get vs query" shows the three that matter for adoption: the body, the CORS preflight (QUERY is not safelisted), and HTML forms (a form with method="query" falls back to GET today and drops the body).

## Worked examples

`query` alone gives the full RFC 10008 row. `get vs query` answers the canonical question with three differences. `post,query` shows the migration story: five flips. `put delete` shows the pair that is idempotent without being safe. `trace` and `connect` show the two methods forbidden a body. `search` tells the naming history: QUERY's early drafts were called SEARCH until the 2021 rename.

## Provenance

Every safe/idempotent value is the IANA HTTP Method Registry's own column, cross-checked against RFC 9110 §9.3, RFC 10008, RFC 5789, and the WebDAV specifications (RFC 4918, 3253, 5323); CORS safelisting is per the WHATWG Fetch specification, and the forms status per the open WHATWG HTML discussion. All sources fetched 2026-07-20. The tool ships 19 golden vectors pinning every row, so any drift in the table breaks the build.

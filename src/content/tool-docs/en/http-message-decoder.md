## What it does

Reads a raw HTTP/1.1 message, request or response, the way a capture, a proxy log, a `curl -v` trace or an RFC example gives it, and decodes it without sending anything:

- **The start line.** A request line is read as method, request-target and version: the method against the table the [HTTP methods comparison](/tools/http-methods-comparison) uses (safe, idempotent, the defining specification), the target against the four forms of RFC 9112 Section 3.2 (origin-form `/path`, absolute-form `scheme://host/path`, authority-form `host:port` for CONNECT, asterisk-form `*` for a server-wide OPTIONS), the version against `HTTP-version = HTTP-name "/" DIGIT "." DIGIT`. A status line is read as version, three-digit code and reason phrase; the code is looked up in the IANA status code registry, and the reason phrase sent is shown beside the registry's, since RFC 9110 says reason phrases "are only recommendations" and a client "SHOULD ignore the reason-phrase content".
- **The fields.** Each `name: value` line is checked against the IANA field name registry (permanent, deprecated, obsoleted; anything else is unregistered, and an `X-` prefix is noted with RFC 6648) and filed under the part of the specification that defines it: framing (RFC 9112), routing and connection, message metadata, request and response context, representation, negotiation, conditional requests, range requests (RFC 9110 Sections 6 to 14), caching (RFC 9111), cookies (rfc6265bis), security policy, CORS and fetch metadata (the WHATWG Fetch and HTML specifications, CSP, HSTS), WebSocket, proxies and CDNs, WebDAV. Obsolete line folding is joined, whitespace before a colon is flagged, repeated singleton fields are flagged, and HTTP-date values are checked against the three formats of RFC 9110 Section 5.6.7.
- **The framing.** Which of the eight rules of RFC 9112 Section 6.3 decides where the body ends: a response that cannot carry one (HEAD, 1xx, 204, 304), a CONNECT tunnel, Transfer-Encoding overriding Content-Length, chunked as the final coding, an invalid Content-Length, a valid one, a request with neither (length zero), a response with neither (read to close). Content-Length is validated against `1*DIGIT`, repeated values compared, and the declared length compared with the octets actually pasted. A chunked body is decoded by the algorithm of Section 7.1.3: each chunk's size, extensions and data, the last-chunk, the trailer fields, the decoded length, and whatever is left after the body ended, which a recipient would read as the next message.
- **Credentials and cookies.** `Authorization` and `Proxy-Authorization` are surfaced with the value masked; Basic credentials are decoded to the user-id only (RFC 7617: user-id, a colon and the password, Base64-encoded; "not a secure method of user authentication"), and a Bearer token shaped like a JWT is handed to the [JWT decoder](/tools/jwt) without travelling in the link. `Cookie` pairs are listed with masked values; each `Set-Cookie` is read for Secure, HttpOnly, SameSite (Lax by default), the `__Secure-` and `__Host-` prefix requirements, Max-Age over Expires and the Expires format.
- **Hand-offs.** The status code to the [status code explainer](/tools/http-status-code-explainer), the method to the methods comparison, the URL (when it carries no query) to the [URL inspector](/tools/url-inspector), the security headers to the [secure headers](/tools/secure-headers) grader, a request to the [HTTP request translator](/tools/http-request-translator) for the curl, fetch, HTTPie, Python and PowerShell forms.

## The rules

Twenty-eight rules, H1 to H28, each citing its sentence: the start line (H1, H16, H17, H18, H24, H25), Host (H2), field syntax (H3, H4, H5, H20, H21, H22, H23, H28), framing (H6, H7, H8, H9, H10, H11, H12, H13, H26), credentials and cookies (H14, H15), HTTP-dates (H19) and connection options (H27). Findings are listed by line and marked on a numbered copy of the message.

## What it deliberately does not do

- It never sends, replays, tampers or fuzzes: the decode-only half of an inspector (D-53). The [HTTP request translator](/tools/http-request-translator) is where a request becomes a command you can run yourself.
- It does not grade security headers or decode JWTs itself; the tools that do are one click away, and the secret never travels in the link.
- It does not model HTTP/2 or HTTP/3 framing: those carry fields in binary frames, and a text paste of them is already a decoder's output.

## Share results

At the top of the reading, under the summary, **Share results** builds a link to this page, only when you press it, that carries the message after the `#` with every credential masked, never as typed: the panels mask credentials and cookies, but the code view shows the message as pasted. Its popover says first what the link carries and how many values were masked, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

What is masked, so that the page that opens the link reads the same message:

- **`Authorization` and `Proxy-Authorization`** keep their scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2); Basic keeps its user-id, so the page still names the user ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), section 2); a JWT keeps its protected header, so the page still marks it a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1); an AWS Signature Version 4 credential (`AWS4-HMAC-SHA256`) keeps its credential scope and `SignedHeaders` and loses the access key ID and the signature, so the date and the Region still read ([Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html), read 2026-11-01); the rest becomes `REDACTED`.
- **`Cookie` and `Set-Cookie`**: every cookie value is filled with `*` for each of its characters, so the cookie table shows the same lengths; names, prefixes and attributes stay ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1 and 4.2.1).
- **A field named like a secret** (`X-API-Key`), **the request target**'s password and secret parameters, and a token inside any other value (a `Referer` or a `Location` with a code) become `REDACTED`. A folded continuation line goes with its field.
- **The body**: JSON members and form parameters named like a secret (`access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sections 2.2 and 2.3), `refresh_token`, `client_secret`, `password` and `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sections 2.3.1, 4.1.2, 4.3.2 and 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), section 4.5), and any name ending in token, secret, password or api key) are filled with `*` for each of its octets, so the body keeps its length: `Content-Length` against the body and every chunk size read as before. A trailer field named like a secret is filled the same way.

The tool's share vectors check that the page that opens the link reads the same message: the start line, the fields, the framing, the credentials' schemes and user-ids, the cookie names and lengths, the findings and the hand-offs. If a key or token is left where no name marks it (a private key in a body), there is no link: the popover names its line.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the copy is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy replaces the box as a paste would and the page decodes it; nothing is sent or replayed. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Limits

- Octet counts are UTF-8 counts of the pasted text; a body with binary content or another charset measures differently on the wire, and a paste often loses trailing bytes, so a Content-Length mismatch is reported as a fact about the paste.
- The scheme of a request's URL is not in an HTTP/1.1 message; `http` is assumed when the URL is assembled from Host and an origin-form target.
- Whether a response answers a HEAD request cannot be known from the response alone; rule 1 is applied for 1xx, 204 and 304 only.
- Field values are shown as written except credentials and cookies, which are masked. The message stays in the browser; a share link is reviewed before it is made, because a message routinely carries a session.

## Sources

- [RFC 9112: HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112.html) (read 2026-10-05): Sections 2.1, 2.2, 2.3, 3, 3.2, 4, 5, 5.2, 6.1, 6.3, 7.1
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) (read 2026-10-05): Sections 5.1, 5.3, 5.5, 5.6.7, 7.2, 7.6.1, 8.6, 9.2.1, 9.2.2, 11.1, 11.6.2, 15, 15.1
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111.html) (read 2026-10-05)
- [IANA: HTTP Field Name Registry](https://www.iana.org/assignments/http-fields/field-names.csv) (read 2026-10-05)
- [IANA: HTTP Status Code Registry](https://www.iana.org/assignments/http-status-codes/http-status-codes-1.csv) (read 2026-10-05)
- [draft-ietf-httpbis-rfc6265bis-22: Cookies: HTTP State Management Mechanism](https://www.ietf.org/archive/id/draft-ietf-httpbis-rfc6265bis-22.html) (read 2026-10-05)
- [RFC 7617: The 'Basic' HTTP Authentication Scheme](https://www.rfc-editor.org/rfc/rfc7617.html) (read 2026-10-05)
- [RFC 6648: Deprecating the "X-" Prefix and Similar Constructs in Application Protocols](https://www.rfc-editor.org/rfc/rfc6648.html) (read 2026-10-05)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-11-01): section 3.5, the fragment, which a Share results link uses

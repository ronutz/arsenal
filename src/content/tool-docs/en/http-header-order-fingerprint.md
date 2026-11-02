## What it does

Paste a raw HTTP request header block - a request line and one "Name: value" per line - and the tool explains how the order and casing of the headers fingerprint the client. It classifies the sender as a Chromium-family browser, Firefox, or an HTTP library by matching the header sequence and checking for browser-only headers like Sec-Fetch and Sec-CH-UA, notes the HTTP/2 lowercasing signal, and lists any common browser headers that are missing.

## The passive-HTTP analog of JA3

JA3 fingerprints a TLS client by the order of the ciphers and extensions in its ClientHello. Header order is the same idea one layer up: browsers, libraries, and bots each emit request headers in a characteristic sequence, and that sequence survives even when the values are spoofed. A request whose header order contradicts the User-Agent it claims - Chrome's UA with curl's header set - is a classic bot tell, which is why bot-detection and WAF systems key on it.

## Reading the result

The order hash is a short stable id for the exact header sequence, shown for display only. The per-header notes explain why each position matters; the casing note flags whether the block looks like an HTTP/1.1 capture (Title-Case) or an HTTP/2 one (lowercase on the wire). Decode/explain only; the headers you paste never leave your browser.

## Share results

Under the client read, **Share results** builds a link to this page, only when you press it, that carries after the `#` a copy of the block in which every credential is replaced by the word `REDACTED`, never the block as pasted. Its popover says first what the link carries and how many values were replaced, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

A header block copied from devtools, a capture or `curl -v` nearly always carries a session cookie, and often a token, and the reading needs none of them: it reads the header names (their order, their casing, which common ones are missing) and the User-Agent's value. So the copy keeps every name, their order and the User-Agent, and replaces, by the rules the site's HTTP tools share: the credentials of `Authorization` and `Proxy-Authorization`, keeping the scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"; Basic keeps its user-id, [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), section 2); every cookie value of a `Cookie` line, names kept ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1); the whole value of a header whose name holds a secret (`X-API-Key`, `X-Auth-Token`); and a URL's password or a secret parameter inside any value or the request target (`access_token`, `code`, [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), section 4.1.2). All of these were read on 2026-11-01. The copy must give the same reading as the paste; it always does, since nothing the page reads changes.

A token where no name says so (a JWT in the path) cannot be replaced safely: the copy is checked again, and a PEM private key, a JWS or JWE, or a URL password left anywhere means no link; the popover names the line. There is no switch to send the replaced values: they are credentials, and the reading does not need them.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the copy is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page reads it; nothing is sent. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

# HTTP status code explainer

Paste status codes - bare (`404`), several at once (`301 302 307`), or whole families (`5xx`) - and get each one decoded: the family it belongs to, its registered name, its documented meaning, and the operational notes that matter when the code shows up in a log at 3 a.m.

## What it explains

The registry behind the tool is grounded in RFC 9110's status catalogue plus the registered extensions (RFC 6585's 428/429/431/511, RFC 7725's 451, RFC 8297's 103). The notes carry the distinctions this site's [companion article](/learn/http-status-codes-the-five-families) teaches: which redirects preserve the method (307/308) and which historically did not (301/302), why 304 is a cache handshake rather than a redirect, why 401 must arrive with `WWW-Authenticate` while 403 refuses regardless, and the incident-triage reading of the proxy trio - 502 blames the backend conversation, 503 the service's capacity, 504 the clock.

## The fallback rule, as a feature

Paste a valid code the registry has never met - a `599` from some middlebox - and the tool does not error. It answers with the protocol's own forward-compatibility rule: a client that does not recognise a code must treat it as the `x00` of its family, so the first digit alone defines the required behaviour. That rule is why the status registry could grow for thirty years without breaking a single old client, and the tool considers it an answer worth rendering, not a gap worth apologizing for.

## Input grammar

Tokens separated by spaces, commas, or newlines. Each token is either three digits in 100-599 or a family in the form `1xx` through `5xx`. Duplicates deduplicate preserving order; twenty tokens per run is the cap. Everything runs locally in your browser.

## Share results

At the top of the reading, above the cards, **Share results** builds a link to this page, only when you press it, that carries the box as typed after the `#`, and nothing else: status codes and families, which say nothing about you. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. The HTTP message decoder's links that hand a status code to this page use the same `#input=` and fill the box the same way.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the text is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The text fills the box as typing would and the page explains it; nothing is sent anywhere. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Sources

- RFC 9110: HTTP Semantics - the core catalogue, family rules, and the x00 fallback
- RFC 6585: Additional HTTP Status Codes - 428, 429, 431, 511
- RFC 7725: 451 Unavailable For Legal Reasons
- RFC 8297: 103 Early Hints
- RFC 3986: URI Generic Syntax - section 3.5, the fragment, which a Share results link uses (read 2026-11-01)

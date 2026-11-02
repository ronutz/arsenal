## What this tool does

Paste a `location`, its `proxy_pass`, and a request URI. The tool computes what the backend actually receives, and shows the **same configuration with the trailing slash flipped**, so the difference is visible rather than described.

## The rule

`proxy_pass http://backend;` has **no URI part**, so the original request URI is passed through unchanged, location prefix and all. `proxy_pass http://backend/;` **has** a URI part, and even that single slash counts, so the part of the request matching the location prefix is **replaced** by it.

With `location /app/` and a request for `/app/page`: the first form sends `/app/page`, the second sends `/page`, and `proxy_pass http://backend/v2/;` sends `/v2/page`.

Which you want depends on the backend. An application mounted at the same path needs the prefix kept; one that does not know it sits behind a prefix needs it stripped. Choosing wrong produces a 404 from the backend for a request the proxy handled perfectly.

## The doubled slash is real

A location without a trailing slash plus a URI part sends a genuinely doubled slash upstream: `location /app` with `proxy_pass http://backend/` turns `/app/page` into `//page`. This tool reproduces that rather than tidying it, because a prettier answer than NGINX gives would hide the exact defect you came here to find.

## What it refuses

Regular-expression and named locations may not carry a URI part: there is no literal prefix to replace, so NGINX rejects the configuration at startup. The tool reports that rather than inventing a result.

## The variable exception

A variable anywhere in the value suspends the prefix substitution entirely, and moves upstream resolution to request time, which usually requires a `resolver` and turns a name failure into a runtime error rather than one `nginx -t` would catch.

## Honest limits

No `rewrite`, `try_files` or internal redirects: this answers what path the backend receives, not what the whole request does. Upstream blocks are not resolved to servers, and query strings pass through unmodelled.

## Share results

Under the result, **Share results** builds a link to this page, only when you press it, that carries the box as typed after the `#`, once the page has a result. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. The proxy_pass value names a backend, a host name or an address that is usually internal, and the page shows it back in the flipped counterpart, so nothing is cut out: the popover asks you to check it. Before a link is offered, the box is searched for a credential a standard defines: a PEM private key, an `Authorization` or `Proxy-Authorization` line with any scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"), a `Cookie` or `Set-Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4: servers "commonly store a nonce (or "session identifier") in a cookie"), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret (a JSON member `token`, a `token=` in a query) does not block the link; the popover names the first one so you can check it.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The box fills as a paste would, and the page computes the path (the upstream is never resolved or contacted). The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

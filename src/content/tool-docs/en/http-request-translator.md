## What it does

Paste a raw HTTP/1.1 request, the kind a capture, a proxy log or an RFC example gives you, and the tool turns it into the equivalent `curl` command, browser `fetch` call, HTTPie invocation, Python `requests` snippet and PowerShell one-liner. Everything is parsed in your browser; nothing is ever sent, and no request is run.

## The inverse of the curl explainer

The [curl command explainer](/tools/curl-command-explainer) goes one way: a command in, a raw request among its outputs. This tool goes the other: a raw request in, a runnable command out. The two exist because the directions are needed at different moments. A capture hands you a message; a terminal wants a command; a bug report wants both.

## How the URL is assembled

An ordinary request line carries only a path, as in `GET /users HTTP/1.1`, because the connection already knows the host. To produce something you can run anywhere, the tool joins that target to the `Host` header. Absolute-form targets, which proxies use, are already complete and are taken as they are. If `Host` is missing on an origin-form request the tool says so, because the URL would otherwise be a guess.

## Headers it deliberately drops

`Host`, `Content-Length` and `Connection` are not re-emitted. Every client sets them itself, and passing them through causes duplicated headers or, worse, a declared length that no longer matches the body the client will actually send.

## What it warns about

- **A `Content-Length` that disagrees with the body.** Servers and proxies may then disagree about where the message ends, which is the raw material of request smuggling.
- **A chunked body.** It is passed through as pasted rather than decoded; decoding transfer encodings is the job of a message decoder, not a translator.
- **Cleartext `http`.** Headers and body travel readable.
- **An `Authorization` header or a `Cookie`.** A captured request is usually a live credential, and this is the warning that matters most in practice: the paste you are about to put in a ticket may be a working session.

## Using it

Paste the request, read the parsed request line and headers, then copy whichever form you need. The conversion is deterministic and local, so the same request always produces the same output.

## Share results

Under the request line and its warnings, **Share results** builds a link to this page, only when you press it, that carries the request after the `#` with every credential masked, never as typed: a captured request routinely carries an Authorization header or a session cookie, and this page shows every header value in clear and in five translations. Its popover says first what the link carries and how many values were masked, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

What is masked:

- **Header fields**, by name: `Authorization` and `Proxy-Authorization` keep their scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"); Basic keeps its user-id and loses the password ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), section 2); a JWT keeps its protected header and loses the claims and the signature ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1); every `Cookie` value goes ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1); a field named like a secret (`X-API-Key`) goes whole; a token inside any other value (a `Referer` with a code) goes. Each becomes `REDACTED`.
- **The request target**: a `user:password@` password ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1) and the secret query parameters become `REDACTED`.
- **The body**: JSON members and form parameters named like a secret (`access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sections 2.2 and 2.3), `refresh_token`, `client_secret`, `password` and `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sections 2.3.1, 4.1.2, 4.3.2 and 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), section 4.5), and any name ending in token, secret, password or api key) are filled with `*` for each of its octets, so the body keeps its length: a `Content-Length` that matched still matches.

The tool's share vectors check that the page that opens the link reads the same request (the same warnings, fields and body length). If a key or token is left where no name marks it (a JWT pasted as a plain-text body), there is no link: the popover names its line.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the copy is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page translates it; nothing is sent. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

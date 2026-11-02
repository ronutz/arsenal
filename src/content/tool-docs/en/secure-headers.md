## What it does

Paste a raw HTTP response and the tool grades its security posture: the security headers it sets (and the ones it is missing), the flags on its cookies, and its cross-origin policy. Each finding is checked against the relevant standard and the OWASP Secure Headers recommendations, and the result is a graded breakdown you can act on. It runs entirely in your browser.

## The headers it checks

Modern browser security is largely opt-in through response headers, and the tool looks at the ones that matter:

- **Strict-Transport-Security** (HSTS, RFC 6797) tells the browser to use HTTPS only; the tool reads its `max-age` and `includeSubDomains`.
- **Content-Security-Policy** (CSP Level 3) restricts where scripts, styles, and frames may come from, and is the strongest defense against cross-site scripting; the tool notes weakening keywords like `unsafe-inline`.
- **X-Content-Type-Options: nosniff** stops the browser from guessing content types, and **X-Frame-Options** (or CSP `frame-ancestors`) defends against clickjacking.
- **Referrer-Policy** and **Permissions-Policy** control what the page leaks in the Referer header and which browser features it may use.
- The **cross-origin policies** (COOP, COEP, CORP) that govern isolation between origins.

## Cookies and their flags

A cookie's security lives in its attributes, and the tool checks them against the current cookie specification (RFC 6265bis): **Secure** (sent only over HTTPS), **HttpOnly** (hidden from JavaScript, which blunts theft via cross-site scripting), and **SameSite** (which limits cross-site sending and mitigates CSRF). It also recognises the `__Host-` and `__Secure-` name prefixes, which enforce some of those properties by name.

## Reading the grade

The point of the grade is prioritization: it tells you not just what is present but what is missing or weak, and why each header matters, so you can fix the highest-impact gaps first. The checks follow OWASP's recommended set and the underlying specifications rather than one tool's opinion.

## Using it

Paste an HTTP response, including its headers, and read the graded analysis of headers, cookies, and cross-origin policy. The analysis is deterministic and local, so it is safe to run on a response captured from any site.

## Share results

Under the grade, **Share results** builds a link to this page, only when you press it, that carries a copy of the response after the `#`; it carries the response as pasted only if you tick the switch described below. A pasted response carries cookies, whose values are commonly session identifiers ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4, read 2026-11-01), and headers this page never reads, such as a `Location` with an authorization code in its query ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), section 4.1.2, read 2026-11-01). The page grades the security headers it knows and each cookie's name and attributes, never a cookie's value. So the copy keeps the status line and every header line by name, the values of the headers the page grades as parsed, and each `Set-Cookie` with its name and attributes; each cookie's value, and the value of every other header, becomes `[redacted]`. Before the link is offered, the copy is graded again and must give the same report, and it goes through the site's check for credentials still in a graded value. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. The popover also says how many values were replaced. When it replaced any, a switch under its first line, **Include the redacted values in the link**, lets you send them after all: it is off every time the popover opens; ticked, the link carries the response as pasted, every value included, and the popover says so and warns that cookie values are often live sessions and other headers can hold tokens, so the link is for someone you would show the response to. The switch is not offered when a credential in a graded value has already stopped the link.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page grades it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

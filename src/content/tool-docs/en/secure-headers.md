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

A cookie's security lives in its attributes, and the tool checks them against the current cookie specification (RFC 6265bis): **Secure** (sent only over HTTPS), **HttpOnly** (hidden from JavaScript, which blunts theft via cross-site scripting), and **SameSite** (which limits cross-site sending and mitigates CSRF). It also recognizes the `__Host-` and `__Secure-` name prefixes, which enforce some of those properties by name.

## Reading the grade

The point of the grade is prioritization: it tells you not just what is present but what is missing or weak, and why each header matters, so you can fix the highest-impact gaps first. The checks follow OWASP's recommended set and the underlying specifications rather than one tool's opinion.

## Using it

Paste an HTTP response, including its headers, and read the graded analysis of headers, cookies, and cross-origin policy. The analysis is deterministic and local, so it is safe to run on a response captured from any site.

## What it does

Reads a Content-Security-Policy the way Content Security Policy Level 3 reads it and grades what it found. The paste may be a header value, a whole `Content-Security-Policy:` or `Content-Security-Policy-Report-Only:` header line, a `<meta http-equiv="Content-Security-Policy">` element, or several of these; a header's comma-separated members are separate policies, each evaluated on its own.

For each policy: every directive, named and classified (CSP3, deprecated, extension, obsolete, unknown) with a one-line explanation of what it governs; every source expression read against the grammar (keyword, nonce, hash, scheme, host with scheme, port, path and wildcards) and explained; the effective policy per destination through the fallback list; the script picture (inline allowed, nonce-or-hash only, or blocked; eval; WebAssembly; 'strict-dynamic'); and the findings, graded high, medium, low, note and good, each quoting the specification's sentence. The grade is one of strict (the policy meets the specification's own Strict CSP of section 8.5), good, fair, weak, or none (nothing restricts script).

Decode and grade only, offline: nothing is fetched, no page is loaded. The hosted API runs the same code.

## How the policy is read

- 2.2.1: split on semicolons, strip, lower-case the name, split the value on whitespace; "If policy's directive set contains a directive whose name is directive name, continue": a duplicate directive is ignored (C1).
- 2.3.1: each token is a `scheme-source`, `host-source`, `keyword-source`, `nonce-source` or `hash-source`, or `'none'` alone. A keyword without quotes matches the host grammar and is read as a host (C7); a directive name inside a value means a missing semicolon (C6); a token outside every form matches nothing (C8).
- 6.8.3: the fallback list. script-src-elem → script-src → default-src; script-src-attr → script-src → default-src; style-src-elem and style-src-attr → style-src → default-src; worker-src → child-src → script-src → default-src; frame-src → child-src → default-src; connect-src, manifest-src, object-src, media-src, font-src, img-src → default-src; base-uri, form-action and frame-ancestors never fall back. "There is no inheritance" (6.1.3).
- 6.7.3.2: 'unsafe-inline' is overridden by any nonce or hash in the same list, and for script by 'strict-dynamic' (C14 says which case applies).
- 3.3 and 6.3.2: in a meta element, frame-ancestors, report-uri and sandbox are ignored; in Report-Only, sandbox is ignored (C5, C26).

## The findings

C1 duplicate directive; C2 unknown directive; C3 obsolete directive (block-all-mixed-content per Mixed Content 6.1; plugin-types, referrer, reflected-xss, disown-opener, navigate-to, prefetch-src, require-sri-for absent from CSP3); C4 report-uri deprecated (6.5.1); C5 directive ignored for this delivery; C6 missing semicolon; C7 keyword without quotes; C8 not a source expression; C9 'none' beside other expressions; C10 empty source list; C11 a value the directive does not take (webrtc, upgrade-insecure-requests, require-trusted-types-for, sandbox tokens); C12 outside the frame-ancestors grammar; C13 nothing restricts script; C14 'unsafe-inline' (overridden or not; 'unsafe-hashes'; style); C15 'unsafe-eval', 'wasm-unsafe-eval', 'trusted-types-eval'; C16 'strict-dynamic' without a nonce or hash (8.2); C17 wildcard or bare scheme for script (6.7.2.8); C18 a host allowlist for script (8.2, 8.5); C19 'self' for script; C20 object-src missing, open, allowlist or 'none' (6.1.9); C21 base-uri missing, open or pinned (8.5); C22 frame-ancestors missing or present (6.4.2); C23 a nonce under 128 bits (7.1); C24 insecure schemes (6.7.2.9) and IP addresses (6.7.2.10); C25 reporting; C26 Report-Only.

Strict CSP (8.5), the grade "strict": "script-src: Only use nonce source-expression and/or hash source-expression with the 'strict-dynamic' keyword-source. ... base-uri: Specify a value of either 'self' or 'none'." The evaluator also requires no 'unsafe-eval' and object-src 'none', as the specification's examples have.

## Share results

First in the reading, **Share results** builds a link to this page, only when you press it, that carries the box as pasted after the `#`, once the page has read at least one policy. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. A policy can name internal hosts and report endpoints, and CSP Level 3 ([section 7.1](https://www.w3.org/TR/CSP3/#security-nonces), read 2026-11-01) has the server "generate a unique value each time it transmits a policy", so a nonce in a shared policy should be one already spent: the popover asks you to check it. The page reads every line of the box as a policy, so a whole response pasted here would travel with its other headers. Before a link is offered, the text is searched for a credential a standard defines: a PEM private key, an `Authorization` or `Proxy-Authorization` line with any scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"), a `Cookie` or `Set-Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1, 4.2.1 and 8.4, where a cookie commonly holds a session identifier), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret (a JSON member `token`, a `password=` in a URL's query) does not block the link; the popover names the first one so you can check it.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The box fills as a paste would (no preset is marked) and the page reads it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Limits

- The page reads the policy's text, not the page it protects: it cannot know which inline scripts exist, whether a nonce changes per response, or whether an allowed host serves JSONP or user content. The host-allowlist findings describe the class.
- Several policies are evaluated one by one; when several are enforced together, a load must pass all of them (8.1).
- The set of checks follows Google's csp-evaluator; the wording and the thresholds come from the specification. Inputs over 20,000 characters are refused.

## Sources

- [Content Security Policy Level 3, W3C Working Draft 16 September 2026](https://www.w3.org/TR/CSP3/) (read 2026-10-05)
- [Mixed Content, W3C Candidate Recommendation Draft 23 February 2023](https://www.w3.org/TR/mixed-content/#strict-checking) (read 2026-10-05)
- [Upgrade Insecure Requests, W3C Candidate Recommendation 8 October 2015](https://www.w3.org/TR/upgrade-insecure-requests/) (read 2026-10-05)
- [Trusted Types, W3C Working Draft 23 June 2026](https://www.w3.org/TR/trusted-types/) (read 2026-10-05)
- [Google csp-evaluator](https://github.com/google/csp-evaluator) (read 2026-10-05)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, January 2005](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-11-01): section 3.5, the fragment, and 3.2.1, the userinfo
- [RFC 6265, HTTP State Management Mechanism, April 2011](https://www.rfc-editor.org/rfc/rfc6265) (read 2026-11-01): sections 4.1.1, 4.2.1 and 8.4
- [RFC 9110, HTTP Semantics, June 2022](https://www.rfc-editor.org/rfc/rfc9110) (read 2026-11-01): sections 11.6.2 and 11.7.2

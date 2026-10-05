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

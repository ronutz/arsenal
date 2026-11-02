## What it does

Work with the two values at the heart of OAuth 2.0's PKCE extension. The tool generates a random `code_verifier` and derives its `code_challenge` using the S256 method, or takes a `code_verifier` you paste and checks it against the length and character rules of RFC 7636, deriving the same challenge your authorization server will expect. The derivation is the exact SHA-256 and Base64url step defined by the standard, and it all runs in your browser.

## What PKCE protects against

The OAuth 2.0 authorization-code flow sends a short-lived code back through the user's browser, and on a mobile or single-page app that redirect can be intercepted by another application. PKCE, "Proof Key for Code Exchange", closes that hole. At the start of the flow the client invents a secret, the `code_verifier`, and sends only a transformed version of it, the `code_challenge`, with the initial request. When it later exchanges the code for tokens, it presents the original `code_verifier`, and the server re-derives the challenge and checks that it matches. An attacker who steals the code cannot use it, because they never saw the verifier.

## The verifier and the challenge

- The **code_verifier** is a high-entropy random string of 43 to 128 characters, drawn from the unreserved set `A-Z a-z 0-9 - . _ ~`.
- The **code_challenge** is derived from it. The recommended method, `S256`, is `BASE64URL(SHA256(ASCII(verifier)))`, the Base64url encoding of the verifier's SHA-256 digest with no padding. The `plain` method, where the challenge simply equals the verifier, exists for constrained clients but is discouraged, because it offers no protection if the challenge is observed.

## Why it matters now

PKCE began as a fix for mobile apps but is now the baseline. The current OAuth security best practice, RFC 9700, requires PKCE for every client using the authorization-code flow, not just public ones. If you are building or debugging an OAuth client, generating a verifier and confirming its S256 challenge here lets you check your implementation against the specification directly.

## Using it

Generate a fresh `code_verifier` and read its `S256` `code_challenge`, or paste an existing verifier to validate its length and characters and derive the matching challenge. Because S256 is a one-way hash, the challenge reveals nothing about the verifier.

## Share results

Under the validity badges, **Share results** offers a link to this page only for one verifier: the example [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636) prints in Appendix B (`dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`, the page's Example), which it carries after the `#`. For any other verifier the popover says there is no link, and why.

A code_verifier is the secret of the flow. RFC 7636 (read 2026-11-01) introduces it as a "cryptographically random key" that defeats an intercepted authorization code "since the attacker would not know this one-time key" (section 1), and rests the protocol's security on the verifier not being "learned or guessed by the attacker" (section 7.1). Nothing derived can stand in for it, because this page computes everything from the verifier itself: the challenge without the verifier would leave nothing to show. So a link carries the verifier only when it is the standard's own test value.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the value is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The example fills the box and the page derives both challenges, with Web Crypto in the browser. A link carrying any other value is ignored and never fills the box. Either way the value leaves the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

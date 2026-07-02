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

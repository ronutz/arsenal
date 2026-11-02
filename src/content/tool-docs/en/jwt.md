## What it does

Paste a JSON Web Token to read what is inside it and, for an HMAC-signed token, to check that its signature is valid. The tool splits the token into its three parts, decodes the header and the claims, translates the timing claims into plain dates, and, if you supply the secret, verifies an HS256, HS384, or HS512 signature. Everything runs in your browser; a pasted secret never leaves it.

## The shape of a JWT

A JWT in its usual compact form is three Base64url segments joined by dots: `header.payload.signature`. The **header** names the signing algorithm (`alg`) and often a key id (`kid`); the **payload** carries the claims, a JSON object of statements about the subject; and the **signature** is computed over the first two segments so that any tampering with them can be detected. The registered claims include the issuer (`iss`), subject (`sub`), audience (`aud`), and the timing fields `iat`, `nbf`, and `exp`, which are numeric seconds since the Unix epoch and which the tool renders as readable dates.

## Decoding is not verifying

This is the single most important thing to understand about a JWT: the header and payload are only Base64url-encoded, not encrypted. Anyone who has the token can read them, so a JWT is not a place to put secrets. Decoding tells you what a token claims; it does not tell you whether those claims are true. Only verifying the signature against the right key proves the token was issued by who it says and has not been altered.

## Signature verification and the algorithm

HS256, HS384, and HS512 sign with an HMAC over a shared secret, the same construction the HMAC tool uses, so this verifier and that tool agree. Because the secret both signs and verifies, anyone who can verify an HS-signed token can also mint one; that is the symmetric trade-off, and it is why services that must let others verify without being able to forge use an asymmetric algorithm like RS256 or ES256 instead. A known family of attacks abuses the `alg` field, either setting it to `none` or tricking a server that holds an RSA public key into treating it as an HMAC secret; the best-current-practice guidance in RFC 8725 exists to close these, and the short version is to always check that the algorithm is the one you expect.

## Using it

Paste a token to decode its header and claims and read its timing in plain language. To verify an HMAC-signed token, paste the shared secret and the tool confirms whether the signature matches. Whether a token is expired right now is shown against your current clock, layered on top of the timing claims the decoder reads.

## Share results

Under the token's status badges, **Share results** builds a link to this page, only when you press it, that carries the token's header and claims after the `#`: the first two segments exactly as you pasted them, followed by an empty signature segment (`header.payload.`), and a mark saying the pasted token had a signature. It never carries the signature, the token as you pasted it, or the secret in the verification box. Its popover says first what the link carries, then a caution of its own: the claims can name a person and the services that trust the token, so read them before you send the link. Then it offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

Why not the token itself: a JWT is a bearer credential while it is valid. [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750) (section 1.2, read 2026-11-01) defines a bearer token as one that "any party in possession of the token (a "bearer") can use", and [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) (section 1, read 2026-11-01) carries a JWT's claims as the payload of a JWS. Without its signature the copy is not a token any verifier accepts: [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) (section 5.2, read 2026-11-01) says that when no signature validates, "the JWS MUST be considered invalid". Leaving the signature out also means the link gives nobody what they would need to test guesses of a weak HMAC secret offline. A header whose `jwk` member holds private key material (`d`, `p`, `q`, `dp`, `dq`, `qi`, `oth` or `k`; RFC 7515 section 4.1.3 has `jwk` carry the public key) gets no link, and the popover names the members.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the values are not sent to the server when the link is opened; they stay in the address bar and the history of whoever opens it, and anyone who has the link can read them.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box and the page decodes it as a paste: the same header, claims and times, with the expiry read against the reader's clock. Where the sender's token was signed, the signature panel says the signature was left out of the link, in place of the signature and the verification box. Only a value of the copy's shape that the page decodes is accepted; a whole token, or anything else, is ignored. Either way the values leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

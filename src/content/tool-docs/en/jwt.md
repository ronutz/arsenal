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

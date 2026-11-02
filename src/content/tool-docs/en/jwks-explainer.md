## What it does

Paste a JSON Web Key Set and the tool breaks it down key by key: for each key it reads the type, the key id, the intended use and algorithm, and the type-specific parameters, and it flags any key that contains private material. If you also paste a JWT, it matches the token to the key that should verify it by comparing key ids. Nothing leaves your browser.

## What a JWKS is

A JSON Web Key Set (JWKS) is the JSON document an identity provider publishes, usually at `/.well-known/jwks.json`, so that anyone can verify the tokens it signs without a shared secret. It is simply a list of keys:

    { "keys": [ {JWK}, {JWK}, ... ] }

Each entry is a JSON Web Key (JWK) describing one key: its type (`kty`, such as RSA, EC, or OKP), an optional key id (`kid`), what it is for (`use`, typically `sig` for signing or `enc` for encryption), the algorithm it goes with (`alg`), and the parameters specific to that key type.

## Public and private material

This distinction is the security point of the tool. A JWKS published for verification should contain only public keys. Each key type has public parameters and private ones: an RSA key publishes its modulus and exponent (`n`, `e`) and keeps its private exponent (`d`) secret; an elliptic-curve key publishes its coordinates (`x`, `y`) and keeps its private scalar (`d`); a symmetric key (`oct`) is nothing but the secret (`k`). If a key in the set carries any of the private fields, it means private key material has been exposed, which is a serious mistake, so the tool flags it explicitly.

## Matching a token to its key

A signed JWT usually names, in its header, the key id (`kid`) of the key that signed it. A verifier looks through the JWKS for the key with that `kid` and uses it. The tool does the same: given a JWT and a set, it finds the key whose `kid` matches the token's, which is exactly the lookup a real verifier performs before checking the signature. The key parameters follow RFC 7517 and RFC 7518, with the OKP key type for Edwards-curve keys (such as Ed25519) defined in RFC 8037.

## Using it

Paste a JWKS to inspect every key and catch any exposed private material, and optionally paste a JWT to see which key in the set is the one meant to verify it.

## Share results

Under the summary of the keys (in Match mode, under the match), **Share results** builds a link to this page, only when you press it, that carries a copy of the key set after the `#`: every private value replaced by `[redacted]`, every other character as you pasted it. Its popover says first what the link carries and how many values were replaced, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

A pasted key set may hold private key material, which a link must never carry. [RFC 7518](https://www.rfc-editor.org/rfc/rfc7518) (read 2026-11-01) defines an RSA private key's `d`, `p`, `q`, `dp`, `dq`, `qi` and `oth` members (section 6.3.2, with each `oth` entry's `r`, `d` and `t`), an elliptic-curve private key's `d` (section 6.2.2) and a symmetric key's `k` (section 6.4.1); [RFC 8037](https://www.rfc-editor.org/rfc/rfc8037) (section 2, read 2026-11-01) gives an OKP key a private `d`. The copy keeps the member names and replaces only their values, so the page that opens it flags the same private material and explains every key exactly as yours did: this page never shows those values. The site's checks pin it on the private keys of RFC 7517 Appendix A.2 and A.3 and RFC 8037 Appendix A.1, among others.

In Match mode the link also carries the JWT's header, and nothing else of the token: the page reads only the header, and a JWT is a bearer credential while it is valid ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), section 1.2, read 2026-11-01). A JWT box whose first segment is not a JSON header carries nothing, so an opaque access token never goes in its place; a header whose `jwk` member holds private key material gets no link.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the values are not sent to the server when the link is opened; they stay in the address bar and the history of whoever opens it, and anyone who has the link can read them.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the key set box, Match mode opens when the link says so and the header fills the JWT box; the page explains and matches as for a paste, and never fetches a `jwks_uri`. A key set that does not parse or still holds a private value, a mode the page does not offer, or a header that is more than a header, makes the whole link ignored. Either way the values leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

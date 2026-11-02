## What it does

Paste either an OpenID Connect ID token or a provider's `.well-known/openid-configuration` document, and the tool decodes it. For an ID token it reads the core identity claims, the standard profile claims, and the binding hashes, and runs a set of security checks. For a discovery document it lays out the provider's endpoints and capabilities. It detects which of the two you pasted automatically, and everything runs in your browser.

## OIDC in one paragraph

OpenID Connect is an identity layer built on top of OAuth 2.0. OAuth answers "what is this app allowed to do"; OIDC adds "and who is the user". It does that by having the provider issue an **ID token**, a signed JWT that asserts who signed in, alongside the OAuth access token. Because an ID token is a JWT, the tool decodes it through the same JWT core used elsewhere on the site, then interprets it with OIDC's specific meaning.

## The ID token and its checks

The core claims identify the token: `iss` (who issued it), `sub` (the stable user identifier), `aud` (the client it was issued for), and the timing claims. On top of these OIDC adds claims worth understanding: `nonce`, a value the client generates and the provider echoes back so a replayed token can be caught; `at_hash` and `c_hash`, which bind the ID token to the access token and the authorization code so they cannot be swapped; `amr`, the authentication methods used (values such as `pwd`, `otp`, or `mfa`, registered in RFC 8176); and standard profile claims like `name` and `email`. The tool's security checks look at exactly what a careful client would: that the required claims are present, that the signing algorithm is sound rather than `none` or weak, that a nonce is present, and that the audience is what you expect.

## The discovery document

The `.well-known/openid-configuration` document is how a provider advertises itself. It lists the endpoints a client needs (authorization, token, userinfo, and the `jwks_uri` where the signing keys live), the scopes and response types it supports, the algorithms it will sign ID tokens with, and the PKCE code-challenge methods it accepts. Reading it tells you at a glance what a provider supports and whether it advertises modern protections such as `S256` PKCE.

## Using it

Paste an ID token to decode its claims and see the security assessment, or paste a discovery document to read a provider's endpoints and capabilities. The decode is a pure read of what the token or document contains; it does not contact the provider.

## Share results

Under the badges and findings, **Share results** builds a link to this page, only when you press it. What it carries after the `#` depends on what you pasted, and its popover says which before anything is copied, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

- **An ID token.** The link carries its header and claims: the first two segments exactly as pasted, followed by an empty signature segment (`header.payload.`), and a mark saying the pasted token was signed. Never the signature, never the token as pasted. An ID token is a JWT the token endpoint returns beside a bearer access token ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), sections 2 and 3.1.3.3, read 2026-11-01), and without its signature the copy is not one any verifier accepts ([RFC 7515](https://www.rfc-editor.org/rfc/rfc7515), section 5.2, read 2026-11-01: when no signature validates, "the JWS MUST be considered invalid"). The popover adds a caution: the claims name a person, so read them before you send the link. A header whose `jwk` member holds private key material gets no link.
- **A discovery document.** The link carries it as typed: a provider must publish it at `/.well-known/openid-configuration` ([OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html), section 4, read 2026-11-01), so it is public. A paste that also holds a credential, as an application's own settings file often does, gets no link, and the popover names the member: `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), section 3.2.1), `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), section 3), `access_token` or `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), section 5.1), `id_token` (OpenID Connect Core 1.0, section 3.1.3.3), or a JWK with private members ([RFC 7518](https://www.rfc-editor.org/rfc/rfc7518), section 6), all read 2026-11-01. This page never shows those members, but a link of the paste would carry them; remove them and press again.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the values are not sent to the server when the link is opened; they stay in the address bar and the history of whoever opens it, and anyone who has the link can read them.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The value fills the box and the page decodes it as a paste: the same claims, times and findings for a token (its badge shows it signed when the sender's was, with a note that the signature stayed out of the link), the same endpoints and capabilities for a document. Nothing is fetched: the page never calls the `jwks_uri` or any endpoint. A whole token, a document holding a credential, or anything the page refuses is ignored. Either way the value leaves the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

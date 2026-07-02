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

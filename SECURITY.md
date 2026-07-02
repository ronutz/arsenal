# Security posture

This document records the security posture of the ronutz.com site and the one
accepted tradeoff in its Content-Security-Policy. Report issues per
`/.well-known/security.txt` (mailto:hello@ronutz.com).

## Architecture (why the attack surface is small)

The site is a **static export** (`next.config.mjs` → `output: "export"`), served
by a Cloudflare Worker. There is no application server, no database, and no
session state on the site itself. The in-browser tools compute locally and send
nothing to a server. The tools API (`/api/v1/*`) is a separate, stateless,
read-only, side-effect-free compute endpoint that logs no query or body.

## Response headers (set in `public/_headers`)

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy` (see below)
- `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera, microphone, geolocation, and FLoC
- `object-src 'none'`, `base-uri 'none'`, `form-action 'self'`,
  `upgrade-insecure-requests`

## Accepted tradeoff: `script-src 'unsafe-inline'`

The CSP `script-src` is `'self' 'unsafe-inline' 'wasm-unsafe-eval'`. The
`'unsafe-inline'` is a deliberate, documented exception, not an oversight.

**Why it is required.** Next.js App Router in static-export mode emits per-page
**inline hydration scripts** (`self.__next_f.push(...)`) directly into each
page's HTML. Strengthening the policy would require either:

- **Nonces** — infeasible. A nonce must be unique per response and injected by a
  server at request time. A static export has no server at request time, and a
  static `_headers` file cannot emit a per-request nonce.
- **Hashes** — impractical. The inline hydration script differs per page (each
  carries that page's flight data) and changes on every build, so it would mean
  generating and maintaining a distinct hash allow-list for thousands of pages,
  regenerated every deploy. `_headers` also applies one policy per path pattern,
  not per inline script.

**Why the residual risk is low.** The site is fully static with no
user-generated content, no reflected inputs, and no server-side templating of
untrusted data, so there is no injection vector for an attacker to place a script
that `'unsafe-inline'` would then permit. `'unsafe-inline'` weakens CSP's role as
a second line of defense against XSS, but the first line (no injection surface)
holds.

**Revisit if** the site gains a server rendering layer (which could mint nonces),
or any surface begins reflecting untrusted input into HTML. At that point move
`script-src` to nonces and drop `'unsafe-inline'`.

## `wasm-unsafe-eval`

Required by the Pagefind search WebAssembly module. Scoped to WASM compilation;
it does not permit `eval()` of arbitrary strings.

## Admin surface

The internal admin console is a static scaffold with no authentication (the site
has no backend). It is kept dark by default (rendered only under privileged
preview) and displays no real credentials, tokens, or unmasked contact
addresses. The real allow-list of authorized identities is a server-side concern
for the future service layer and is not shipped to the client in a usable form.

# Netskope steering decision explainer

Paste a compact description of a steering configuration and one flow, and walk the documented decision order to a verdict - **steered**, **bypassed**, **blocked**, or **direct** - with a ledger explaining every check along the way. This is a why-explainer, not a simulator: each step in the ledger cites documented behaviour, and where the public documentation publishes no rule, the ledger says so instead of inventing one.

## The grammar

Key-value lines, one decision input per line:

```
mode: web                     # cloud-apps | web | all
dynamic: on                   # optional; then mode-on-prem / mode-off-prem (none allowed)
location: off-prem            # on-prem | off-prem
tunnel: up                    # up | down
fail-close: off               # on | off
flow: web app.example.com     # web <host> | app <name> | non-web <proto/port> | rfc1918 <ip> | loopback
non-standard-port: ip         # optional; fqdn | ip - how a non-standard web port is reached
exception: domain *.example.com          # 0+ lines; kinds: cert-pinned, domain, category, dest-location, firewall-app
flow-matches: domain          # which configured exception kinds this flow matches (or none)
```

The `flow-matches` line is deliberate honesty: whether a real flow matches a category or a destination-location object depends on tenant data this local tool cannot see, so you declare the match and the engine explains the documented consequence.

## What the ledger knows

The three traffic modes and who each is for (Cloud Apps Only for Cloud Inline/CASB-only, Web Traffic for most organisations, All Traffic for Cloud Firewall subscribers). The always-on default bypass of RFC1918 space. The exception families and their documented behaviours - including the certificate-pinned family's per-profile **Steer and decrypt at Netskope Cloud** opt-in, the one match that steers instead of bypassing. Dynamic steering's per-location modes, including **None**: no tunnel, and exceptions not processed. **Fail Close**'s documented split: domain-based, IP-based, and cert-pinned exceptions are still applied while category-based exceptions are blocked. And the non-standard-port pitfall: an FQDN-configured port reached by IP address is treated as non-web, with the documented remedy of configuring both.

## Where it hands off

A **steered** verdict is where the next decision begins - whether the session is decrypted belongs to the TLS policy, and [the inline TLS decryption article](/learn/netskope-inline-tls-decryption) picks up exactly there. The steering landscape itself - Client, explicit proxy and PAC, tunnels, reverse proxy - is [the steering methods article](/learn/netskope-steering-methods); the PAC layer has [its own explainer](/tools/pac-file-explainer).

## Share results

Under the verdict, **Share results** builds a link to this page, only when you press it, that carries the spec as typed after the `#`, once the page has a decision. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. A flow and its exceptions name hosts, apps and domains, and Netskope's [steering profile](https://docs.netskope.com/en/configure-a-steering-profile) page (read 2026-11-01) has exceptions for traffic with "personal or private content": the popover asks you to check them. The ledger reads every line, so nothing is cut out. Before a link is offered, the spec is searched for a credential a standard defines: a PEM private key, an `Authorization` or `Proxy-Authorization` line with any scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"), a `Cookie` or `Set-Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4: servers "commonly store a nonce (or "session identifier") in a cookie"), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret (a JSON member `token`, a `token=` in a query) does not block the link; the popover names the first one so you can check it.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The spec fills the box as a paste would, and the page explains it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Sources

- Netskope docs: Configure a Steering Profile - modes, default bypasses
- Netskope docs: Creating a Steering Configuration - Fail Close, non-standard ports
- Netskope docs: Enabling Dynamic Steering - per-location modes, None semantics
- Netskope docs: Certificate Pinned Applications - steer-and-decrypt

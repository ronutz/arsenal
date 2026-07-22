# Netskope steering decision explainer

Paste a compact description of a steering configuration and one flow, and walk the documented decision order to a verdict - **steered**, **bypassed**, **blocked**, or **direct** - with a ledger explaining every check along the way. This is a why-explainer, not a simulator: each step in the ledger cites documented behavior, and where the public documentation publishes no rule, the ledger says so instead of inventing one.

## The grammar

Key–value lines, one decision input per line:

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

The three traffic modes and who each is for (Cloud Apps Only for Cloud Inline/CASB-only, Web Traffic for most organizations, All Traffic for Cloud Firewall subscribers). The always-on default bypass of RFC1918 space. The exception families and their documented behaviors - including the certificate-pinned family's per-profile **Steer and decrypt at Netskope Cloud** opt-in, the one match that steers instead of bypassing. Dynamic steering's per-location modes, including **None**: no tunnel, and exceptions not processed. **Fail Close**'s documented split: domain-based, IP-based, and cert-pinned exceptions are still applied while category-based exceptions are blocked. And the non-standard-port pitfall: an FQDN-configured port reached by IP address is treated as non-web, with the documented remedy of configuring both.

## Where it hands off

A **steered** verdict is where the next decision begins - whether the session is decrypted belongs to the TLS policy, and [the inline TLS decryption article](/learn/netskope-inline-tls-decryption) picks up exactly there. The steering landscape itself - Client, explicit proxy and PAC, tunnels, reverse proxy - is [the steering methods article](/learn/netskope-steering-methods); the PAC layer has [its own explainer](/tools/pac-file-explainer).

## Sources

- Netskope docs: Configure a Steering Profile - modes, default bypasses
- Netskope docs: Creating a Steering Configuration - Fail Close, non-standard ports
- Netskope docs: Enabling Dynamic Steering - per-location modes, None semantics
- Netskope docs: Certificate Pinned Applications - steer-and-decrypt

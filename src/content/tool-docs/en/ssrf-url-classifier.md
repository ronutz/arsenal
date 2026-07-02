## What it does

Paste a URL and the tool tells you where it actually points: loopback, a private or link-local range, a cloud metadata endpoint, CGNAT shared space, other reserved space, or the public internet. It decodes the IP-obfuscation tricks used to disguise an internal address, flags dangerous URL schemes and embedded credentials, and shows an SSRF risk level. It never resolves DNS and never sends the request; it is a classifier, not a probe.

## What SSRF is, and why classification matters

Server-Side Request Forgery is an attack where a server is tricked into making a request to a URL the attacker chose, typically to reach something the attacker cannot reach directly: a service on `localhost`, a machine in an internal range, or a cloud provider's metadata endpoint. Defending against it comes down to deciding whether a URL is safe to fetch, and that decision is harder than it looks, because an internal address can be written in many disguised forms. This tool is built for that decision: it exists to help you understand a URL and design an allow-list, firmly on the defensive side of the line.

## The obfuscations it decodes

A naive filter that blocks `127.0.0.1` misses the many other ways to write the same address, and attackers exploit exactly that. The tool decodes them so the real destination is visible:

- **Decimal** integer form, where `2130706433` is `127.0.0.1`;
- **Octal** and **hex** octet forms;
- **Short-form** IPv4, where `127.1` expands to `127.0.0.1`; and
- **IPv4-mapped IPv6**, where an IPv4 address hides inside an IPv6 one.

It then classifies the resolved literal against the reserved ranges (RFC 1918 private, RFC 3927 link-local, RFC 6598 CGNAT, and the rest) and calls out the cloud metadata address, which is a prime SSRF target.

## Schemes, credentials, and the honest unknown

Beyond the address, the tool flags dangerous URL schemes (the ones beyond `http` and `https` that SSRF payloads often abuse) and embedded credentials in the `user:pass@host` form. One thing it is careful to be honest about: a bare hostname that is not a known special name is reported as resolving at runtime, not guessed at, because the tool never performs DNS resolution. That is the truthful answer, and it is also why the tool is safe: it classifies what the URL says rather than reaching out.

## Using it

Paste a URL and read its classification, the decoded destination, any flagged schemes or credentials, and the SSRF risk level. Everything is computed locally; no request is ever made.

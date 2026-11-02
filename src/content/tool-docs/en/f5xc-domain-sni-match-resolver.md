## What it does

This tool answers a precise F5 Distributed Cloud (XC) question: given several HTTP load balancers and their domain lists, which one serves a particular hostname? Paste the load balancers as a JSON array and a test hostname, and the resolver names the winning load balancer and domain entry, shows why, and flags the configuration hazards that make domain matching go wrong. It runs entirely in your browser.

## How XC picks a load balancer

When a request arrives, XC has already narrowed things to the load balancers that share the destination IP and port (the advertise policy). Among those, it picks the most specific domain match. An exact FQDN - app.example.com listed literally - beats a wildcard like *.example.com. The hostname it matches on comes from the SNI value when the client uses HTTPS, or the Host header when the client uses plain HTTP. If nothing matches and one load balancer is marked as the Default for that advertise policy, the Default catches the request; if there is no Default, the hostname is not picked up at all.

## Wildcards and the apex

A wildcard domain is a suffix match: *.example.com covers foo.example.com, but it does not cover the apex example.com, and a wildcard TLS certificate only covers a single label. That is why serving both www.example.com (or any subdomain) and the bare example.com needs the apex added as its own domain. The tool makes the wildcard-versus-apex distinction explicit in every result.

## The hazards it flags

Domain matching breaks in a few recognisable ways, and the tool warns about each. Configuring both a wildcard (*.example.com) and its apex (example.com) on different load balancers that use automatic certificates is something F5 specifically advises against. Two load balancers claiming the same exact domain, or two marked as Default on the same advertise policy (only one is allowed), are conflicts. A hostname that matches two entries with equal specificity is ambiguous. And a multi-label hostname that matches a wildcard will route but may fail certificate validation, since the wildcard cert covers only one label.

## Share results

Under the resolution, **Share results** builds a link to this page, only when you press it, that carries the load balancer list as pasted and the host name after the `#`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. Load balancer names and domains can be an organisation's internal hosts: the popover asks you to check them. The resolution reads every name and domain, so nothing is cut out. Before a link is offered, each field is searched for a credential a standard defines: a PEM private key, an `Authorization` or `Proxy-Authorization` line with any scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"), a `Cookie` or `Set-Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4: servers "commonly store a nonce (or "session identifier") in a cookie"), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value, and two things F5 Distributed Cloud's own schema defines: a SecretType secret, a `clear_secret_info` URL or a `blindfold_secret_info` location (the [XC API reference](https://docs.cloud.f5.com/docs-v2/api/views-http-loadbalancer): "SecretType is used in an object to indicate a sensitive/confidential field"), and an `Authorization` header matcher with a literal value; all read 2026-11-01. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret (a JSON member `token`, a `token=` in a query, an `X-Api-Key` or cookie matcher) does not block the link; the popover names the first one so you can check it.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** Both fields fill as if typed, and the page resolves. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

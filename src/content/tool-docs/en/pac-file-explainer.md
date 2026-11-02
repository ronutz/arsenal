## What it does

Paste a Proxy Auto-Config (PAC) file and this reads it back without ever running it: the proxy directives it can return, the PAC helper functions it uses, a set of structural and correctness checks, and whether it looks like a Netskope Cloud Explicit Proxy steering file. A PAC file is the small JavaScript function, `FindProxyForURL(url, host)`, that a browser or forwarding client calls for every request to decide whether to go direct or through a proxy. This tool explains that decision logic. It runs entirely in your browser and is grounded in the MDN PAC reference and Netskope's Explicit Proxy documentation.

## It never runs the file

This is the important safety property. The tool does not evaluate the PAC JavaScript. It reads the text lexically: it walks the source character by character to balance braces and parentheses (ignoring anything inside strings and comments), collects the string literals to find proxy directives, and counts the helper-function names that are called. It never calls `eval`, never executes `FindProxyForURL`, never opens a socket, and never fetches anything.

## The proxy directives

Every return string in a PAC file is one or more directives separated by semicolons, tried left to right as failover. The tool extracts each return string and explains its parts: `DIRECT` (connect straight to the destination, no proxy), `PROXY host:port` (use that HTTP proxy), `SOCKS host:port` (use that SOCKS server), and the newer `HTTP`, `HTTPS`, `SOCKS4`, and `SOCKS5` keywords for a specific proxy type. A string like `PROXY p1:8080; PROXY p2:8080; DIRECT` is flagged as a failover chain, and a part that is not one of the valid keywords (a common typo) is called out.

## The helper functions

PAC files decide using a fixed set of helper functions, and the tool explains each one it finds and, crucially, flags the three that force a DNS lookup: `isInNet`, `isResolvable`, and `dnsResolve`. These consult the DNS server and can block, so MDN recommends putting cheaper string checks such as `isPlainHostName` and `dnsDomainIs` first, and only reaching the DNS-consulting helpers when nothing else has decided. The tool also notes the sharp edges the documentation calls out: `shExpMatch` uses shell-glob wildcards (`*` and `?`), not regular expressions; `myIpAddress` can be unreliable on multi-homed machines and may fall back to a loopback address; and modern Chromium-based browsers strip the path and query from `https://` URLs before calling the PAC, so matching on the path of an HTTPS URL may not work.

## Netskope recognition

When the file points traffic at a `goskope.com` explicit-proxy host (typically `eproxy-<tenant>.goskope.com` on port 8081), the tool recognises it as a Netskope Cloud Explicit Proxy steering file and explains the pattern: plain hostnames and identity-provider hosts are returned `DIRECT` so they bypass the proxy, Netskope uses cookie surrogates for user identity, the tenant placeholder must be replaced with your real tenant, and the Netskope root CA must be trusted on the client for TLS inspection to work.

## Scope and grounding

This parses and explains; it never evaluates the file, opens a socket, or fetches anything, and the same input always produces the same output. It is a structural and lexical reader, not a full JavaScript parser or a PAC test harness: it will not tell you which proxy a specific URL resolves to (that would require running the function). Every fact comes from the MDN Proxy Auto-Configuration reference, the Wikipedia proxy auto-config article for the Microsoft IPv6 helper extensions, and Netskope's Cloud Explicit Proxy documentation. Nothing you paste leaves the page.

## Share results

First in the reading, **Share results** builds a link to this page, only when you press it, that carries the file as pasted after the `#`, once the page reads a file (the reference shown for an empty box is not a result). Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. A PAC file names internal hosts, and a Netskope one names your tenant: Netskope's [Cloud Explicit Proxy](https://docs.netskope.com/en/explicit-proxy/) page (read 2026-11-01) has the file return `PROXY eproxy-<Tenant Name>:8081`. The popover asks you to check them. The page reads every directive and helper call, so nothing is cut out. Before a link is offered, the file is searched for a credential a standard defines: a PEM private key, an `Authorization` or `Proxy-Authorization` line with any scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"), a `Cookie` or `Set-Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4: servers "commonly store a nonce (or "session identifier") in a cookie"), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret (a JSON member `token`, a `token=` in a query) does not block the link; the popover names the first one so you can check it.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The file fills the box as a paste would, and the page reads it (never runs it). The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

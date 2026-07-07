## What it does

Paste a Proxy Auto-Config (PAC) file and this reads it back without ever running it: the proxy directives it can return, the PAC helper functions it uses, a set of structural and correctness checks, and whether it looks like a Netskope Cloud Explicit Proxy steering file. A PAC file is the small JavaScript function, `FindProxyForURL(url, host)`, that a browser or forwarding client calls for every request to decide whether to go direct or through a proxy. This tool explains that decision logic. It runs entirely in your browser and is grounded in the MDN PAC reference and Netskope's Explicit Proxy documentation.

## It never runs the file

This is the important safety property. The tool does not evaluate the PAC JavaScript. It reads the text lexically: it walks the source character by character to balance braces and parentheses (ignoring anything inside strings and comments), collects the string literals to find proxy directives, and counts the helper-function names that are called. It never calls `eval`, never executes `FindProxyForURL`, never opens a socket, and never fetches anything.

## The proxy directives

Every return string in a PAC file is one or more directives separated by semicolons, tried left to right as failover. The tool extracts each return string and explains its parts: `DIRECT` (connect straight to the destination, no proxy), `PROXY host:port` (use that HTTP proxy), `SOCKS host:port` (use that SOCKS server), and the newer `HTTP`, `HTTPS`, `SOCKS4`, and `SOCKS5` keywords for a specific proxy type. A string like `PROXY p1:8080; PROXY p2:8080; DIRECT` is flagged as a failover chain, and a part that is not one of the valid keywords (a common typo) is called out.

## The helper functions

PAC files decide using a fixed set of helper functions, and the tool explains each one it finds and, crucially, flags the three that force a DNS lookup: `isInNet`, `isResolvable`, and `dnsResolve`. These consult the DNS server and can block, so MDN recommends putting cheaper string checks such as `isPlainHostName` and `dnsDomainIs` first, and only reaching the DNS-consulting helpers when nothing else has decided. The tool also notes the sharp edges the documentation calls out: `shExpMatch` uses shell-glob wildcards (`*` and `?`), not regular expressions; `myIpAddress` can be unreliable on multi-homed machines and may fall back to a loopback address; and modern Chromium-based browsers strip the path and query from `https://` URLs before calling the PAC, so matching on the path of an HTTPS URL may not work.

## Netskope recognition

When the file points traffic at a `goskope.com` explicit-proxy host (typically `eproxy-<tenant>.goskope.com` on port 8081), the tool recognizes it as a Netskope Cloud Explicit Proxy steering file and explains the pattern: plain hostnames and identity-provider hosts are returned `DIRECT` so they bypass the proxy, Netskope uses cookie surrogates for user identity, the tenant placeholder must be replaced with your real tenant, and the Netskope root CA must be trusted on the client for TLS inspection to work.

## Scope and grounding

This parses and explains; it never evaluates the file, opens a socket, or fetches anything, and the same input always produces the same output. It is a structural and lexical reader, not a full JavaScript parser or a PAC test harness: it will not tell you which proxy a specific URL resolves to (that would require running the function). Every fact comes from the MDN Proxy Auto-Configuration reference, the Wikipedia proxy auto-config article for the Microsoft IPv6 helper extensions, and Netskope's Cloud Explicit Proxy documentation. Nothing you paste leaves the page.

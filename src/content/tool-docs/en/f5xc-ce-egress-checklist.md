## What it does

This tool turns F5's published Customer Edge (CE) firewall reference into a working allowlist. You paste the contents of F5's downloadable IP-addresses-and-domains file (F5 publishes it for exactly this kind of automation), pick your site type, and the tool parses it into a purpose-organized, deduplicated allowlist - registration and updates, Regional Edge connectivity, F5 domains, reputation and classification feeds, container registries, DNS, and NTP - filtered to the site type you chose. It also gives you the port and protocol matrix, optional site-to-site rules, a flat firewall-request text you can hand to a network team, and a CE-side verification script. Everything runs in your browser.

## Why it parses instead of listing

The one real risk with any firewall allowlist is staleness - IP ranges and domains change, and a hardcoded list rots the moment F5 updates it. F5 itself warns that the IP addresses can change without notice and that domain-based permissions are the preferred method. So this tool never ships its own copy of the list. It parses the file you paste, and it always shows a provenance line stating exactly what it read. When F5 updates the file, you paste the new one and the output updates with it.

## Secure Mesh v2 vs Legacy

F5 splits the requirements into two site generations. The Secure Mesh Site v2 workflow uses a single F5-owned wildcard domain (or an FQDN list if your firewall does not support wildcards) and a small registration IP set. Legacy CE sites use a large IP range list and a broader domain set that includes third-party registries. The site-type selector filters the parsed entries to the generation you are deploying, so you do not allowlist ranges you do not need. Entries that apply to both (DNS, NTP, and the shared SaaS ranges) are always included.

## The port matrix and site-to-site rules

The port and protocol matrix is transcribed from the reference: registration and updates on TCP 443, Regional Edge connectivity on TCP 80 and 443 with optional IPsec on UDP 4500 (SSL tunneling is supported as a fallback) and the RE's NTP on UDP 123, F5-provided DNS on TCP/UDP 53, and F5-provided NTP on UDP 123. Port 65500 is reserved for local UI and API access and is not an egress rule. The optional rule blocks cover multi-node clusters, Site Mesh Group (IPsec: UDP 500, UDP 4500, and ESP), DC Cluster Group (IP-in-IP on UDP 6080), and AWS Cloud Connect (GRE, IP protocol 47).

## Verifying

The generated script uses the CE serviceability curl-host command against each domain in your allowlist, following F5's documented registration-troubleshooting method, so you can confirm from the node itself that each endpoint is reachable before you file a ticket.

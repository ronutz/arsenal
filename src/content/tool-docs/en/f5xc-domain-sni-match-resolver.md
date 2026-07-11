## What it does

This tool answers a precise F5 Distributed Cloud (XC) question: given several HTTP load balancers and their domain lists, which one serves a particular hostname? Paste the load balancers as a JSON array and a test hostname, and the resolver names the winning load balancer and domain entry, shows why, and flags the configuration hazards that make domain matching go wrong. It runs entirely in your browser.

## How XC picks a load balancer

When a request arrives, XC has already narrowed things to the load balancers that share the destination IP and port (the advertise policy). Among those, it picks the most specific domain match. An exact FQDN - app.example.com listed literally - beats a wildcard like *.example.com. The hostname it matches on comes from the SNI value when the client uses HTTPS, or the Host header when the client uses plain HTTP. If nothing matches and one load balancer is marked as the Default for that advertise policy, the Default catches the request; if there is no Default, the hostname is not picked up at all.

## Wildcards and the apex

A wildcard domain is a suffix match: *.example.com covers foo.example.com, but it does not cover the apex example.com, and a wildcard TLS certificate only covers a single label. That is why serving both www.example.com (or any subdomain) and the bare example.com needs the apex added as its own domain. The tool makes the wildcard-versus-apex distinction explicit in every result.

## The hazards it flags

Domain matching breaks in a few recognizable ways, and the tool warns about each. Configuring both a wildcard (*.example.com) and its apex (example.com) on different load balancers that use automatic certificates is something F5 specifically advises against. Two load balancers claiming the same exact domain, or two marked as Default on the same advertise policy (only one is allowed), are conflicts. A hostname that matches two entries with equal specificity is ambiguous. And a multi-label hostname that matches a wildcard will route but may fail certificate validation, since the wildcard cert covers only one label.

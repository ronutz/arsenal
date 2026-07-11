## What it does

This tool is a linter for F5 Distributed Cloud (XC) configuration objects. Paste an origin_pool, http_loadbalancer, or app_firewall object - from the Console's JSON view or the API - and it flags settings that are risky, surprising, or likely mistakes, each with a severity and a short explanation grounded in F5's documentation. It runs entirely in your browser, and it introduces no new schema: every rule reuses the object structures verified for the other tools in this family.

## What it checks

For an origin pool, the linter flags TLS to the origin with server verification skipped (the connection is encrypted but the origin's certificate is not validated), SNI disabled, cleartext to the origin, an absent health check, and a single origin server with no redundancy. For an HTTP load balancer, it flags no WAF attached, a plain-HTTP listener with no HTTPS, HTTPS configured without an HTTP-to-HTTPS redirect, a route that disables the WAF, a catch-all route placed before other routes (which can never match under first-match evaluation), and a wildcard domain mixed with its apex. For a WAF, it flags monitoring mode (detects but does not block) and disabled threat campaigns.

## Severity and grounding

Each finding carries a severity - high, warn, or info - and the list is sorted with the most serious first. High is reserved for a setting that materially weakens security, like skipping origin verification. Warn covers settings that are usually wrong, like no WAF or a shadowed route. Info covers things worth knowing but often intentional, like a single origin. Every rule cites the F5 source it is based on, so a flag is a starting point for a decision rather than a verdict - some of these settings are the right choice in context, and the linter says why each one matters so you can decide.

## What it is not

The linter reads one object at a time and reasons only about what is inside it. It cannot see whether a WAF referenced by name is itself in monitoring mode, or whether an origin pool referenced by a route carries a weight - those live in other objects. It is a fast first pass over a single object's own settings, not a full configuration audit.

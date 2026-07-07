## What it does

This tool takes a hostname and works out two things about it: the **public suffix** (the effective top-level domain, or eTLD) and the **registered domain** (the eTLD plus one label, often called eTLD+1). For `www.blog.example.co.uk` the public suffix is `co.uk` and the registered domain is `example.co.uk`. Everything runs locally in your browser against a bundled copy of the Public Suffix List; nothing is sent anywhere.

## Why it matters

The registered domain is the unit that a lot of systems count against. Certificate authorities such as Let's Encrypt apply their per-domain issuance rate limit to the registered domain, so `api.example.com` and `www.example.com` share one budget under `example.com`. Browsers use the same boundary to decide cookie scope and same-site behaviour. The catch is that you cannot find it by simply taking the last two labels: `example.co.uk` needs three labels because `.co.uk` is itself a public suffix, and the only correct way to know that is the Public Suffix List.

## How it works

The tool implements the published Public Suffix List algorithm. It finds the rule that applies to your host, preferring an exception rule (a `!` rule) over any normal rule, and otherwise taking the rule with the most labels. Wildcard rules like `*.ck` match any single label in that position. If no rule matches at all, the rightmost label is treated as the suffix. The registered domain is then the public suffix plus the next label to its left, when such a label exists.

## ICANN and PRIVATE sections

The list has two parts. The **ICANN** section is the set of registry-operated suffixes that browsers enforce. The **PRIVATE** section covers vendor-delegated names such as `github.io` or `*.compute.amazonaws.com`, where a provider hands out subdomains. These can disagree: under the full list `user.github.io` is its own registered domain, but under ICANN rules alone the registered domain is `github.io`. When a PRIVATE rule decides the answer, the tool also shows the ICANN-only view, because that is the interpretation certificate rate limits and same-site checks use.

## Notes

Enter a bare hostname; a scheme, port, path, or a leading `*.` wildcard label are stripped automatically, and internationalised names are converted to their punycode form before matching. IP addresses are reported as such rather than parsed as domains, since they have no public suffix. Because the Public Suffix List changes over time, the bundled copy is a dated snapshot; treat the result as accurate as of that snapshot and refresh against publicsuffix.org if you need the very latest rules.

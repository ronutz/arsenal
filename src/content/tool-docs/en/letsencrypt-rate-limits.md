## What it does

Paste the list of hostnames you plan to put on Let's Encrypt certificates, and this tool groups them by **registered domain** (eTLD+1) and shows how they map onto Let's Encrypt's issuance limits. It tells you the fewest certificates the set needs, flags where a wildcard would collapse several subdomains, and warns when a naive one-certificate-per-name approach would exceed the weekly per-domain limit. Everything runs locally in your browser; nothing is sent anywhere.

## Why the registered domain matters

Let's Encrypt's headline limit counts new certificates against the **registered domain**, not each hostname. So `www.example.com`, `api.example.com`, and `blog.example.com` all draw from a single weekly budget under `example.com`. The tool computes that grouping with the Public Suffix List, so it is correct even for multi-label suffixes: `shop.example.co.uk` and `www.example.co.uk` group under `example.co.uk`, three labels deep, not `co.uk`. Getting this boundary wrong is the usual reason people are surprised by a rate-limit error.

## What it computes

For each registered domain it shows the count of intended names (against the per-domain weekly limit), the fewest certificates needed if you pack up to 100 names per certificate, and any **wildcard candidates**: a parent with two or more direct subdomains, which a single `*.parent` name could cover instead. The summary totals the names, the distinct registered domains, and the minimum certificates across everything, and raises a warning if any one registered domain would exceed the weekly limit when issued one certificate per name. IP-address inputs are listed separately, since they use their own unit, and anything that is not a valid hostname (including a bare public suffix like `co.uk`) is called out.

## The limits it uses

The numbers shown are a dated, sourced snapshot of Let's Encrypt's published limits: 50 new certificates per registered domain per 7 days, 300 new orders per account per 3 hours, 5 certificates for the same exact set of names per 7 days, and up to 100 names per certificate. The single most useful fact for planning is that **renewals coordinated by ARI are exempt from all rate limits**, so once you are issued, keeping certificates renewed is not a rate-limit concern. Because Let's Encrypt can change these numbers, the tool shows the snapshot date and links the source; check that page for the current values before relying on a tight margin.

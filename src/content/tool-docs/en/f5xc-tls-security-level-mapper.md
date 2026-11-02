## What it does

This tool maps between F5 Distributed Cloud (XC) TLS security levels and the cipher suites they negotiate, in both directions. Pick a level - **High**, **Medium**, or **Low** - and it shows the exact minimum and maximum TLS versions and the full cipher list, with each suite annotated by key exchange, forward secrecy, and strength. Or paste a cipher suite (IANA `TLS_*` or OpenSSL dash form) or a whole scanner line, and it tells you which levels include that cipher. Everything runs in your browser.

## The table it is built on

The cipher lists are transcribed verbatim from F5's TLS Reference. Two things about that table catch people out. First, **Default is the High level**: it is minimum TLS 1.2, maximum TLS 1.3, and it is what an HTTPS load balancer with an automatic certificate uses. Second, the levels are **cumulative** - Medium is every High cipher plus four ECDHE-CBC suites, and Low is every Medium cipher plus four static-RSA suites. Every level maxes out at TLS 1.3.

## Why your scanner flags a load balancer

Two field questions come up constantly, and the tool answers both. If a scanner reports **TLS 1.0 or 1.1 enabled**, the load balancer is on **Medium or Low** - those levels are minimum TLS 1.0. The Default/High level is minimum TLS 1.2, so it will not present the old protocols (K000148226). If a scanner reports **weak ciphers**, it is almost always the **static-RSA suites the Low level adds** - they have no forward secrecy, which is exactly what a scanner grades down (K000148079).

## Reading the annotations

Every cipher is tagged with its key exchange (TLS 1.3, ECDHE-ECDSA, ECDHE-RSA, or RSA), whether it provides forward secrecy (PFS), and a strength grade. The ECDHE suites are PFS; the static-RSA suites are not. TLS 1.3 and the AEAD (GCM / ChaCha20) suites are strong; the CBC-SHA suites are medium; the static-RSA suites are weak.

## Share results

Each mode has its own **Share results** button, under its own answer, and builds a link to this page, only when you press it, that carries that mode's value after the `#`: under the level's ciphers, the level you picked; under the cipher's levels, the cipher line you typed, once a cipher in it is recognised. A level or a cipher suite names no system or person. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The level is picked and the cipher line fills, as if clicked and typed; both readings follow. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

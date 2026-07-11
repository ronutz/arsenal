## What it does

This tool maps between F5 Distributed Cloud (XC) TLS security levels and the cipher suites they negotiate, in both directions. Pick a level - **High**, **Medium**, or **Low** - and it shows the exact minimum and maximum TLS versions and the full cipher list, with each suite annotated by key exchange, forward secrecy, and strength. Or paste a cipher suite (IANA `TLS_*` or OpenSSL dash form) or a whole scanner line, and it tells you which levels include that cipher. Everything runs in your browser.

## The table it is built on

The cipher lists are transcribed verbatim from F5's TLS Reference. Two things about that table catch people out. First, **Default is the High level**: it is minimum TLS 1.2, maximum TLS 1.3, and it is what an HTTPS load balancer with an automatic certificate uses. Second, the levels are **cumulative** - Medium is every High cipher plus four ECDHE-CBC suites, and Low is every Medium cipher plus four static-RSA suites. Every level maxes out at TLS 1.3.

## Why your scanner flags a load balancer

Two field questions come up constantly, and the tool answers both. If a scanner reports **TLS 1.0 or 1.1 enabled**, the load balancer is on **Medium or Low** - those levels are minimum TLS 1.0. The Default/High level is minimum TLS 1.2, so it will not present the old protocols (K000148226). If a scanner reports **weak ciphers**, it is almost always the **static-RSA suites the Low level adds** - they have no forward secrecy, which is exactly what a scanner grades down (K000148079).

## Reading the annotations

Every cipher is tagged with its key exchange (TLS 1.3, ECDHE-ECDSA, ECDHE-RSA, or RSA), whether it provides forward secrecy (PFS), and a strength grade. The ECDHE suites are PFS; the static-RSA suites are not. TLS 1.3 and the AEAD (GCM / ChaCha20) suites are strong; the CBC-SHA suites are medium; the static-RSA suites are weak.

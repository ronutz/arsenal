## What it does

This tool computes a JA3 passive TLS fingerprint. Paste a JA3 string - the five ClientHello fields (TLS version, cipher suites, extensions, elliptic curves, and elliptic curve point formats), commas between fields and dashes between values - and it recomputes the JA3 MD5 hash, computes the JA3N variant with the extensions sorted, decodes each field with a count, and flags any GREASE values. It runs entirely in your browser.

## JA3, and why the hash is what it is

JA3 was created by Salesforce as a compact, shareable identifier for a TLS client. The five fields it uses are filled in mostly by the client's TLS library rather than the application, so the same browser or tool build tends to produce the same JA3 - which makes it useful for spotting scripts, bots, and unusual libraries before an application has any other context. The tool follows the original construction exactly: it strips GREASE values (the reserved 0x0a0a through 0xfafa placeholders that RFC 8701 has browsers insert), rebuilds the canonical string, and MD5-hashes it. Two of Salesforce's own published examples are pinned as tests, so the hash you get here is the JA3 the ecosystem expects.

## GREASE and the churn problem

Two things make a raw JA3 less stable than it looks, and the tool surfaces both. GREASE values are random placeholders that change every connection; if they are not stripped, the same client produces a different hash each time, so JA3 excludes them - and the tool tells you which ones it found and removed. The larger problem is extension permutation: since around 2024, Chrome and Firefox randomize the order of TLS extensions on every connection, and because JA3 hashes the extensions in order, a single browser now produces thousands of different JA3 hashes. The tool marks whether your extensions were in order and shows JA3N alongside JA3.

## JA3N and JA4

JA3N is the simple fix: sort the extension list before hashing, and the permutation no longer matters. The tool computes it for you, so if your input came from a permuting browser, the JA3N is the value that stays constant. JA3N is a stopgap, though. The modern successor is JA4, which sorts natively, uses SHA256, adds a human-readable prefix, and extends to HTTP, SSH, QUIC, and TCP. If you are choosing a fingerprint to build detection on today, JA4 is the better target; the JA3 here is for reading and matching the fingerprints that older tooling and threat intelligence still speak in.

## What a fingerprint is and is not

A JA3 identifies a TLS implementation, not a person and not an intent. It is a strong signal when combined with request behavior, proxy intelligence, and account history, and a weak one on its own: MD5 collisions are possible, and two different clients can share a hash. Treat it as one input to a decision - a way to notice that a connection looks like a known bot or an unexpected library - rather than proof of anything by itself.

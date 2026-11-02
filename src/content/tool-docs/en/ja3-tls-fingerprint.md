## What it does

This tool computes a JA3 passive TLS fingerprint. Paste a JA3 string - the five ClientHello fields (TLS version, cipher suites, extensions, elliptic curves, and elliptic curve point formats), commas between fields and dashes between values - and it recomputes the JA3 MD5 hash, computes the JA3N variant with the extensions sorted, decodes each field with a count, and flags any GREASE values. It runs entirely in your browser.

## JA3, and why the hash is what it is

JA3 was created by Salesforce as a compact, shareable identifier for a TLS client. The five fields it uses are filled in mostly by the client's TLS library rather than the application, so the same browser or tool build tends to produce the same JA3 - which makes it useful for spotting scripts, bots, and unusual libraries before an application has any other context. The tool follows the original construction exactly: it strips GREASE values (the reserved 0x0a0a through 0xfafa placeholders that RFC 8701 has browsers insert), rebuilds the canonical string, and MD5-hashes it. Two of Salesforce's own published examples are pinned as tests, so the hash you get here is the JA3 the ecosystem expects.

## GREASE and the churn problem

Two things make a raw JA3 less stable than it looks, and the tool surfaces both. GREASE values are random placeholders that change every connection; if they are not stripped, the same client produces a different hash each time, so JA3 excludes them - and the tool tells you which ones it found and removed. The larger problem is extension permutation: since around 2024, Chrome and Firefox randomize the order of TLS extensions on every connection, and because JA3 hashes the extensions in order, a single browser now produces thousands of different JA3 hashes. The tool marks whether your extensions were in order and shows JA3N alongside JA3.

## JA3N and JA4

JA3N is the simple fix: sort the extension list before hashing, and the permutation no longer matters. The tool computes it for you, so if your input came from a permuting browser, the JA3N is the value that stays constant. JA3N is a stopgap, though. The modern successor is JA4, which sorts natively, uses SHA256, adds a human-readable prefix, and extends to HTTP, SSH, QUIC, and TCP. If you are choosing a fingerprint to build detection on today, JA4 is the better target; the JA3 here is for reading and matching the fingerprints that older tooling and threat intelligence still speak in.

## What a fingerprint is and is not

A JA3 identifies a TLS implementation, not a person and not an intent. It is a strong signal when combined with request behaviour, proxy intelligence, and account history, and a weak one on its own: MD5 collisions are possible, and two different clients can share a hash. Treat it as one input to a decision - a way to notice that a connection looks like a known bot or an unexpected library - rather than proof of anything by itself.

## Share results

Under the hashes, **Share results** builds a link to this page, only when you press it, that carries the JA3 string as the page reads it after the `#`, not the box as typed. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

A JA3 string is five comma-separated fields of numbers from a TLS ClientHello, and the page reads only the numbers: in each field it skips any piece that is not an integer. So the link carries each field's integer pieces as written (GREASE values included, since the page flags them) and leaves out blanks and anything the reading skips, such as text pasted along with the string; the page that opens the link computes the same hashes, flags and permutation note. When the box holds nothing else, the link carries it as typed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the string is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The string fills the box as a paste would and the page computes the hashes; nothing is sent. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

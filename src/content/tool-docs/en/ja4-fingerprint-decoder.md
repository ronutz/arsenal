## What it does

A JA4 is a fingerprint of a TLS client, computed from the fields in its ClientHello: the TLS version, the cipher suites it offers, the extensions it sends, the signature algorithms, and the ALPN. Two clients that build their ClientHello the same way produce the same JA4, which is how servers, proxies, and passive sensors recognize client software without decrypting anything. This tool decodes a JA4 into its parts, or computes the hashed JA4 from the raw, unhashed values. It all runs in your browser.

## How a JA4 is built

A JA4 has three sections joined by underscores, `JA4_a_JA4_b_JA4_c`, for example `t13d1516h2_8daaf6152771_e5627efa2ab1`.

- **JA4_a** is human-readable and ten characters long:
  - transport: `t` for TLS over TCP, `q` for QUIC, `d` for DTLS;
  - TLS version: `13` for TLS 1.3, `12` for 1.2, and so on, read from the supported_versions extension when present;
  - SNI: `d` when the ClientHello carries a server name (a domain), `i` when it does not (a bare IP);
  - the cipher count as two digits;
  - the extension count as two digits (this count includes SNI and ALPN);
  - the ALPN marker: the first and last character of the first ALPN value, so `h2` for HTTP/2, or `00` when there is no ALPN.
- **JA4_b** is the first twelve hex characters of the SHA-256 of the cipher list, sorted.
- **JA4_c** is the first twelve hex characters of the SHA-256 of the extension list (sorted, with SNI and ALPN removed) followed by the signature-algorithm list in its original order.

Because JA4_b and JA4_c are truncated hashes, they are one-way: the tool can show them but cannot recover the cipher or extension lists from them.

## GREASE

GREASE (the reserved values from draft-davidben-tls-grease) keeps TLS extensible by making clients send random unused values that servers must ignore. JA4 ignores them too, so they never affect the counts or the hashes. If you paste raw values that include GREASE, this tool filters them out before counting, sorting, and hashing.

## Sorting is what makes JA4 robust

Older fingerprints like JA3 hashed the cipher and extension lists in the order the client sent them. Modern browsers now deliberately randomize the order of TLS extensions on each connection, which changes a JA3 every time and defeats it. JA4 sorts the ciphers and extensions before hashing, so the fingerprint stays stable even when the client shuffles the order. That is the main reason JA4 has largely replaced JA3.

## Worked example

The fingerprint `t13d1516h2_8daaf6152771_e5627efa2ab1` decodes to TLS over TCP, TLS 1.3, SNI present, 15 cipher suites, 16 extensions, and ALPN `h2` (HTTP/2). This is the worked example from the JA4 specification, and it is one of this tool's golden vectors: the SHA-256 of its sorted cipher list gives `8daaf6152771`, and the sorted extensions plus signature algorithms give `e5627efa2ab1`.

## A note on licensing

JA4 (TLS client fingerprinting) is released by FoxIO under the permissive BSD 3-Clause license, the same terms as the original JA3, so it is free to implement, including in commercial tools. The other members of the JA4+ family, such as JA4S, JA4H, JA4X, and JA4T, are under the FoxIO License 1.1, which does not permit monetization without a separate agreement, so this tool implements JA4 only.

## JA3, the predecessor

This tool also handles JA3, the older fingerprint JA4 replaced. A JA3 is the MD5 of five decimal fields from the ClientHello in the order they were sent: `SSLVersion,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats`, for example `769,47-53-5-10-49161-49162-49171-49172-50-56-19-4,0-10-11,23-24-25,0`. Paste a JA3 string and the tool computes its MD5 and breaks out the fields; paste a bare 32-character MD5 and it recognizes it as a JA3 hash, which, being one-way, it cannot decode. JA3 is BSD 3-Clause like JA4. It is order-sensitive, so a browser that randomizes its extension order produces a different JA3 on each connection, which is the reason JA4 exists.

## Using it

The tool auto-detects what you paste: a JA4 has underscores, while a JA3 is decimal fields separated by commas, or a bare MD5. Paste a hashed JA4 to decode it, a raw JA4_r (the `JA4_a` value followed by the unhashed cipher, extension, and signature-algorithm lists, separated by underscores) to compute the hashed JA4, a JA3 string to compute its MD5 and see its fields, or a JA3 MD5 to identify it. The raw JA4 path sorts and GREASE-filters the lists for you, so sorted and original-order inputs produce the same canonical JA4.

## What it does

Enter a TLS cipher suite, whether as its IANA name, an OpenSSL or GnuTLS name, or a hex code point, and the tool breaks it into its parts, the key exchange, the authentication, the bulk cipher and mode, and the MAC, and gives a plain-language security read-out along with the suite's official IANA recommendation status. It runs in your browser against a bundled copy of the IANA registry.

## Reading a cipher suite name

A cipher suite is a named bundle of the algorithms a TLS connection will use, and the name is structured. In TLS 1.2 and earlier, a name like `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256` reads as its parts: `ECDHE` is the key-exchange method, `RSA` is how the server is authenticated, `AES_128_GCM` is the bulk cipher with its key size and mode, and `SHA256` is the MAC and PRF hash. TLS 1.3 changed this: a 1.3 suite like `TLS_AES_128_GCM_SHA256` names only the symmetric cipher and the hash, because the key exchange is always ephemeral and is negotiated separately. The tool parses either form into its components.

## Names, code points, and the registry

The same suite has different names in different tools, with a numeric code point underneath them all. The authoritative source is the IANA TLS Cipher Suites registry, which maps each two-byte code point to its name and carries the **Recommended** flag (Y, N, or D for discouraged, per RFC 8447). The tool resolves whatever you type, an IANA name, an OpenSSL or GnuTLS name, or the raw hex code point, back to that registry record, so you can move between the spelling one tool shows and the one another expects.

## The security read-out

Knowing the parts, the tool can judge the suite, and it flags the known-bad and the weak on a standards basis rather than by opinion: RC4 suites are insecure (RFC 7465), 3DES suites are weak because of the Sweet32 attack (RFC 8429), and it reflects the registry's own not-recommended entries. It also recognises modern choices, including the authenticated-encryption modes (GCM and ChaCha20-Poly1305) and the post-quantum hybrid key-exchange groups built on ML-KEM (NIST FIPS 203).

## Using it

Enter a cipher suite in any common form and read its decoded key exchange, authentication, cipher, mode, and MAC, its IANA recommendation status, and the security assessment. The decode is deterministic and entirely local.

The suite a live server chose is on the `Cipher is` line of `openssl s_client` output; the [openssl s_client explainer](/tools/openssl-s-client-explainer) reads that line with everything around it, including the trap that its version is the cipher's own, not always the version negotiated.

## Share results

Under the verdict badges, **Share results** builds a link to this page, only when you press it, that carries the cipher suite as you typed it, after the `#`: `/tools/cipher#input=TLS_CHACHA20_POLY1305_SHA256`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the name is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The link has the `#input=` form this page already reads, so opening it works exactly as those links always have: the value fills the box and decodes, and it stays in the address until you change or clear the box.

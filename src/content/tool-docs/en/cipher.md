## What it does

Enter a TLS cipher suite, whether as its IANA name, an OpenSSL or GnuTLS name, or a hex code point, and the tool breaks it into its parts, the key exchange, the authentication, the bulk cipher and mode, and the MAC, and gives a plain-language security read-out along with the suite's official IANA recommendation status. It runs in your browser against a bundled copy of the IANA registry.

## Reading a cipher suite name

A cipher suite is a named bundle of the algorithms a TLS connection will use, and the name is structured. In TLS 1.2 and earlier, a name like `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256` reads as its parts: `ECDHE` is the key-exchange method, `RSA` is how the server is authenticated, `AES_128_GCM` is the bulk cipher with its key size and mode, and `SHA256` is the MAC and PRF hash. TLS 1.3 changed this: a 1.3 suite like `TLS_AES_128_GCM_SHA256` names only the symmetric cipher and the hash, because the key exchange is always ephemeral and is negotiated separately. The tool parses either form into its components.

## Names, code points, and the registry

The same suite has different names in different tools, with a numeric code point underneath them all. The authoritative source is the IANA TLS Cipher Suites registry, which maps each two-byte code point to its name and carries the **Recommended** flag (Y, N, or D for discouraged, per RFC 8447). The tool resolves whatever you type, an IANA name, an OpenSSL or GnuTLS name, or the raw hex code point, back to that registry record, so you can move between the spelling one tool shows and the one another expects.

## The security read-out

Knowing the parts, the tool can judge the suite, and it flags the known-bad and the weak on a standards basis rather than by opinion: RC4 suites are insecure (RFC 7465), 3DES suites are weak because of the Sweet32 attack (RFC 8429), and it reflects the registry's own not-recommended entries. It also recognizes modern choices, including the authenticated-encryption modes (GCM and ChaCha20-Poly1305) and the post-quantum hybrid key-exchange groups built on ML-KEM (NIST FIPS 203).

## Using it

Enter a cipher suite in any common form and read its decoded key exchange, authentication, cipher, mode, and MAC, its IANA recommendation status, and the security assessment. The decode is deterministic and entirely local.

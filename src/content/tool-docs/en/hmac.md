## What it does

Compute an HMAC, a keyed hash, over a message using a secret key, with the result shown as hexadecimal and Base64. You choose SHA-256, SHA-384, or SHA-512 as the underlying hash. The computation uses the browser's native Web Crypto, and your key never leaves your browser. This is the same construction, over the same code path, that the JWT verifier uses to check an HS256 signature, so the two agree by design.

## What HMAC is for

A plain hash proves that data has not changed, but anyone can recompute it, so it cannot prove who produced it. HMAC adds a secret key to the hash, which turns it into a message authentication code: a value that proves both that the message is intact and that it came from someone who holds the key. The sender computes the HMAC and sends it alongside the message; the receiver, who shares the key, recomputes it and checks that the two match. It is defined in RFC 2104 and FIPS 198-1, with test vectors in RFC 4231.

## Symmetric by nature

HMAC uses one shared secret for both producing and verifying the code. That makes it fast and simple, but it also means anyone who can verify an HMAC can also forge one, because both operations use the same key. It is the right tool when the same party, or two parties that already share a trusted secret, both produce and check the codes. When independent parties must verify without being able to forge, an asymmetric signature is the better fit, which is the same trade-off that separates HS256 from RS256 in JWTs.

## How it is built

HMAC is not simply the hash of the key joined to the message, which would be vulnerable to length-extension attacks. It is a nested construction: the message is hashed together with one derived form of the key, and that result is hashed again with a second derived form. This structure is what gives HMAC its security proof, and it is why you should use HMAC rather than inventing your own keyed hash.

## Using it

Enter a message and a secret key, pick the hash, and read the HMAC as hex or Base64. Feed the same message and key to two systems and the codes will match; change either the message or the key by one character and the code changes completely.

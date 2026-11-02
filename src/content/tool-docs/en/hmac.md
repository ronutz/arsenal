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

## Share results

Under the MAC, **Share results** builds a link to this page, only when you press it, that carries the message as typed and the algorithm after the `#`, and never the key. The reader of the link types the key you share with them, by another way, and gets the same MAC; the MAC itself is not carried either, because beside the message it would let anyone test guesses of a weak key offline. One exception: the key `Jefe` goes too, because it is the published test key of [RFC 4231](https://www.rfc-editor.org/rfc/rfc4231) (test case 2, read 2026-11-01), which the page's Example uses. Its popover says first what the link carries, then a caution of its own (the message goes as typed, so read it before you send the link), then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

An HMAC key is a key: [RFC 2104](https://www.rfc-editor.org/rfc/rfc2104) (section 3, read 2026-11-01) asks for keys "chosen at random" and "periodically refreshed", a practice that "limits the damage of an exposed key", and whoever holds it can compute a valid MAC for any message.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the values are not sent to the server when the link is opened; they stay in the address bar and the history of whoever opens it, and anyone who has the link can read them.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The message and the algorithm fill the page. The key box takes the published test key when it arrives and otherwise keeps what the reader typed; on a fresh page it is empty, and a note says the key never travels. The MAC is computed with Web Crypto in the browser once both fields are filled. An algorithm the page does not offer, or a key that is not the published one, makes the whole link ignored. Either way the values leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

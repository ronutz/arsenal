## What it does

Decode the value of an F5 BIG-IP `BIGipServer` persistence cookie into the backend pool member's IP address and port, or go the other way and encode a cookie value from an address and port. It handles the four unencrypted encodings BIG-IP uses, and it runs entirely in your browser.

## What the cookie is, and why decoding it matters

When BIG-IP cookie persistence runs in its default insert mode, it adds a cookie named `BIGipServer<pool>` whose value encodes which pool member a client was sent to, so the client returns to the same member. The catch is that the encoding is not encryption: in its default form, the cookie plainly encodes the pool member's internal IP address and port. Anyone who can see the cookie, which means the client and anything on the path, can decode it and learn a piece of your internal topology. Demonstrating that is the point of this tool, and it flags when a decoded address falls in a private RFC 1918 range, because that is exactly the internal detail you did not mean to publish.

## The encodings and their byte order

The subtlety, and the reason a purpose-built decoder helps, is byte order. In the default IPv4 encoding the address is a single decimal number whose bytes are taken little-endian, that is, reversed, and the port is a decimal field with its two bytes swapped. For example, the address `10.1.1.100` encodes to the decimal `1677787402`, and port `80` encodes to the byte-swapped `20480`. BIG-IP defines four such encodings in all, covering IPv4, IPv6, and route-domain variants, each with its own rule, which the tool implements from F5's own documentation (K6917) cross-checked against a well-known reference decoder.

## The fix, which this tool cannot undo

The mitigation is straightforward and worth stating: configure cookie encryption on the persistence profile (F5 K7784). An encrypted persistence cookie carries no readable address, and this tool cannot decode one, by design. If you can decode your production cookie here, so can anyone else, which is the signal to turn encryption on.

## Using it

Paste a `BIGipServer` cookie value to decode the member address and port, or enter an address and port to produce a cookie value. The computation is deterministic and local; nothing is sent anywhere.

## What it does

Generate and verify the one-time codes used for two-factor authentication: time-based passwords (TOTP, RFC 6238), the six-digit codes an authenticator app shows, and counter-based passwords (HOTP, RFC 4226), the codes a hardware token produces. You can choose the hash (SHA-1, SHA-256, or SHA-512), the number of digits, and the time step. The computation uses the browser's native Web Crypto, and your shared secret never leaves your browser.

## One construction, two moving factors

HOTP and TOTP are the same algorithm underneath. Both take a shared secret and a moving factor, compute an HMAC of the moving factor under the secret, and then apply the "dynamic truncation" defined in RFC 4226 to reduce that MAC to a short decimal code. The only difference is where the moving factor comes from:

- **HOTP** uses an explicit event counter that increments by one each time a code is used. The token and the server have to stay in step on that counter.
- **TOTP** uses the clock: the moving factor is the number of time steps since an epoch, `floor((current time - T0) / step)`, with `T0` at 0 and the step 30 seconds by default. In other words, TOTP is simply HOTP whose counter is the current time slice, which is why a TOTP code changes every 30 seconds.

## The shared secret

The secret is the seed both sides hold. It is usually exchanged as a Base32 string, which is what an `otpauth://` URI or a setup QR code encodes, so the tool decodes Base32 to recover the key bytes. The default hash is SHA-1, which is what most authenticator apps and tokens still use for one-time passwords; SHA-256 and SHA-512 are available where both sides support them.

## Verification and clock drift

Because a device's clock and a server's clock are never perfectly aligned, a TOTP check normally accepts codes from a small window of adjacent time steps rather than only the current one, trading a little strictness for reliability. HOTP has the analogous problem on the counter, where a token can advance if a generated code is not used, so servers accept a look-ahead window and resynchronize.

## Using it

Enter the shared secret and generate the current TOTP code, or set a counter to generate a HOTP code, and adjust the hash, digit count, and step to match your system. You can also validate a code you were given. The algorithm is deterministic given the secret and the moving factor, so the same inputs always produce the same code.

## Share results

Under the generated code, **Share results** builds a link to this page, only when you press it, that carries the settings after the `#`: the mode, the algorithm, the number of digits, how the secret is written, and the time step or the counter; and the Unix time only when you typed one instead of using the clock. It never carries the shared secret. The reader of the link types the secret you share with them, by another way, and gets the same codes. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

The secret is the second factor itself: whoever holds it can make every code. [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226) (section 7.5, read 2026-11-01) asks that operations on shared secrets "be performed securely, in order to mitigate risks of any leakage of sensitive information", and [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) (section 3, requirement R7, read 2026-11-01) that keys "SHOULD be protected against unauthorized access and usage". One exception: the published test keys go too, because anyone can already read them. These are RFC 4226 Appendix D's secret (the ASCII string `12345678901234567890`) and RFC 6238's 32- and 64-byte seeds for HMAC-SHA-256 and HMAC-SHA-512 (its Appendix A), printed in the standards, whose tables the manual time exists to reproduce; and the key this page opens with, `JBSWY3DPEHPK3PXP`, which this site prints itself (in the page, in its API description and in the [provisioning-URI article](/learn/totp-provisioning-uris-and-qr)), so the page shared as it opens reopens as it was. They are recognised by their bytes, in any of the three encodings.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the values are not sent to the server when the link is opened; they stay in the address bar and the history of whoever opens it, and anyone who has the link can read them.

- **Opening a link.** The settings replace the form's; the clock is switched off only when a time arrives. The secret box takes a published test key when one arrives (the page's own included) and is emptied otherwise, with a note asking for the secret, so the page never shows a code for a key the sender did not use. The codes are computed with Web Crypto in the browser. A choice the form does not offer, a number out of range, a field of the other mode, or a secret that is not a published test key makes the whole link ignored. Either way the values leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

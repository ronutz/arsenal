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

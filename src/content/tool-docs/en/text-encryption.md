## What it does

Type a text and a passphrase, press Encrypt, and you get one string that starts with `aesgcm1.`. Paste that string back in Decrypt mode, type the same passphrase, and you get the text back, exactly as it was. Everything happens in your browser through its Web Cryptography API: the text and the passphrase are never sent, never stored and never put in the address.

It is for your own text and your own passphrase: a note you want to keep in a file or a message thread without leaving it readable, or a secret you want to hand over in two parts (the string one way, the passphrase another). It opens only what was sealed with a passphrase you hold. It does not guess, crack or recover anything else, and a wrong passphrase gets nothing back.

## How it works

Every step is a primitive of the [Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/), the browser's own implementation; no cryptographic code is written in the page.

1. **The passphrase is prepared.** Every non-ASCII space (Unicode category Zs, such as the no-break space) becomes an ordinary space, then Unicode Normalization Form C is applied: the two mapping rules of the OpaqueString profile of [RFC 8265](https://www.rfc-editor.org/rfc/rfc8265) (section 4.2.2, rules 2 and 4). A "ç" typed as one character and a "ç" pasted as "c" plus a combining cedilla then give the same key. Nothing else is changed: case is kept, and no character is refused except an unpaired surrogate, which UTF-8 cannot represent. The result is encoded as UTF-8 ([RFC 3629](https://www.rfc-editor.org/rfc/rfc3629)).
2. **A key is derived.** PBKDF2 (Password-Based Key Derivation Function 2, [RFC 8018](https://www.rfc-editor.org/rfc/rfc8018), section 5.2) with HMAC-SHA-256 as its pseudorandom function turns the passphrase, a 16-byte random salt and 600,000 iterations into a 256-bit key for AES (the Advanced Encryption Standard).
3. **The text is sealed.** AES in Galois/Counter Mode (GCM, [NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)) encrypts the text, as UTF-8, under that key with a 12-byte random initialisation vector (IV) and produces a 128-bit authentication tag. The first four fields of the string are passed to GCM as additional authenticated data, so the tag covers them too.
4. **One string is written.** The version tag, the iteration count, the salt, the IV and the ciphertext with its tag, joined by dots.

Decrypting reverses it: read the fields, prepare the passphrase the same way, derive the same key from the salt and the count in the string, and let AES-GCM check the tag before it returns anything. This is the shape RFC 8018 calls PBES2 (section 6.2): a key from PBKDF2, then an encryption scheme. The string format around it is this tool's own, written out below so that anyone can reimplement it.

The salt and the IV are drawn by the page with `crypto.getRandomValues`, which the Web Cryptography API defines as filling an array with "cryptographically secure random bytes" (section 10.1.1). The engine itself takes them as inputs and draws nothing, which is why it can be tested byte for byte with a fixed salt and IV. It is also why encrypting the same text with the same passphrase twice gives two different strings, and why both decrypt.

## The string

```
aesgcm1.600000.AAECAwQFBgcICQoLDA0ODw.EBESExQVFhcYGRob.3lWZqiea5CBm...
```

| Field | Content | Encoding |
|---|---|---|
| 1 | `aesgcm1`: this construction, format version 1 | ASCII |
| 2 | The PBKDF2 iteration count | Decimal, no sign, no leading zero, 1,000 to 10,000,000 |
| 3 | The salt, 16 bytes | base64url without padding, 22 characters |
| 4 | The IV, 12 bytes | base64url without padding, 16 characters |
| 5 | The ciphertext followed by the 16-byte tag | base64url without padding |

- **base64url** is the URL- and filename-safe alphabet of [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648) (section 5): A to Z, a to z, 0 to 9, `-` and `_`. The padding `=` is left out, which section 3.2 allows when the specification says so: here the field ends at the next dot. Decoding is strict: any other character, a length that cannot encode whole bytes, or a last character whose unused bits are not zero is refused (section 3.5 lets a decoder reject a non-canonical encoding). The dot is not in that alphabet, so a field can never contain one.
- **The additional authenticated data** is the text of fields 1 to 4 with their three dots, exactly as written. Change the version, the count, the salt or the IV and the tag no longer verifies, even when the rest of the string is intact.
- **White space** (spaces, tabs, line breaks) anywhere in a pasted string is removed before it is read, because e-mail clients wrap long lines; the result says when it did that.
- **Length.** The ciphertext is as long as the text in UTF-8, plus the 16-byte tag. The string's length therefore shows roughly how long the text is.

## Why these numbers

- **600,000 iterations.** OWASP's [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) gives "PBKDF2-HMAC-SHA256: 600,000 iterations (recommended)" (read 2026-10-27). Each iteration is one more HMAC computation for anyone who tries passphrases against your string, and for you once per encryption or decryption: expect the button to take a moment.
- **1,000 to 10,000,000 when decrypting.** The count is in the string, so decryption follows it, within the span [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) sets out (section 5.2): "A minimum iteration count of 1,000 is recommended", and "an iteration count of 10,000,000 may be appropriate" for especially critical keys. RFC 8018 quotes the same text (section 4.2). The ceiling also means a crafted string cannot make the page derive a key for minutes.
- **A 16-byte salt.** SP 800-132, section 5.1: "The length of the randomly-generated portion of the salt shall be at least 128 bits." RFC 8018 (section 3) notes that the salt and the iteration count "need not be kept secret"; they travel in the string.
- **A 12-byte IV, drawn at random.** SP 800-38D recommends restricting IVs to 96 bits "to promote interoperability, efficiency, and simplicity of design" (section 5.2.1.1). Its central rule is that the same IV must not be used twice under the same key (section 8, a probability "no greater than 2^-32"), and when IVs are random it caps the number of encryptions under one key at 2^32 (section 8.3). Here every encryption has a new random salt, so a new key, as well as a new random IV.
- **A 128-bit tag**, the longest GCM allows (section 5.2.1.2) and the Web Cryptography API's default.
- **AES-256.** PBKDF2 derives 32 bytes, imported as an AES-GCM key that cannot be exported from the browser's key object.

## What it protects, and what it does not

**It protects** the content of the text while it is in the string, against anyone who has the string but not the passphrase, and it detects any change to the string: AES-GCM returns either the whole text or the single answer FAIL (SP 800-38D, section 7.2), and the page shows FAIL as "Wrong passphrase or altered text" with nothing else. There is no partial result to read.

**It does not protect:**

- **A weak passphrase.** Anyone who has the string can try passphrases on their own hardware, as often and as fast as they like; the page is not involved and cannot slow them down. RFC 8018 says so plainly: password-based cryptography "is generally limited in the security that it can provide", particularly "where offline password search is possible" (section 8). The iteration count multiplies the cost of each guess; it does not stop a guesser from reaching a passphrase that is early on their list. SP 800-132 (appendix A.1) adds that such searches are parallelisable and may run on a system "much more powerful" than yours.
- **Against anyone who knows the passphrase.** Whoever has both the string and the passphrase reads the text. Send them separately, and never in the same message.
- **A device that is not yours to trust.** Malware or a keystroke logger sees what you type before anything is encrypted; NIST notes that keystroke logging is "equally effective on lengthy and complex passwords as they are on simple ones" ([SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), appendix A). The Web Cryptography API's own security considerations say that script injected into a page "may allow for the exfiltration of keys or data", and that browsers are not required to wipe key material from memory or storage (section 6.2).
- **The length.** The string shows roughly how long the text is.
- **What happens after decryption.** The text is shown in the page. Copying it puts it on your system clipboard, where other programs can read it.

## The passphrase note

While you type a passphrase in Encrypt mode, the page shows its length in characters and in UTF-8 bytes and which kinds of character it contains (lowercase and uppercase letters, letters without case, digits, spaces, punctuation or symbols). It also says when the passphrase starts or ends with white space, and when preparation changes it. It computes **no strength score**, on purpose:

- A guesser does not try passphrases at random; it tries likely ones first (words, names, dates, quotations, passwords from earlier leaks). The page cannot know where yours sits on such a list, so a number would be invented.
- NIST treats length as "a primary factor in characterizing password strength" and finds that composition rules (requiring digits, capitals and symbols) add less than expected, because people satisfy them predictably: "password" becomes "Password1!" (SP 800-63B-4, appendix A). It also says that resisting offline attacks requires passwords "orders of magnitude more complex" than resisting online guessing.
- SP 800-132 (appendix A.1) says that passwords shorter than 10 characters are usually considered weak, and passphrases shorter than 20 characters too. The same appendix advises against sequences of numbers or letters and against personal information such as a name, a phone number or a date of birth.

Encrypt mode asks for the passphrase twice, and stays disabled until both agree: a text encrypted with a mistyped passphrase cannot be recovered by anyone.

## Nothing leaves the page

- **No request.** Encryption and decryption are calls to the browser's Web Cryptography API. Nothing is sent to this site or anywhere else.
- **No storage.** The text, the passphrase and the results exist only in the page's memory while it is open; Clear empties every field. Nothing is written to local storage, cookies or any other store.
- **Nothing in the address.** The page writes nothing to its own address. A link is made only when you press Share results, and it carries the encrypted string alone (next section).
- **Spell checking is switched off** on the fields (the HTML `spellcheck="false"` attribute). Chrome's [Enhanced spell check](https://support.google.com/chrome/answer/12027911?hl=en) "sends the text you enter in your browser to Google"; the [HTML Standard](https://html.spec.whatwg.org/multipage/interaction.html) (section 6.8.5) lets a user's own setting override the attribute, so if you have forced spell checking on everywhere, turn it off before typing secrets. The passphrase fields are password fields, which are not among the fields the Standard says browsers should check (text, search, URL and email inputs and text areas), until you choose Show.
- **No form.** The fields are not inside a form and have no name, so nothing can submit them.
- **The Web Cryptography API needs a secure context.** Its `subtle` interface exists only on pages served securely (the specification marks it `[SecureContext]`); without it the page says so and does nothing.

## Share results

Under the encrypted string (and, in Decrypt mode, under the Decrypt button) a **Share results** button builds a link to this page that carries the encrypted string and nothing else: never the passphrase, never the text. It builds the link only when you press it, says first what the link carries, and then offers Copy link and, where the browser has one, its share sheet. The page's address is not changed.

- **Where the string goes.** After the `#`: `/tools/text-encryption#input=aesgcm1...`. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5) has the fragment "separated from the rest of the URI prior to a dereference", so a browser does not send it to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link has the string. That is why the passphrase must travel another way.
- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`. At 600,000 iterations that is a text of up to 12,230 bytes in UTF-8; a longer string gets no link, and the popover says so: copy the string instead.
- **Opening a link.** The page opens in Decrypt mode with the string filled in, says that it came from a link, and clears any passphrase you had typed. It decrypts only when you type the passphrase and press Decrypt. A value that is not a well-formed string of this format is ignored. Either way the page removes the value from its address at once (without a request), so a reload, a bookmark or the page's own Share button carries nothing.
- **Proof.** For every round-trip golden vector and the Example, the site's share checks build the link and confirm that neither the passphrase nor the text appears in it, as typed, percent-encoded, form-encoded or decoded.

## Error codes

| Code | Meaning |
|---|---|
| `empty-text` | Encrypt: there is no text |
| `text-too-large` | The text is over 1,048,576 bytes (1 MiB) in UTF-8, the page's bound (GCM itself allows up to 2^39 - 256 bits) |
| `lone-surrogate` | The text or the passphrase holds an unpaired surrogate, which UTF-8 cannot represent |
| `empty-passphrase` | No passphrase |
| `passphrase-too-long` | Over 1,024 characters after preparation |
| `bad-salt-length` | A salt that is not 16 bytes |
| `bad-iv-length` | An IV that is not 12 bytes |
| `iterations-out-of-range` | An iteration count outside 1,000 to 10,000,000 |
| `empty-input` | Decrypt: nothing but white space |
| `input-too-large` | Decrypt: over 2,000,000 characters |
| `bad-format` | Not five fields separated by dots |
| `unknown-version` | A first field other than `aesgcm1` (the tag is case-sensitive) |
| `bad-iterations` | A second field that is not a decimal integer without a leading zero |
| `bad-encoding` | A salt, IV or ciphertext field that is not canonical base64url without padding |
| `too-short` | A ciphertext field shorter than the 16-byte tag |
| `auth-failed` | The tag did not verify: wrong passphrase, or a string altered after it was made |
| `not-utf8` | The tag verified but the content is not UTF-8 text (this tool never writes such a string) |
| `no-crypto` | The page has no Web Cryptography API |
| `crypto-error` | The Web Cryptography API refused for another reason |

The page reads a pasted string as you paste it and shows its format, iteration count and sizes, or the reason it cannot be read, before you type the passphrase.

## Worked examples

- **The Example button, Encrypt mode** fills in the text "Lab notes: the core switch maintenance window moves to Saturday 02:00 (São Paulo)." and the passphrase `Password` in both fields. `Password` is the test password of RFC 7914, section 11, which anyone can read; the page marks it as the Example's passphrase whenever it is in the field. Never use it for real text. Press Encrypt and you get a string of 187 characters (83 bytes of text, 99 bytes once sealed), different every time.
- **The Example button, Decrypt mode** fills in the string that the golden vector "example" pins: `aesgcm1.600000.AAECAwQFBgcICQoLDA0ODw.EBESExQVFhcYGRob.3lWZ...` (the full string is in the page). It was made with a fixed salt (bytes 00 to 0f) and IV (bytes 10 to 1b), which the page itself never uses. With `Password` it decrypts to the text above; with `password` it gives `auth-failed`.
- **Changing one character.** Change any character of the ciphertext, the salt, the IV or the count of a valid string and decryption gives `auth-failed`, never a garbled text.
- **The same passphrase, typed differently.** "coração de exemplo" typed with composed characters, with decomposed ones, or with a no-break space between the words derives the same key, so all three decrypt the same string.

## Provenance

The engine is a set of pure functions around the Web Cryptography API: given the same text, passphrase, salt, IV and count, it always writes the same string. It ships golden vectors (set `text-encryption-golden-2026-10-27`, 207 checks):

- **Known answers for the primitives**: the two PBKDF2-HMAC-SHA-256 vectors of [RFC 7914](https://www.rfc-editor.org/rfc/rfc7914), section 11; seven AES-GCM encryption vectors from NIST's Cryptographic Algorithm Validation Program file `gcmEncryptExtIV256.rsp` (AES-256, 96-bit IV, 128-bit tag; plaintexts of 0 to 408 bits, additional data of 0 to 720 bits), each also decrypted back; and two decryption vectors from `gcmDecrypt256.rsp`, one of which the file marks FAIL and the engine refuses.
- **The encoding**: the RFC 4648 section 10 strings, and seven strings the strict decoder must refuse.
- **Round trips** with fixed salts and IVs (the Example at 600,000 iterations; ASCII, Portuguese with line breaks and a tab, characters outside the Basic Multilingual Plane, a leading byte order mark; three spellings of one passphrase), each checked in both directions. Every expected string was first computed by a separate Python script (hashlib and the cryptography package) from the format as written here, not by the engine.
- **Refusals**: 35 decryption refusals (every format error, the iteration bounds, wrong passphrases, a changed ciphertext, tag, IV, salt and count, another string's ciphertext, and authentic bytes that are not UTF-8) and 11 encryption refusals, each with its code, and a check that no refusal carries any text.
- **Share results**: 5 strings a link may carry (compact, white space removed) and 9 texts it may not (a plaintext, a passphrase, truncated, another version, out-of-range counts, bad encodings, a passphrase appended as a sixth field).

## API

None, on purpose. The site's HTTP API runs tools on a server; this tool would have to receive a passphrase or a plaintext there, which is exactly what it exists not to do. It is listed among the tools excluded from the API, with that reason.

## Sources

- [NIST SP 800-38D, Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC, November 2007](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) (read 2026-10-27): sections 5.2.1, 7.1, 7.2, 8, 8.2.2 and 8.3. Its [CSRC page](https://csrc.nist.gov/pubs/sp/800/38/d/final) (read 2026-10-27) carries a planning note of 6 March 2024: NIST has decided to revise it.
- [NIST CAVP, GCM test vectors (gcmtestvectors.zip)](https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/mac/gcmtestvectors.zip) (read 2026-10-27): `gcmEncryptExtIV256.rsp` and `gcmDecrypt256.rsp`, CAVS 14.0
- [RFC 8018, PKCS #5: Password-Based Cryptography Specification Version 2.1](https://www.rfc-editor.org/rfc/rfc8018) (read 2026-10-27): sections 3, 4.1, 4.2, 5.2, 6.2 and 8; its four verified errata concern only the ASN.1 appendices, and RFC 9579 and RFC 9879 update it for PKCS #12 only
- [RFC 7914, The scrypt Password-Based Key Derivation Function](https://www.rfc-editor.org/rfc/rfc7914) (read 2026-10-27): section 11, the PBKDF2-HMAC-SHA-256 test vectors
- [OWASP Cheat Sheet Series, Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) (read 2026-10-27): PBKDF2, 600,000 iterations for PBKDF2-HMAC-SHA256
- [NIST SP 800-132, Recommendation for Password-Based Key Derivation, Part 1: Storage Applications, December 2010](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) (read 2026-10-27): sections 5.1 and 5.2, appendix A. Its [CSRC page](https://csrc.nist.gov/pubs/sp/800/132/final) carries a planning note of 11 May 2023: NIST is planning to revise it.
- [W3C, Web Cryptography API, Recommendation 26 January 2017](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/), and [Web Cryptography Level 2, First Public Working Draft 22 April 2025](https://www.w3.org/TR/WebCryptoAPI/), now served at the API's address (both read 2026-10-27): getRandomValues, AES-GCM, PBKDF2, the secure-context rule and the security considerations
- [RFC 4648, The Base16, Base32, and Base64 Data Encodings](https://www.rfc-editor.org/rfc/rfc4648) (read 2026-10-27): sections 3.2, 3.5, 5 and 10
- [RFC 8265, Preparation, Enforcement, and Comparison of Internationalized Strings Representing Usernames and Passwords](https://www.rfc-editor.org/rfc/rfc8265) (read 2026-10-27): section 4.2.2
- [RFC 3629, UTF-8, a transformation format of ISO 10646](https://www.rfc-editor.org/rfc/rfc3629) (read 2026-10-27)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-27): section 3.5, the fragment
- [NIST SP 800-63B-4, Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html) (read 2026-10-27): appendix A, Strength of Passwords
- [Google Chrome Help, Turn Chrome spell check on and off](https://support.google.com/chrome/answer/12027911?hl=en) (read 2026-10-27), and the [HTML Standard, section 6.8.5, Spelling and grammar checking](https://html.spec.whatwg.org/multipage/interaction.html) (read 2026-10-27)

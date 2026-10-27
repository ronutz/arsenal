## What it does

This is a two-way codec for five text encodings. Enter text and it returns the Base64, URL-safe Base64, Base32, hexadecimal, and percent-encoded forms at once; enter an encoded string and it decodes back to text. Decoding is tolerant: missing padding and stray whitespace are accepted, and when a decoded byte stream is not valid UTF-8 text, the result is flagged as binary rather than shown as broken characters. Everything runs in your browser; nothing is uploaded.

## The five encodings

All five map between text (as bytes) and an ASCII-safe representation, each defined by a standard:

- **Base64** (RFC 4648, section 4) uses the alphabet `A-Z a-z 0-9 + /` and pads with `=`. It grows data by about a third and is the encoding behind HTTP Basic credentials, `base64(user:password)`, defined in RFC 7617.
- **URL-safe Base64** (RFC 4648, section 5) swaps `+` and `/` for `-` and `_` and usually drops the `=` padding, so the string is safe inside URLs and filenames. It is the encoding each segment of a JWT uses.
- **Base32** (RFC 4648, section 6) uses `A-Z 2-7` and pads with `=`. It is case-insensitive and avoids easily-confused characters, which is why it shows up in places like TOTP secrets.
- **Hexadecimal (Base16)** (RFC 4648, section 8) uses `0-9 A-F`, two characters per byte.
- **Percent-encoding** (RFC 3986, section 2) keeps the unreserved set (`A-Z a-z 0-9 - . _ ~`) as-is and encodes every other byte as `%XX`. This is URL encoding.

## Padding, whitespace, and binary results

Base64 and Base32 are normally padded with `=` to a whole number of blocks, but real-world strings often arrive with the padding stripped or with line breaks inserted, so the decoder accepts both. When you decode a value whose bytes do not form valid UTF-8 text (a compressed blob, an image, a raw key), the tool tells you the result is binary instead of rendering it as broken text, so you know the decode worked even though the payload is not human-readable.

## Worked examples

- The text `hello` becomes Base64 `aGVsbG8=`, URL-safe Base64 `aGVsbG8`, Base32 `NBSWY3DP`, hex `68656c6c6f`, and percent-encoding `hello` (all of its characters are unreserved).
- Decoding the Base64 value `dXNlcjpwYXNz`, a typical HTTP Basic credential, returns `user:pass`.

## Using it

Enter text to see all five encodings side by side, or paste an encoded value to decode it. Because the codec is a pure function of its input, the same text always produces the same output.

## Share results

Under the output, **Share results** builds a link to this page, only when you press it, that carries the text in the box as you typed it, after the `#`, with the direction, the codec and the number of layers when they differ from the defaults (Encode, Base64, one layer): `/tools/base64#text=dXNlcjpwYXNz&direction=decode`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

Encoded text often hides a credential: HTTP Basic sends `user:password` in Base64 ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), section 2, read 2026-10-27). So the popover adds a caution line of this tool's own before you copy anything. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the text is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The direction, the codec and the layers are set and the text fills the box as a paste would; the page computes every encoding as usual. A direction or a codec the page does not offer, or layers outside 1 to 3, makes the whole link ignored. Either way the values leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
- **Links from other pages.** A value handed over as `#input=` still fills the box exactly as before. Share results uses names of its own (`text`, `direction`, `codec`, `layers`), so the two never mix.

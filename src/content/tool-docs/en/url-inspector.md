## What it does

Dissect any URL into its named parts: the scheme, the host, the port, the path, the individual query parameters, and the fragment. It decodes percent-escapes and internationalized (punycode) hostnames, flags embedded credentials and other issues, and shows the scheme's default port. Everything runs in your browser.

## The parts of a URL

A URL has a defined grammar, set out in RFC 3986, and the tool splits a URL into its top-level components: the **scheme** (such as `https`), the **authority** (which holds any userinfo, the **host**, and the **port**), the **path**, the **query**, and the **fragment**. It then breaks the query string into individual parameters and percent-decodes each one, so a long query becomes a readable list of name-and-value pairs rather than one opaque string. Following the WHATWG URL Standard, it treats a `+` in a form-encoded query as a space.

## Parsed as written, not normalized

An important design choice: the tool parses the URL exactly as you gave it and does not silently normalize it. That matters because the differences a browser would quietly smooth over are often exactly what you are trying to see: an unexpected port, a doubled slash, a stray encoded character. Showing the URL as written is what makes it useful for debugging and for spotting something suspicious.

## Decoding and flagging

Two things in particular the tool surfaces:

- **Internationalized hostnames.** A host label in punycode form (beginning `xn--`) is decoded back to its Unicode text (RFC 3492 and the IDNA framework of RFC 5890), so you can see the actual name, which also helps reveal look-alike domain tricks.
- **Embedded credentials.** A URL can carry a username and password in the `user:pass@host` form, and the tool flags this, because credentials in a URL are a common mistake and a security concern.

## Using it

Paste a URL and read its scheme, host, port, path, decoded query parameters, and fragment, with any credentials or other issues flagged. The parse is deterministic and local, so it is safe to inspect any URL, including one you do not want to visit.

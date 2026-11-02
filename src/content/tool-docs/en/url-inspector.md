## What it does

Dissect any URL into its named parts: the scheme, the host, the port, the path, the individual query parameters, and the fragment. It decodes percent-escapes and internationalized (punycode) hostnames, flags embedded credentials and other issues, and shows the scheme's default port. Everything runs in your browser.

## The parts of a URL

A URL has a defined grammar, set out in RFC 3986, and the tool splits a URL into its top-level components: the **scheme** (such as `https`), the **authority** (which holds any userinfo, the **host**, and the **port**), the **path**, the **query**, and the **fragment**. It then breaks the query string into individual parameters and percent-decodes each one, so a long query becomes a readable list of name-and-value pairs rather than one opaque string. Following the WHATWG URL Standard, it treats a `+` in a form-encoded query as a space.

## Parsed as written, not normalised

An important design choice: the tool parses the URL exactly as you gave it and does not silently normalise it. That matters because the differences a browser would quietly smooth over are often exactly what you are trying to see: an unexpected port, a doubled slash, a stray encoded character. Showing the URL as written is what makes it useful for debugging and for spotting something suspicious.

## Decoding and flagging

Two things in particular the tool surfaces:

- **Internationalized hostnames.** A host label in punycode form (beginning `xn--`) is decoded back to its Unicode text (RFC 3492 and the IDNA framework of RFC 5890), so you can see the actual name, which also helps reveal look-alike domain tricks.
- **Embedded credentials.** A URL can carry a username and password in the `user:pass@host` form, and the tool flags this, because credentials in a URL are a common mistake and a security concern.

## Using it

Paste a URL and read its scheme, host, port, path, decoded query parameters, and fragment, with any credentials or other issues flagged. The parse is deterministic and local, so it is safe to inspect any URL, including one you do not want to visit.

## Share results

Under the anatomy strip, **Share results** builds a link to this page, only when you press it, that carries the URL after the `#` with its password and any token parameter replaced by `REDACTED`, never as typed: the anatomy strip shows the whole URL, password included. Its popover says first what the link carries and how many values were replaced, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

What is replaced:

- **The password in the userinfo**, the text after its first colon: [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1, says applications "should not render as clear text any data after the first colon". The user name stays.
- **Query and fragment parameters** named like a secret: `access_token` in a query ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), section 2.3) or in a fragment, where an implicit grant returns it ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), section 4.2.2); `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), section 4.1.2); `X-Amz-Signature` and `X-Amz-Security-Token` whole, and of `X-Amz-Credential` only the access key ID, so the credential scope after it (the date, the Region and the service) still reads, which is what a failing presigned URL usually comes down to ([Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html), read 2026-11-01); `sig` ([Create a service SAS](https://learn.microsoft.com/en-us/rest/api/storageservices/create-service-sas), read 2026-11-01); `key` ([Use API keys to access APIs](https://cloud.google.com/docs/authentication/api-keys-use), read 2026-11-01); and any name ending in token, secret, password or api key.

The host, the port, the path and every other parameter go as typed, and the tool's share vectors check that the page that opens the link reads the same parts. A note that was only about a replaced value (a percent-escape or a `+` inside it) goes with it. If a key or token is left where no name marks it (a JWT in the path), there is no link, and the popover says so.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the copy is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the field as a paste would and the page dissects it. As with every `#input=` link into this page, the value stays in the address until you edit the field.

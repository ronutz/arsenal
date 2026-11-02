## What it does

Paste a User-Agent string and the tool breaks out the identifying tokens it carries - browser and version, rendering engine, operating system and version, device class, and CPU architecture - estimates the distinguishing bits each contributes, and flags whether the string is in the reduced, frozen form modern browsers now send.

## The point it makes

A User-Agent is a small pile of entropy. No single token identifies you, but together they narrow the field, and the more detailed the string, the more distinguishing it is. The tool shows that surface honestly. The bit figures are illustrative, drawn from published fingerprinting research, not a live measurement of any population - the goal is to make the shape of the surface visible, not to score you.

## Where the detail went

Modern browsers freeze the User-Agent: Chromium fixes the minor version to 0.0.0 and caps platform detail, and Safari long ago pinned much of its string. The detail did not disappear - it moved to User-Agent Client Hints (Sec-CH-UA and friends), which a site must actively request through the Accept-CH header. The consequence is that high-entropy collection is now visible in headers rather than implicit in one string. Decode/explain only: the input is a string you paste, nothing is read from your own browser and nothing is sent.

## Share results

Under the summary, **Share results** builds a link to this page, only when you press it, that carries the User-Agent as typed (`input`) after the `#`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

A User-Agent string names a browser, an engine and an operating system, and every server a browser talks to already receives it. But the box takes several lines, and a whole request copied from devtools reads as a User-Agent too, so before a link is offered the text goes through the site's secrets check: a value that is a credential by its format (a `Cookie` line, [RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1; Authorization credentials, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2; a JWS or JWE; a password in a URL; a PEM private key; an AWS access key ID) means no link, and the popover names its line. Paste the User-Agent alone and press again. A value whose name only looks like a secret still gets a link, with a line naming it.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the text is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The text fills the box as a paste would and the page analyses it; nothing is sent. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

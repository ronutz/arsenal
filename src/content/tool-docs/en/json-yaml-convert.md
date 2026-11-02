## What it does

Convert a document between JSON and YAML in either direction, in your browser. Going from JSON it produces block-style YAML; going from YAML it produces JSON. When a parse fails, the error names the exact line and column, and when a conversion loses something along the way, a note explains what and why.

## The two directions

- **JSON to YAML.** The JSON is first validated by the same precise, position-tracking parser the JSON formatter uses, so an invalid document is rejected with a line, column, and JSON Pointer path rather than a vague failure. The valid data is then written as block-style YAML.
- **YAML to JSON.** The YAML is parsed under a JSON-compatible schema and serialized to JSON. Anchors and aliases (YAML's `&name` and `*name` reuse mechanism) are expanded inline, and block scalars (YAML's multi-line string styles) become ordinary JSON strings.

## The quoting traps it handles

YAML is famously willing to read a bare word as something other than a string, which is where round-trips go wrong. The best-known case is the "Norway problem": the bare word `NO` is read as the boolean false, and the same happens to `yes`, `on`, and `off`, and to values like `1.0` (a number, not the string "1.0") and `08` (which is not valid octal). When emitting YAML, the converter quotes these values so that what you meant as a string survives as a string.

## What conversion can lose

Some things exist in one format but not the other, so the notes flag them:

- **Comments.** YAML has comments and JSON does not, so comments are dropped when converting YAML to JSON.
- **Anchors and aliases.** These are expanded to their full value, so a compact shared reference in the source YAML becomes repeated data in the output.

## Worked examples

- JSON `{"port":8080,"tls":true}` becomes the YAML lines `port: 8080` and `tls: true`.
- YAML `country: NO` becomes JSON `{"country":"NO"}` on the way in, and when that is emitted back to YAML the value is quoted as `country: "NO"` so it is not mistaken for false.

## Using it

Paste JSON to get YAML, or YAML to get JSON. Read the conversion notes when they appear: they tell you whether anything, such as a comment or an anchor, changed in a way you should be aware of. The conversion is deterministic for a given input.

## Share results

First in the reading (or under a parse error, which is an answer too), **Share results** builds a link to this page, only when you press it, that carries after the `#` the source as pasted, the direction and the indent. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. Configuration often holds passwords, keys and internal names, so the popover asks you to read it before you send the link. The text goes as pasted: the converted output shows every value. Before a link is offered, the text is searched for a credential a standard defines: a PEM private key, an `Authorization` or `Proxy-Authorization` line with any scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"), a `Cookie` or `Set-Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1 and 4.2.1), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1: the "user:password" form "is deprecated"), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret (a key `password:` or `apiKey`) does not block the link; the popover names the first one so you can check it. Five member and key names count as credentials here, because a standard defines what they hold: `access_token` and `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sections 1.4, 1.5 and 5.1: "Access tokens are credentials used to access protected resources"), `id_token` ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), section 3.1.3.3), `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), section 3.2.1) and `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), section 3); all read 2026-11-01. With a value, any of them means no link, as on the OIDC decoder.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The text fills the box and the choices are set as you would set them, and the page converts it. An unknown choice means the link is ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

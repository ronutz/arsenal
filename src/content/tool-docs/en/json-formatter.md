## What it does

Paste JSON and this tool validates it, then pretty-prints, minifies, or sorts it. What sets it apart from a plain `JSON.parse` is what it tells you when something is wrong or unusual: a parse error names the exact line, column, and path to the problem; repeated object keys are flagged; and very large or very precise numbers are preserved exactly rather than being rounded. Everything runs in your browser.

## A parser built for diagnostics

The engine is a hand-written parser that tracks position as it reads, rather than relying on the JavaScript runtime's built-in parse. That buys three things that matter in practice:

- **Precise errors.** When parsing fails, you get the line, the column, the byte offset, a plain-language message, and the JSON Pointer (RFC 6901) path to the location, instead of a single engine-dependent `SyntaxError` with no path.
- **Duplicate-key detection.** The JSON grammar technically permits an object to repeat a key, and `JSON.parse` silently keeps only the last one. That silent behaviour hides real bugs, so this engine reports every duplicate it finds, by path.
- **Exact large numbers.** JSON numbers have no size limit, but a JavaScript number is a 64-bit float and loses precision above 2^53. The formatter preserves the digits you wrote, so a 20-digit id or a high-precision decimal is not quietly rounded.

## Format, minify, and sort

Once the JSON is valid you can pretty-print it with consistent indentation, minify it to the smallest single-line form, or sort object keys so that two documents which differ only in key order line up for comparison. Sorting is by key and does not reorder arrays, whose order is significant in JSON.

## Worked examples

- `{"b":1,"a":2}` sorted by key becomes `{"a":2,"b":1}`.
- `{ "a": 1 }` minified becomes `{"a":1}`, with the whitespace removed.
- `{"id":10000000000000001}` keeps all its digits, whereas a round-trip through a 64-bit float would turn it into `10000000000000000`.
- `{"a":1,"a":2}` is flagged for the duplicate key `a`; a standard parser would silently keep `2`.

## Using it

Paste a JSON document and choose to format, minify, or sort it. If it does not parse, the error points at the exact spot; if it parses but has duplicate keys or oversized numbers, those are called out. The tool is a pure function of its input, so the same document always gives the same result.

For XML, the [XML formatter and validator](/tools/xml-formatter) does the same job: a well-formedness check that names the line and column, then pretty-print or minify.

## Share results

First in the reading (or under a parse error, which is a reading too), **Share results** builds a link to this page, only when you press it, that carries after the `#` the JSON as pasted and the three choices (pretty or minify, the indent, sorted keys). Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. JSON often holds passwords, keys and internal names, so the popover asks you to read it before you send the link. The text goes as pasted: the formatted output shows every value, so nothing can be replaced without changing what the reader sees. Before a link is offered, the text is searched for a credential a standard defines: a PEM private key, an `Authorization` or `Proxy-Authorization` line with any scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"), a `Cookie` or `Set-Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1 and 4.2.1), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1: the "user:password" form "is deprecated"), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret (a member `password` or `apiKey`) does not block the link; the popover names the first one so you can check it. Five member names count as credentials here, because a standard defines what they hold: `access_token` and `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sections 1.4, 1.5 and 5.1: "Access tokens are credentials used to access protected resources"), `id_token` ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), section 3.1.3.3), `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), section 3.2.1) and `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), section 3); all read 2026-11-01. With a value, any of them means no link, as on the OIDC decoder.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The text fills the box and the choices are set as you would set them, and the page formats it. An unknown choice means the link is ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

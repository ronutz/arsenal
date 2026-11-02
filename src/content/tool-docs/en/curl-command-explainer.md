## What it does

Paste a `curl` command and the tool explains it flag by flag, then translates it into four other forms: a browser `fetch` call, a raw HTTP request, an HTTPie command, and Python `requests` code. The command is tokenized and decoded in your browser; nothing is ever sent, and no request is run.

## One parse, five views

Under the hood there is a single step: the tool parses your `curl` command into one request model, capturing the method, the URL, the headers, the body, authentication, and the other options. Everything you see is derived from that one model. Because translating a command correctly already requires understanding every flag, the flag-by-flag explanation is just that same model shown with labels, which is why the explanation and the translations always agree.

## How it reads options

Every option curl gives an argument takes that argument here too, as curl reads it, so a value is never mistaken for the URL. The list is curl's own option table ([src/tool_getparam.c](https://raw.githubusercontent.com/curl/curl/master/src/tool_getparam.c), read 2026-11-01), checked against the [curl man page](https://curl.se/docs/manpage.html) (read 2026-11-01). The options that shape the request are explained one by one; any other is named with its argument. A few need more than a name:

- **`--oauth2-bearer`** is Bearer authentication ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), section 2.1): the translations send `Authorization: Bearer` and the token, unless an `Authorization` header is written with `-H`, which curl sends instead.
- **`-u user:password`** is Basic authentication, curl's default method ([curl manual](https://curl.se/docs/manpage.html), `--basic`, read 2026-11-01): the `fetch` and raw HTTP translations send `Authorization: Basic` and the Base64 of `user:password` ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), section 2, read 2026-11-01), HTTPie gets its own `-a user:password` and Python `requests` its own `auth=`. With `--digest`, HTTPie gets `-A digest` and `requests` its `HTTPDigestAuth` ([requests documentation](https://requests.readthedocs.io/en/latest/user/authentication/), read 2026-11-01). With the username only, curl prompts for the password, so `fetch` and raw HTTP carry no field and HTTPie's `-a user` prompts too. With `--digest`, `--ntlm`, `--negotiate`, `--anyauth` or `--aws-sigv4` no Basic field is written, because those methods answer a challenge or sign the request instead. An `Authorization` written with `-H`, or `--oauth2-bearer`, takes precedence.
- **`--json`** is, in the man page's words, a shortcut for `--data-binary`, `--header "Content-Type: application/json"` and `--header "Accept: application/json"`: the body is the JSON as typed, several `--json` pieces are joined with nothing between them, and a header written with `-H` replaces the one `--json` adds.
- **`--url-query`** adds its argument to the end of the URL's query, encoded as `--data-urlencode` encodes it, or as written when it starts with `+`; an argument read from a file (`name@file`) is named but cannot be added.
- **`-U` / `--proxy-user`, `-E` / `--cert`, `--proxy-cert`, `--pass`, `--proxy-pass`, `--tlspassword`, `--proxy-tlspassword`, `--httpsig-key` and `--ftp-account`** are explained without their secret: the user, or the certificate's file, is shown; a password, a passphrase, a key or account data is not.

## The forms it produces

- **curl explained.** Each option is named and described, so an unfamiliar flag stops being a mystery.
- **fetch.** The browser Fetch API call, following the MDN semantics, ready to drop into JavaScript.
- **Raw HTTP.** The actual request line, headers, and body as they would go on the wire, which is the clearest way to see exactly what a request is.
- **HTTPie.** The equivalent `http` command, for those who prefer that client.
- **Python requests.** The equivalent code using the Requests library.

## Why translate rather than run

The tool deliberately never executes the request. That is a privacy and safety choice: you can decode and convert a command that carries credentials or points at an internal host without any of it leaving your browser, and without triggering whatever the request would do. It is a translator and an explainer, not a client.

## Using it

Paste a `curl` command and read the flag-by-flag explanation and the four translations. The conversion is deterministic and local, so the same command always produces the same output.

The inverse tool is the [HTTP request translator](/tools/http-request-translator): paste a raw request and get a runnable command back. If you arrived here looking for that, it moved to the name it describes.

## Share results

Under the request line, **Share results** builds a link to this page, only when you press it, that carries the command after the `#` with every credential in it replaced by `REDACTED`, never as typed: a curl command pasted while debugging an API often holds one, and this page shows header values, cookies and, in the Python translation, a `-u` password in clear. Its popover says first what the link carries and how many values were replaced, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

What is replaced, each value where the [curl man page](https://curl.se/docs/manpage.html) (read 2026-11-01) or an HTTP standard defines it:

- **`-u` / `--user` and `-U` / `--proxy-user`**: the password ("The username and passwords are split up on the first colon"); the user stays.
- **`--oauth2-bearer`, `--pass`, `--proxy-pass`, `--tlspassword`, `--proxy-tlspassword` and `--ftp-account`**: the whole value; **`--httpsig-key`** too, unless it names a file with `@`. **`-E` / `--cert` and `--proxy-cert`**: the password after the certificate's first colon not written as `\:`.
- **`-H` / `--header` and `--proxy-header`**, by the field's name: `Authorization` and `Proxy-Authorization` keep their scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"); Basic keeps its user-id and loses the password ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), section 2); a JWT keeps its protected header and loses the claims and the signature ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1); an AWS Signature Version 4 credential (`AWS4-HMAC-SHA256`) keeps its credential scope and `SignedHeaders` and loses the access key ID and the signature ([Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html), read 2026-11-01); `Cookie` keeps its names; a field named like a secret (`X-API-Key`, `X-Auth-Token`) goes whole; a token inside any other value goes.
- **`-b` / `--cookie`**: every value of `NAME1=VALUE1; NAME2=VALUE2` ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1); a file name stays.
- **`-d` and the `--data` family, `--json`, `--url-query` and `-F`**: JSON members and `name=value` parameters whose name holds a secret: `access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sections 2.2 and 2.3), `refresh_token`, `client_secret`, `password` and `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sections 2.3.1, 4.1.2, 4.3.2 and 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), section 4.5), and any name ending in token, secret, password or api key. A `@file` stays.
- **The URL, `--url`, `-x` / `--proxy` and `-e` / `--referer`**: the password of a `user:password@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1) and the secret parameters of the query and the fragment; of `X-Amz-Credential`, only the access key ID. Any other option's argument is read the same way, so a `--preproxy` or a SOCKS host written with `user:password@` loses the password.

A value that is empty, a placeholder or a shell variable (`$TOKEN`) stays. Each replacement is written in place, so the copy keeps the paste's quotes, spacing and line continuations; a value written with escapes inside it is re-quoted whole. The tool's share vectors check that the page that opens the link reads the same request. If a key or token is left where no name marks it (a JWT in a URL path, a private key), there is no link: the popover names its line, and you put a placeholder there and press again.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the copy is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page explains it; nothing is sent or run. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

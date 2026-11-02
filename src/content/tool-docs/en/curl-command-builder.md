## What it does

Pick a protocol, fill in fields that adapt to it, and watch the exact `curl` command assemble live. Every flag the builder emits is explained underneath the command, and anything with a safety implication gets a warning: `-k`, cleartext protocols, a password placed on the command line, or `curl`'s form-encoded `-d` default when the body looks like JSON. Nothing is executed and nothing leaves the browser.

## All 27 protocols

The builder covers the full protocol list of the current `curl` tool as published on curl.se: DICT, FILE, FTP, FTPS, GOPHER, GOPHERS, HTTP, HTTPS, IMAP, IMAPS, LDAP, LDAPS, MQTT, MQTTS, POP3, POP3S, RTSP, SCP, SFTP, SMB, SMBS, SMTP, SMTPS, TELNET, TFTP, WS and WSS. Selecting a protocol opens a short explainer: what it is, its default port, and whether it runs in cleartext, inside TLS, or starts in cleartext with an upgrade path. The form then only shows what that protocol understands: HTTP gets methods, headers, bodies and forms; SMTP gets an envelope; MQTT gets a topic; FTP gets listing and upload; `file://` gets just a path.

## One table, one truth

The explainer panels and the command assembler read the same protocol capability table. That is deliberate: the text that teaches you what a protocol can do and the code that builds the command cannot drift apart, because they are the same data.

## Deterministic by construction

Identical inputs always produce a byte-identical command: flags are emitted in one canonical order, and values are quoted with POSIX single-quote escaping only when needed. Eleven golden vectors lock this behaviour, including the rule that `-d` implies POST (so no redundant `-X POST` is ever emitted) and the `'\''` escaping sequence. The quoting targets POSIX shells; a note in the tool says so, because cmd.exe and PowerShell play by different rules.

## The inverse of the translator

This tool writes `curl` commands; the [HTTP request translator](/tools/curl-command-explainer) reads them. Build a command here, or paste one there to have it explained flag by flag and translated to fetch, raw HTTP, HTTPie, and Python requests.

## Share results

Under the command box, **Share results** builds a link to this page, only when you press it, that carries the form after the `#`, each field by its own name (a form has no single text to paste), with the password and every credential replaced by `REDACTED`, never as typed. The button stays visible, disabled, until the form builds a command. Its popover says first what the link carries and how many values were replaced, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

What is replaced:

- **The password field**: the command still reads `-u user:REDACTED`, and the warning about a password on the command line stays.
- **Headers**, by name: `Authorization` and `Proxy-Authorization` keep their scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"); Basic keeps its user-id and loses the password ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), section 2); a JWT keeps its protected header and loses the claims and the signature ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1); `Cookie` keeps its names; a header named like a secret (`X-API-Key`) goes whole; a token inside any other value goes.
- **The cookie field**: every value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1). **A form field named like a secret** (`client_secret`): its value; a file field keeps its path. **The body**: JSON members and `name=value` parameters named like a secret (`access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sections 2.2 and 2.3), `refresh_token`, `client_secret`, `password` and `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sections 2.3.1, 4.1.2, 4.3.2 and 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), section 4.5), and any name ending in token, secret, password or api key).
- **The host, the proxy and the path**: a `user:password@` password ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1; curl reads one without a scheme too) and any secret query parameter.

Every other field goes as typed; defaults (https, GET, standard output, switches off) are left out of the link, and a tab typed into a one-line field travels as a space. The tool's share vectors check that the copy builds the same flags and warnings. If the command built from the copy still holds a key or token no name marks (a JWT in the path), there is no link, and the popover says so.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the form is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The whole form is replaced (a field the link does not carry is emptied) and the command is built; nothing is run or sent. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## What it does

Pick a protocol, fill in fields that adapt to it, and watch the exact `curl` command assemble live. Every flag the builder emits is explained underneath the command, and anything with a safety implication gets a warning: `-k`, cleartext protocols, a password placed on the command line, or `curl`'s form-encoded `-d` default when the body looks like JSON. Nothing is executed and nothing leaves the browser.

## All 27 protocols

The builder covers the full protocol list of the current `curl` tool as published on curl.se: DICT, FILE, FTP, FTPS, GOPHER, GOPHERS, HTTP, HTTPS, IMAP, IMAPS, LDAP, LDAPS, MQTT, MQTTS, POP3, POP3S, RTSP, SCP, SFTP, SMB, SMBS, SMTP, SMTPS, TELNET, TFTP, WS and WSS. Selecting a protocol opens a short explainer: what it is, its default port, and whether it runs in cleartext, inside TLS, or starts in cleartext with an upgrade path. The form then only shows what that protocol understands: HTTP gets methods, headers, bodies and forms; SMTP gets an envelope; MQTT gets a topic; FTP gets listing and upload; `file://` gets just a path.

## One table, one truth

The explainer panels and the command assembler read the same protocol capability table. That is deliberate: the text that teaches you what a protocol can do and the code that builds the command cannot drift apart, because they are the same data.

## Deterministic by construction

Identical inputs always produce a byte-identical command: flags are emitted in one canonical order, and values are quoted with POSIX single-quote escaping only when needed. Eleven golden vectors lock this behavior, including the rule that `-d` implies POST (so no redundant `-X POST` is ever emitted) and the `'\''` escaping sequence. The quoting targets POSIX shells; a note in the tool says so, because cmd.exe and PowerShell play by different rules.

## The inverse of the translator

This tool writes `curl` commands; the [HTTP request translator](/tools/http-request-translator) reads them. Build a command here, or paste one there to have it explained flag by flag and translated to fetch, raw HTTP, HTTPie, and Python requests.

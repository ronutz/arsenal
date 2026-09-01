## What it does

Paste a raw HTTP/1.1 request — the kind a capture, a proxy log or an RFC example gives you — and the tool turns it into the equivalent `curl` command, browser `fetch` call, HTTPie invocation, Python `requests` snippet and PowerShell one-liner. Everything is parsed in your browser; nothing is ever sent, and no request is run.

## The inverse of the curl explainer

The [curl command explainer](/tools/curl-command-explainer) goes one way: a command in, a raw request among its outputs. This tool goes the other: a raw request in, a runnable command out. The two exist because the directions are needed at different moments. A capture hands you a message; a terminal wants a command; a bug report wants both.

## How the URL is assembled

An ordinary request line carries only a path — `GET /users HTTP/1.1` — because the connection already knows the host. To produce something you can run anywhere, the tool joins that target to the `Host` header. Absolute-form targets, which proxies use, are already complete and are taken as they are. If `Host` is missing on an origin-form request the tool says so, because the URL would otherwise be a guess.

## Headers it deliberately drops

`Host`, `Content-Length` and `Connection` are not re-emitted. Every client sets them itself, and passing them through causes duplicated headers or, worse, a declared length that no longer matches the body the client will actually send.

## What it warns about

- **A `Content-Length` that disagrees with the body.** Servers and proxies may then disagree about where the message ends, which is the raw material of request smuggling.
- **A chunked body.** It is passed through as pasted rather than decoded; decoding transfer encodings is the job of a message decoder, not a translator.
- **Cleartext `http`.** Headers and body travel readable.
- **An `Authorization` header or a `Cookie`.** A captured request is usually a live credential, and this is the warning that matters most in practice: the paste you are about to put in a ticket may be a working session.

## Using it

Paste the request, read the parsed request line and headers, then copy whichever form you need. The conversion is deterministic and local, so the same request always produces the same output.

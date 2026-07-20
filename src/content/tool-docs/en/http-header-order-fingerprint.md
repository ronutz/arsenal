## What it does

Paste a raw HTTP request header block - a request line and one "Name: value" per line - and the tool explains how the order and casing of the headers fingerprint the client. It classifies the sender as a Chromium-family browser, Firefox, or an HTTP library by matching the header sequence and checking for browser-only headers like Sec-Fetch and Sec-CH-UA, notes the HTTP/2 lowercasing signal, and lists any common browser headers that are missing.

## The passive-HTTP analog of JA3

JA3 fingerprints a TLS client by the order of the ciphers and extensions in its ClientHello. Header order is the same idea one layer up: browsers, libraries, and bots each emit request headers in a characteristic sequence, and that sequence survives even when the values are spoofed. A request whose header order contradicts the User-Agent it claims - Chrome's UA with curl's header set - is a classic bot tell, which is why bot-detection and WAF systems key on it.

## Reading the result

The order hash is a short stable id for the exact header sequence, shown for display only. The per-header notes explain why each position matters; the casing note flags whether the block looks like an HTTP/1.1 capture (Title-Case) or an HTTP/2 one (lowercase on the wire). Decode/explain only; the headers you paste never leave your browser.

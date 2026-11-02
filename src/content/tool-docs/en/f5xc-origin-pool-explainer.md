## What it does

This tool decodes an F5 Distributed Cloud (XC) origin_pool spec. Paste the origin_pool object from the Console's JSON view, its spec body, or a create/get envelope, and it lays out what the pool actually does: every origin server's type and address, the pool port, the load-balancing algorithm and endpoint selection, the health checks it references, and the TLS-to-origin settings. It runs entirely in your browser.

## Origin servers: type and place

An origin pool can point at origins in several ways, and the tool names each one. A public IP or public DNS name reaches origins over the internet. An IP or DNS name "on given sites" reaches origins through a Customer Edge or Regional Edge and carries a site or virtual-site locator - the tool shows that location. K8s and Consul service names use service discovery on a site. There are also virtual-network and custom-endpoint variants. Each origin can also carry labels, which the tool lists.

## Where weights and priorities actually live

A common misconception is that origin servers in a pool have weights and priorities. They do not. Inside a pool, the origin servers are a flat list served according to the pool's algorithm. Weights and priorities are set one level up, on the pool's reference inside a route or the load balancer's default pools - each reference is a pool plus a weight plus a priority. The tool states this so you look in the right place.

## The pool port and endpoint selection

The port can be explicit, taken from the endpoint, or automatic - and automatic means 443 when TLS to origin is enabled and 80 when it is not. Endpoint selection controls which Regional Edge egresses to the origin: Local Preferred (the default) egresses from the local RE when it has a healthy origin entry, and otherwise forwards over the F5 global network to an RE that does. That is why the same origin can appear many times in the Console, once per RE.

## TLS to origin

If TLS to origin is enabled, the tool decodes the security level - reusing the same level data as the TLS security-level mapper, so High is minimum TLS 1.2 - along with the SNI mode (use the Host header, an explicit value, or no SNI), the server-verification choice, and whether mTLS is on. It flags the case that matters most: skipping origin-server verification. That still encrypts the connection, but it does not validate the origin's certificate, so the tool calls it out.

## Share results

Under the origin servers, **Share results** builds a link to this page, only when you press it, that carries a copy of the pool after the `#`, never the pool as pasted. A pool with mTLS to its origins holds the private key of each client certificate: "TLS Private Key data in unencrypted PEM format ... may be optionally secured using BlindFold" ([XC API reference for the origin pool](https://docs.cloud.f5.com/docs-v2/api/views-origin-pool), read 2026-11-01). F5 Distributed Cloud's schema marks them: SecretType, "used in an object to indicate a sensitive/confidential field", holds the secret either in clear (`clear_secret_info.url`: "For string:/// scheme, Secret needs to be encoded Base64 format") or encrypted by Blindfold (`blindfold_secret_info.location`). The page reads whether mTLS is on, never the key. So the copy replaces every SecretType secret with `[redacted]`, and keeps every other byte as pasted. Before the link is offered, the page reads the copy again and must give the same reading, or there is no link; then the copy is searched for a credential that is still there (a private key outside SecretType, an `Authorization` header matcher's value, a JWT, a password in a URL, read as in the site's other tools): one means no link, and the popover names its line; a value whose name only looks like a secret is named in the popover instead.

Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. It also says how many values were replaced, and that a pool names its origin servers, their addresses and sites. There is no switch to include the replaced values: a pool holds no header or cookie values, and the secrets the schema defines are never sent.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would, and the page reads it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

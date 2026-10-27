## What it does

Paste a tmsh `client-ssl` or `server-ssl` profile and the tool explains it: the profile's role, the matrix of TLS protocol versions it enables and disables, and a security read covering the certificate chain, renegotiation, SNI, OCSP stapling, and mutual TLS. It parses the profile entirely in your browser and never contacts a device.

## Client-side and server-side profiles

On a BIG-IP, SSL is handled by two kinds of profile, and the first thing the tool tells you is which one this is. A **client-ssl** profile terminates TLS coming from the client: the BIG-IP presents a certificate and decrypts the traffic. A **server-ssl** profile does the opposite: it initiates TLS toward the pool member, re-encrypting on the way out. A full-proxy TLS deployment uses both, decrypting from the client so it can inspect or steer the traffic, then re-encrypting to the server. Knowing the role frames everything else in the profile.

## The protocol matrix

Which TLS versions a profile allows is set by its `options` field, which enables or disables specific versions. The tool renders this as a clear matrix so you can see at a glance whether, for example, TLS 1.0 and 1.1, deprecated by RFC 8996, are still enabled, or whether TLS 1.3 is on. This is often the single most important thing to check on an SSL profile, and it is easy to misread in the raw `options` bitmask.

## The security read

Beyond protocols, the tool assesses the parts of the profile that decide how safe the TLS actually is:

- the **certificate, key, and chain**, including whether the chain is complete;
- **renegotiation**, and whether secure renegotiation (RFC 5746) is required;
- **SNI** (RFC 6066), for serving the right certificate when several names share the profile;
- **OCSP stapling** (the `status_request` extension, RFC 6066), which lets the server supply its own revocation proof; and
- **peer certificate validation**, which is how mutual TLS is configured, where the BIG-IP requires and checks a client certificate.

Each is rated so the risky settings stand out from the sound ones.

## Using it

Paste a `client-ssl` or `server-ssl` profile block and read its role, its protocol matrix, and the security assessment of its chain, renegotiation, SNI, OCSP, and mutual-TLS settings. The analysis is deterministic and local.

To check what a client actually negotiates with a virtual server that uses the profile, run `openssl s_client` against the virtual server and paste the output into the [openssl s_client explainer](/tools/openssl-s-client-explainer); the profile's cipher string is read by the [F5 cipher-string explainer](/tools/f5-cipher-string-expander).

## Share results

Under the profile's header, **Share results** builds a link to this page, only when you press it, that carries the profile after the `#` with the value of every `passphrase` and `proxy-ca-passphrase` setting replaced by `[redacted]`, never as pasted; F5's [client-ssl](https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_client-ssl.html) and [server-ssl](https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_server-ssl.html) references (read 2026-10-27) call these the key passphrase and the passphrase of the SSL Forward Proxy CA key. Its popover says first what the link carries and how many values were replaced, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

This page never shows those values either, so the receiving page reads the same profile. `passphrase none` stays, and so do names, partitions, file objects and host names. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the copy is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page explains it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

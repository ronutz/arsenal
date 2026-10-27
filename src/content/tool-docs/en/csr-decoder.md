## What it does

Decode a PKCS#10 certificate signing request and read what it contains: the subject name, the public key, the Subject Alternative Names and other extensions the requester is asking for, and any attributes. It parses the request's structure entirely in your browser and never contacts a certificate authority.

## What a CSR is, and what it is not

A CSR is the object you hand to a certificate authority when you ask it to issue a certificate. The important thing is that it is not a certificate. It has no serial number, no issuer, and no validity dates, because none of those have been decided yet. It carries only what the requester is asking for: a subject name, a public key, and optionally a set of requested extensions such as Subject Alternative Names. The whole request is signed with the private key that matches the public key inside it, which proves the requester actually holds that private key, a step called proof of possession.

## Requested, not granted

Reading a CSR tells you what was asked for, not what a CA will grant. A certificate authority is free to add, change, or drop what a CSR requests according to its own policy and the validation it performs, so the SANs and extensions you see here are a request, not a guarantee. This distinction matters when an issued certificate does not match the CSR: that is often the CA applying policy, not an error.

## What it decodes

The request is DER-encoded ASN.1 (the same tag-length-value encoding certificates use), and the decoder walks it into readable fields:

- the **subject** distinguished name;
- the **public key** and its algorithm and size;
- the **requested extensions**, carried in a PKCS#9 `extensionRequest` attribute, most importantly the Subject Alternative Names; and
- other **attributes** such as a challenge password or an unstructured name, where present.

It decodes structure only. It does not verify the request's self-signature, and because a CSR has no validity window, there is nothing time-relative to check.

## Using it

Paste a PKCS#10 CSR (the block between the CERTIFICATE REQUEST markers) and read its subject, key, requested SANs and extensions, and attributes. The parse is deterministic and local.

## Share results

Under the opening note, **Share results** builds a link to this page, only when you press it, that carries the box as you pasted it, after the `#`: `/tools/csr-decoder#input=-----BEGIN%20CERTIFICATE%20REQUEST-----...`. A request is what you send to a CA: a subject, a public key and the extensions asked for. Anything else in the box goes with it. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the request is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **No link in two cases.** When the box also holds a private key (a `-----BEGIN ... PRIVATE KEY-----` block, as some generators print the request and its key together), and when the request carries a challenge password, which this page shows in clear: the request is signed, so it cannot be shared without the password. The popover says which.
- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The link has the `#input=` form this page already reads, so opening it works exactly as those links always have: the value fills the box and decodes, and it stays in the address until you change or clear the box.

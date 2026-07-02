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

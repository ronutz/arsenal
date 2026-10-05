## What it does

Takes any number of X.509 certificates in PEM form, in any order, and does what a TLS client's path builder does before it checks a single signature: finds the end entity, follows each certificate to its issuer, and reports the chain a server should send, the certificates that are missing, the ones that are extra, and every structural rule of RFC 5280 path validation the chain breaks. The page then verifies each link's signature in your browser with WebCrypto and says so, separately, because the structural result is the same on every machine and the signature check depends on what the browser can do.

Paste the leaf, the intermediates, the root if you have it, an old cross-sign you are not sure about, the intermediate twice by accident; the page sorts it out and says what it did with each.

## How the chain is built

- **The end entity** is the certificate nobody else in the input issues and whose basicConstraints does not assert cA. With several such certificates the first is used and the others are reported; with none (an intermediate bundle on its own) the top-most CA is used and the page says so.
- **Each link** is made by Authority Key Identifier to Subject Key Identifier when both certificates carry one (RFC 5280 section 4.2.1.1: the key identifier exists "to facilitate certification path construction"), and by issuer name to subject name when one of them does not. A certificate with the right name but a different key is not an issuer; it is reported as a rolled-over CA, and the real issuer as missing.
- **Several possible issuers** (a cross-signed CA, or two certificates for the same key) are resolved in favour of the one whose validity covers the subject's start, and the alternatives are listed as extra.
- **The path ends** at a self-signed certificate (subject equals issuer and the key identifiers do not contradict it), or when the next issuer is not in the input. In the second case the missing issuer is named, with the key identifier the subject expects and the caIssuers URL the certificate carries, if any. The page does not fetch it.

## The rules it checks

Along the path, from the top down, the checks of RFC 5280 section 6.1.4 that need no cryptography:

- **(k) basicConstraints.** A version 3 issuer must carry the extension with cA TRUE. "If the cA boolean is not asserted, then the keyCertSign bit in the key usage extension MUST NOT be asserted" and the key "MUST NOT be used to verify certificate signatures" (section 4.2.1.9).
- **(n) keyUsage.** When the extension is present on an issuer, keyCertSign must be set.
- **(l) and (m) pathLenConstraint.** The value "gives the maximum number of non-self-issued intermediate certificates that may follow this certificate in a valid certification path"; the end entity "is not included in this limit", and zero means no intermediate may follow. The page counts from the top of the path down, skipping self-issued certificates, and names the CA whose limit was exhausted. A self-signed root at the top is the trust anchor, which is "not included as part of the prospective certification path" (section 6.1); its own constraint is used only as a starting bound.
- **Validity at an instant.** Every certificate on the path is judged at the instant chosen, your clock by default or a date you set, and reported expired or not yet valid. An issuer that expires before the certificate it issued is a warning with the date, because the chain stops validating on that day whatever the leaf says.
- **Algorithms.** A signature with SHA-1 or MD5 anywhere but on a self-signed root (whose own signature no validator checks) is flagged against the CA/Browser Forum Baseline Requirements, which sunset the last use of SHA-1 in certificates on 2026-09-15; an RSA key under 2048 bits is flagged against section 6.1.5 of the same document.
- **The end entity.** A server certificate without subjectAltName is flagged, since browsers match the host name against that extension only.

## The verdicts

- **Complete**: the path runs from the end entity to a self-signed certificate with every link made and no rule broken. Complete here means structurally complete; whether the root is trusted is a question for the client's store.
- **Complete, with warnings**: the same, with something worth reading first.
- **Chain ends at a CA whose issuer is not here**: the path is sound as far as it goes and stops at an intermediate whose issuer was not pasted. That is the normal shape of a TLS chain, since "a certificate that specifies a trust anchor MAY be omitted from the chain, provided that supported peers are known to possess any omitted certificates" (RFC 8446 section 4.4.2). If the missing issuer is in your clients' stores, nothing is missing; if it is itself an intermediate, add it.
- **Incomplete**: the path stops at the end entity. No client can build a chain from what is here; add the intermediates.
- **Invalid**: a rule above is broken. A conforming client rejects the chain.

## The chain to configure

The page re-encodes the certificates on the path from their bytes, 64-column base64, in the order RFC 8446 section 4.4.2 asks for: "The sender's certificate MUST come in the first CertificateEntry in the list. Each following certificate SHOULD directly certify the one immediately preceding it." The root can be included or left out; servers normally leave it out. Where the file goes depends on the server:

- **nginx**: one file, "the server certificate must appear before the chained certificates in the combined file"; the wrong order fails at start-up with a key values mismatch, because nginx tries the private key against the first certificate it finds.
- **Apache httpd 2.4.8 and later**: `SSLCertificateFile` "may also include intermediate CA certificates, sorted from leaf to root", which "obsoletes SSLCertificateChainFile".
- **F5 BIG-IP**: the intermediates are imported as a certificate object of their own (pasted "in sequence with no space between") and selected as the Chain of the certificate and key in the Client SSL or Server SSL profile; the leaf stays in its own object. F5's article adds that "putting the root CA certificate in the certificate bundle is optional, and will never cause the client to trust the root CA".

## What the page verifies cryptographically, and what it does not

Each link's signature is checked in the browser, against the issuer's public key shown in the table: RSASSA-PKCS1-v1_5 and RSASSA-PSS with SHA-1, SHA-256, SHA-384 or SHA-512, ECDSA on P-256, P-384 and P-521, and Ed25519 where the browser supports it. A self-signed root is checked against its own key, which proves the certificate is consistent, not that anyone trusts it. Anything the browser cannot do reads as not checked, never as failed.

Not done, and done by a validator: consulting a trust store, matching the host name against subjectAltName, evaluating name constraints, policy constraints and extended key usage along the path, and checking revocation. The CRL and OCSP pointers on the path are listed; none is contacted.

## Limits

- Up to 32 certificate blocks and 262,144 characters of input; PEM only (a DER file is converted by `openssl x509 -inform der -outform pem`).
- Names are compared as the single-line distinguished names the decoder prints, which is stricter than the RFC 5280 section 7.1 comparison in corner cases of string type and case; a chain that links only under those rules is reported as not linked.
- The instant is a date at 00:00 UTC when you set one, and your clock to the second when you do not.
- Browsers differ in what they do about a missing intermediate: some fetch it from the caIssuers URL just in time, Firefox preloads intermediates from Mozilla's CA database instead (since Firefox 75) and does not fetch. A chain that works in one browser and not another is usually this.

## Sources

- [RFC 5280: Internet X.509 Public Key Infrastructure Certificate and CRL Profile](https://www.rfc-editor.org/rfc/rfc5280) (read 2026-10-04): sections 4.2.1.1, 4.2.1.2, 4.2.1.3, 4.2.1.9, 6.1 and 6.1.4
- [RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3, section 4.4.2](https://www.rfc-editor.org/rfc/rfc8446#section-4.4.2) (read 2026-10-04)
- [CA/Browser Forum: Baseline Requirements for TLS Server Certificates, version 2.3.1](https://github.com/cabforum/servercert/blob/main/docs/BR.md) (read 2026-10-04): section 6.1.5 and the change log
- [RFC 9155: Deprecating MD5 and SHA-1 Signature Hashes in TLS 1.2 and DTLS 1.2](https://www.rfc-editor.org/rfc/rfc9155) (read 2026-10-04)
- [nginx: Configuring HTTPS servers, SSL certificate chains](https://nginx.org/en/docs/http/configuring_https_servers.html) (read 2026-10-04)
- [Apache HTTP Server 2.4: mod_ssl, SSLCertificateFile and SSLCertificateChainFile](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html) (read 2026-10-04)
- [F5 K13302: Configure the BIG-IP system to use an SSL chain certificate](https://my.f5.com/manage/s/article/K13302) (updated 2025-11-26, read 2026-10-04)
- [Mozilla: Intermediate CA Preloading](https://wiki.mozilla.org/Security/CryptoEngineering/Intermediate_Preloading) (read 2026-10-04)
- [Let's Encrypt: Chains of Trust](https://letsencrypt.org/certificates/) (read 2026-10-04): the hierarchy the example chain belongs to

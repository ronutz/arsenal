## What it does

Compute the exact TXT record you publish to pass an ACME dns-01 challenge. Paste the challenge token and your ACME account key, as a JWK or as its thumbprint, and it returns the `_acme-challenge` record name, the value to put in the TXT record, and the intermediate key authorization and thumbprint it was derived from. Everything runs in your browser using the native Web Crypto SHA-256; your key never leaves the page, and only its public members are used.

## Why dns-01 exists

ACME (RFC 8555) automates certificate issuance by challenging you to prove control of a domain. The dns-01 challenge does this through DNS: you publish a specific TXT record under the domain, and the CA looks it up. Unlike http-01, dns-01 needs no inbound connection to your server, so it works behind a firewall or load balancer, and it is the only challenge type that can validate a wildcard name.

## The computation

The record value is not arbitrary; the CA recomputes it from your account key, which is what ties the challenge to you. The chain is three steps. First, the SHA-256 thumbprint of your account public key is taken in the canonical form defined by RFC 7638, and base64url-encoded. Second, the key authorization is formed by joining the token and that thumbprint with a dot: `token.thumbprint`. Third, the TXT record value is the base64url of the SHA-256 digest of the key authorization. The record is published at `_acme-challenge.<domain>`; a wildcard such as `*.example.com` is validated under `_acme-challenge.example.com`.

## Only your public key is used

The RFC 7638 thumbprint is computed over just the required public members of the key: for an EC key the curve and the x and y coordinates, for an RSA key the modulus and exponent. Your private key is never needed to compute the record, so you should paste only the public JWK. If a full key is pasted, its private fields are ignored and never displayed.

## Using it

Enter the token from the challenge and your account key, and optionally the domain to see the full record name. Publish the returned value as a TXT record at `_acme-challenge.<domain>`, wait for it to propagate, then let your ACME client continue. The same token and key always produce the same value, so you can verify what your client is publishing against what this tool computes.

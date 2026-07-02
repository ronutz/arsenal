## What it does

Type text and get its SHA-1, SHA-256, SHA-384, and SHA-512 digests, each shown as hexadecimal and as Base64. The hashing is done by the browser's native Web Crypto (`crypto.subtle.digest`), not a bundled implementation, so the values match what any conformant platform produces. All four digests are computed at once, so switching which one you view never recomputes. Everything happens in your browser.

## What a cryptographic hash is

A cryptographic hash maps input of any length to a fixed-length digest, with a few defining properties: it is deterministic (the same input always gives the same digest), one-way (you cannot recover the input from the digest), and collision-resistant (it is infeasible to find two inputs with the same digest). Changing a single bit of input changes about half the output bits, so a digest reveals nothing about how similar two inputs are. The input here is hashed as its UTF-8 bytes.

## The four algorithms

All four are defined in FIPS 180-4, with reference code and test vectors also in RFC 6234. They differ in digest size:

- **SHA-1** produces 160 bits (40 hex characters). It is still widely seen but is broken for collision resistance, so it should not be used where an attacker could craft the inputs; it remains fine for checksums and for verifying against legacy systems.
- **SHA-256** produces 256 bits (64 hex characters) and is the modern default.
- **SHA-384** produces 384 bits (96 hex characters).
- **SHA-512** produces 512 bits (128 hex characters).

## Hex and Base64

The digest is a sequence of bytes; hex and Base64 are just two ways to write those same bytes. Hex uses two characters per byte and is the common form in most tools; Base64 is more compact and is what appears in places like Subresource Integrity attributes.

## Worked example

- The SHA-256 of `abc` is `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`, the standard test vector from the SHA specification.

## Using it

Type or paste text and read the four digests. Because a hash is one-way, this tool cannot turn a digest back into its input; recovering an input is only feasible when it had very little entropy, which the Hash Preimage Finder demonstrates.

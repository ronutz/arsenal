## What it does

Type text and get its SHA-1, SHA-256, SHA-384, and SHA-512 digests, each shown as hexadecimal and as Base64. The hashing is done by the browser's native Web Crypto (`crypto.subtle.digest`), not a bundled implementation, so the values match what any conformant platform produces. All four digests are computed at once, so switching which one you view never recomputes. Everything happens in your browser. You can also hash a file instead of typed text: see Files below.

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

## Files

Choose a file with the file picker, or drop it anywhere on the tool, and the four digests are computed over the file's bytes exactly as they are on disk. Your browser reads the file on your device through the File API (`Blob.arrayBuffer()`) and hands the bytes to Web Crypto. Nothing is uploaded: the file view makes no network request at all. The drop zone is also a button, so the keyboard reaches it with Tab and opens the file picker with Enter or Space.

- **What is shown.** The file's name, size and type appear as your browser reports them. The browser leaves the type empty when it cannot determine it, and the type plays no part in the digests: only the bytes are hashed, so renaming a file changes none of them.
- **A file is its bytes.** A text file saved with a byte-order mark or with Windows line endings (CRLF) hashes differently from the same words typed in the text box, because those bytes are part of the file. `hi` typed in the text box and `hi` saved with a UTF-8 byte-order mark and CRLF (the seven bytes `EF BB BF 68 69 0D 0A`) give two different SHA-256 digests.
- **The size limit: 256 MiB.** Web Crypto's `digest()` takes the whole message in one call and begins by copying it; there is no streaming form. Hashing a file with it therefore means holding every byte in memory, plus a second copy while each digest runs. The tool hashes files up to 256 MiB (268,435,456 bytes), runs the four algorithms one after another so that only one copy exists at a time (a peak of about twice the file), and refuses a larger file with a message before reading any of it. The limit is a conservative choice, not a number the platform sets. While it works, a status line names the algorithm running, for example "SHA-384, 2 of 4".
- **Larger files.** Use your operating system's own command: `sha256sum` from GNU coreutils on Linux (also `sha1sum`, `sha384sum`, `sha512sum`), or `Get-FileHash` in PowerShell, whose default algorithm is SHA-256.
- **Comparing with a published checksum.** Hexadecimal digests do not depend on letter case: `Get-FileHash` prints upper case and this tool prints lower case, so compare the characters and ignore the case. Given a list of published checksums, `sha256sum --check` (`-c`) compares every file named in it for you.
- **An empty file.** A file of zero bytes has the well-known empty-input digests (SHA-256 `e3b0c442…7852b855`), and the tool says so. VirusTotal's documentation makes the point that a file you know is not empty showing this digest means something stopped it from being read.
- **When reading fails.** If the browser cannot read the file (it was moved, deleted, changed or locked by another program after you chose it, the cases the File API lists), the tool shows the browser's error name and asks you to choose the file again. A file whose size changes during the read is reported the same way. Nothing stops silently.

## Looking a file up at VirusTotal

Under a file's digests is a link, **Look up this SHA-256 at VirusTotal**. It opens, in a new tab, the address VirusTotal documents for the most recent report on a file, `https://www.virustotal.com/gui/file/<SHA-256>/detection`, with the file's SHA-256 in place of `<SHA-256>`; the other three digests are never placed in a link. Following the link sends the hash, not the file, to VirusTotal. The tool itself sends nothing; the link is an ordinary one that only you can choose to follow, and it carries no referrer (`rel="noopener noreferrer"`), so VirusTotal is not told which page you came from. What VirusTotal shows, and what it does with the lookup, is under its own terms. VirusTotal documents the link as reaching the report on a file it has scanned: if no report exists, VirusTotal has not seen that file, which says nothing about whether the file is safe.

## Comparing with an expected hash

Below both views is a box, **Compare with an expected hash**. Paste the hash a download page publishes and the tool says whether it equals one of the four digests it has computed: the file's when a file is hashed, otherwise the text's. It reads the forms publishers use: bare hex in either case; hex written in byte pairs with spaces or colons; a line as `sha256sum` prints it (the checksum, a space, a space or an asterisk, the file name: what GNU Coreutils calls the untagged format); a tagged line such as `SHA256 (file.iso) = …`; a value labelled `sha256:` (the form OCI image digests take: the algorithm, a colon, the encoded value); and Base64, standard or URL-safe, padded or not, including a Subresource Integrity value such as `sha384-…` (the algorithm, a hyphen, the Base64 value). When the value carries an algorithm label, only that algorithm is compared, so a value labelled SHA-512 never matches a SHA-256 by accident. A match names the algorithm and the encoding. No match says whether the value at least has the length of one of the four digests, which usually means the bytes hashed here are not the ones the hash was published for, or the hash was copied wrongly. An MD5, 32 hex characters, is none of the four and never matches. Nothing is hashed again and nothing is sent: the comparison is between strings already on the page.

## Worked example

- The SHA-256 of `abc` is `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`, the standard test vector from the SHA specification.
- With `abc` typed, pasting `sha256-ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=` into the compare box gives a match: the SHA-256 of the text, in Base64.

## Using it

Type or paste text and read the four digests, or choose or drop a file and read the digests of its bytes. Because a hash is one-way, this tool cannot turn a digest back into its input; recovering an input is only feasible when it had very little entropy, which the [Hash Preimage Finder](/tools/hash-preimage-finder) demonstrates.

## Sources

- [W3C File API (Working Draft, 12 September 2026)](https://www.w3.org/TR/FileAPI/): [Blob size and type](https://www.w3.org/TR/FileAPI/#attributes-blob), [arrayBuffer()](https://www.w3.org/TR/FileAPI/#arraybuffer-method-algo), [the File interface](https://www.w3.org/TR/FileAPI/#file-section) and [Errors and Exceptions](https://www.w3.org/TR/FileAPI/#ErrorAndException) (read 2026-10-27)
- [W3C Web Cryptography Level 2, 14.3.5 The digest method](https://www.w3.org/TR/webcrypto/#SubtleCrypto-method-digest) and [32 SHA](https://www.w3.org/TR/webcrypto/#sha) (the published draft; the editor's draft of 22 October 2026 has the same steps) (read 2026-10-27)
- [WHATWG HTML: the File Upload state (input type=file)](https://html.spec.whatwg.org/multipage/input.html#file-upload-state-(type=file)), [the DataTransfer interface](https://html.spec.whatwg.org/multipage/dnd.html#the-datatransfer-interface) and the link types [noopener](https://html.spec.whatwg.org/multipage/links.html#link-type-noopener) and [noreferrer](https://html.spec.whatwg.org/multipage/links.html#link-type-noreferrer) (read 2026-10-27)
- [VirusTotal: How can I link to the most recent report on a given file or URL?](https://docs.virustotal.com/docs/most-recent-report) and [Empty file and VirusTotal uploads](https://docs.virustotal.com/docs/empty-file) (read 2026-10-27)
- [GNU Coreutils manual: sha2 utilities](https://www.gnu.org/software/coreutils/manual/html_node/sha2-utilities.html) and [cksum common options (--check)](https://www.gnu.org/software/coreutils/manual/html_node/cksum-common-options.html) (the manual of Coreutils 9.12, the current release; read 2026-10-27)
- [Microsoft Learn: Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash?view=powershell-7.6) (the reference for PowerShell 7.6, the current long-term-servicing release; read 2026-10-27)
- [W3C Subresource Integrity](https://www.w3.org/TR/sri/), 3.5 The integrity attribute (the grammar `hash-expression = hash-algorithm "-" base64-value`) (read 2026-10-27)
- [GNU Coreutils manual: cksum output modes](https://www.gnu.org/software/coreutils/manual/html_node/cksum-output-modes.html) (the tagged and untagged formats; Coreutils 9.12; read 2026-10-27)
- [OCI Image Format Specification: Descriptor](https://github.com/opencontainers/image-spec/blob/main/descriptor.md), section Digests (`digest ::= algorithm ":" encoded`) (read 2026-10-27)
- [RFC 6234: US Secure Hash Algorithms](https://www.rfc-editor.org/rfc/rfc6234) (its test messages are among the tool's file vectors; read 2026-10-27)

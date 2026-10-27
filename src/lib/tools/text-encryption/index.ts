// ============================================================================
// src/lib/tools/text-encryption/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for local text encryption:
// the reader encrypts their own text with their own passphrase and decrypts it
// again, in the browser, with the Web Cryptography API (PBKDF2-HMAC-SHA-256,
// then AES-256-GCM). Nothing is stored, nothing is sent, and the page writes
// nothing to its address. Since 2026-10-27 a "Share results" button builds,
// only when pressed, a link that carries the encrypted string alone (spec in
// share.ts); the passphrase and the plaintext never reach a link. Built under the reading of D-49's "never decrypt" recorded in the
// canon on 2026-10-26 (DECISION-D49-decrypt-scope-20261026): the rule is aimed
// at other people's data; this tool only opens what the reader sealed with a
// passphrase the reader holds, and it guesses or cracks nothing.
//
// API: EXCLUDED (registry API_EXCLUDED, D-72). An endpoint would have to
// receive a passphrase or a plaintext, which is exactly what this tool exists
// not to send anywhere. run() exists for the tool shape and only reads the
// fields of an encrypted string, with no passphrase and no cryptography.
//
// Every source below was downloaded with curl on 2026-10-26 and again on
// 2026-10-27 (generic User-Agent, no-cache headers, a cache-busting query),
// answering HTTP 200 both times with the same content; the files and the
// status log are in the build's work folder.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, PBKDF2_VECTORS, GCM_ENCRYPT_VECTORS, GCM_DECRYPT_VECTORS, ROUND_TRIP_VECTORS, DECRYPT_REJECT_VECTORS, ENCRYPT_REJECT_VECTORS, SHARE_ACCEPT_VECTORS, SHARE_REJECT_VECTORS, DETECTOR_EXAMPLE } from "./golden-vectors"; // the vectors

// The engine, re-exported for the component and the registry.
export {
  encryptText, // seal a text
  decryptText, // open a string
  parseEnvelope, // read a string's fields
  passphraseFacts, // counts for the passphrase note
  preparePassphrase, // RFC 8265 mapping
  run, // the API-shaped entry point (fields only)
  FORMAT_VERSION, // "aesgcm1"
  DEFAULT_ITERATIONS, // 600,000
  MIN_ITERATIONS, // 1,000
  MAX_ITERATIONS, // 10,000,000
  SALT_BYTES, // 16
  IV_BYTES, // 12
  TAG_BYTES, // 16
  MAX_TEXT_BYTES, // 1 MiB
  MAX_PASSPHRASE_CHARS, // 1,024
  MAX_INPUT_CHARS, // 2,000,000
} from "./compute"; // values
export type { EncryptResult, DecryptResult, ParseResult, Envelope, PassphraseFacts, TextEncryptionError, TextEncryptionErrorCode, TextEncryptionNote } from "./compute"; // types
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, EXAMPLE_TEXT, EXAMPLE_PASSPHRASE, EXAMPLE_ENCRYPTED, verifyVectors } from "./golden-vectors"; // the Example and the runner

/** The D-49 declarative manifest for local text encryption. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Hashing", // must equal the catalogue family (D-73); the family of hash and hmac, the other Web Crypto tools
  toolSlug: "text-encryption", // the route segment
  canonicalAliases: [
    "encrypt text", // the obvious search
    "decrypt text", // the other direction
    "aes-gcm encrypt", // the cipher by name
    "password encrypt text", // how people say it
    "passphrase encryption", // the precise name
    "pbkdf2 aes", // the construction
  ],
  inputDetectors: [
    {
      // A string this tool wrote: the tag, a count of one to eight digits, a 22-character salt, a 16-character IV and
      // at least a tag's worth of ciphertext. Anchored, fixed tag, bounded classes: linear (ReDoS-safe). The paste box
      // only links to the tool; it never hands the string over.
      kind: "regex",
      pattern: "^\\s*aesgcm1\\.[1-9][0-9]{0,7}\\.[A-Za-z0-9_-]{22}\\.[A-Za-z0-9_-]{16}\\.[A-Za-z0-9_-]{22}",
      priority: 0, // the tag is unmistakable
      example: DETECTOR_EXAMPLE, // golden vector ascii-floor
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly", "sensitiveArtifact"], // Web Crypto in the page; the input is a secret and a plaintext by definition
  apiCapabilityClass: "local-equivalent", // the class of the computation; the tool is in API_EXCLUDED, so no endpoint exists

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount:
    PBKDF2_VECTORS.length + GCM_ENCRYPT_VECTORS.length + GCM_DECRYPT_VECTORS.length + ROUND_TRIP_VECTORS.length + DECRYPT_REJECT_VECTORS.length + ENCRYPT_REJECT_VECTORS.length + SHARE_ACCEPT_VECTORS.length + SHARE_REJECT_VECTORS.length, // known answers, round trips, refusals and the share vectors
  dangerousInputHandling: [
    "secret-redaction", // the passphrase fields are masked until the reader chooses Show (as hmac, pkce and totp-hotp)
    "web-crypto-only", // every primitive is the browser's Web Cryptography API; no cipher is written here
    "randomness-from-ui", // salt and IV come from crypto.getRandomValues in the component; the engine is deterministic
    "no-storage", // nothing is written to storage, the address, the fragment or a log
    "share-ciphertext-only", // Share results builds a link carrying the encrypted string alone, never the passphrase or the plaintext (2026-10-27)
    "arrival-validated", // an arriving #input= is accepted only as a well-formed string of this format, opens Decrypt mode, never decrypts by itself, and leaves the address either way
    "authenticated-or-nothing", // a tag failure returns no text at all
    "header-authenticated", // version, count, salt and IV are the AAD
    "iteration-bounds", // 1,000 to 10,000,000 (SP 800-132): a crafted string cannot run for minutes
    "length-bound", // 1 MiB of text, 1,024 passphrase characters, 2,000,000 input characters
    "strict-base64url", // canonical encoding only (RFC 4648, section 3.5)
    "redos-guard", // every pattern anchored or a single class run
  ],
  // Stricter than "fragment" (the floor build spec 9.1 sets for a sensitiveArtifact tool): the text and the passphrase
  // never go into a link, not even into the fragment; the same value code-to-image and python-traceback-explainer use.
  // The default share (the page's own Share button) carries no data; the explicit Share results button is the
  // charter's "with data" choice (section 6.4, D-27 c) and carries a derived form only: the encrypted string.
  shareSafetyDefault: "never",

  // -- Teaching & provenance --
  // The tool's own article first; then the articles that link to it (AEAD and the password hash guide).
  learnLinks: ["learn/passphrase-encryption-in-the-browser", "learn/aead-vs-cbc", "learn/choosing-a-password-hash"],
  sources: [
    {
      id: "nist-sp800-38d", // the cipher mode
      label: "NIST SP 800-38D, Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC, November 2007: sections 5.2.1, 7.1, 7.2, 8, 8.2.2 and 8.3", // what the engine applies
      type: "standard", // NIST Special Publication
      url: "https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf", // fetched 2026-10-26 and 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read again the day the build was finished (first read 2026-10-26)
      scope: "96-bit IVs recommended (5.2.1.1); tag lengths, 128 the largest (5.2.1.2); authenticated encryption and decryption, P or FAIL (7.1, 7.2); the IV uniqueness requirement, no greater than 2^-32 (8); the RBG-based IV construction, random field at least 96 bits (8.2.2); with random IVs, at most 2^32 invocations per key (8.3). The CSRC page (read the same day) shows a planning note of 2024-03-06: NIST has decided to revise it", // what it pins
      status: "active", // final; a revision is planned
    },
    {
      id: "nist-cavp-gcm", // the cipher's known answers
      label: "NIST CAVP, GCM test vectors (gcmtestvectors.zip, CAVS 14.0): gcmEncryptExtIV256.rsp and gcmDecrypt256.rsp", // the files used
      type: "reference", // test vectors
      url: "https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/mac/gcmtestvectors.zip", // fetched 2026-10-26 and 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read again the day the build was finished (first read 2026-10-26)
      scope: "seven encryption vectors (AES-256, 96-bit IV, 128-bit tag; plaintext 0, 104, 128 and 408 bits; AAD 0, 128, 160 and 720 bits) and two decryption vectors, one marked FAIL", // what the vectors pin
      status: "active", // current CAVP material
    },
    {
      id: "rfc8018", // the key derivation
      label: "RFC 8018, PKCS #5: Password-Based Cryptography Specification Version 2.1, January 2017: sections 3, 4.1, 4.2, 5.2, 6.2 and 8", // what the engine applies
      type: "standard", // IETF RFC (Informational)
      url: "https://www.rfc-editor.org/rfc/rfc8018", // fetched as .txt 2026-10-26 and 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read again the day the build was finished (first read 2026-10-26)
      scope: "salt and iteration count need not be secret (3); salt selection (4.1); the iteration count and SP 800-132's 1,000 and 10,000,000 (4.2); PBKDF2 (5.2); PBES2's shape, a PBKDF2 key then an encryption scheme (6.2); offline password search (8). Its four verified errata touch only the ASN.1 appendices (A and C); RFC 9579 and RFC 9879 update it for PKCS #12 only", // what it pins
      status: "active", // current
    },
    {
      id: "rfc7914-s11", // the derivation's known answers
      label: "RFC 7914, The scrypt Password-Based Key Derivation Function, August 2016: section 11, Test Vectors for PBKDF2 with HMAC-SHA-256", // the vectors
      type: "standard", // IETF RFC (Informational)
      url: "https://www.rfc-editor.org/rfc/rfc7914", // fetched as .txt 2026-10-26 and 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read again the day the build was finished (first read 2026-10-26)
      scope: "P=\"passwd\", S=\"salt\", c=1 and P=\"Password\", S=\"NaCl\", c=80000, dkLen 64; none of its six errata touches section 11; \"Password\" is the Example's published test passphrase", // what it pins
      status: "active", // current
    },
    {
      id: "owasp-password-storage", // the iteration count
      label: "OWASP Cheat Sheet Series, Password Storage Cheat Sheet: PBKDF2", // the figure
      type: "reference", // community standard guidance
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", // fetched 2026-10-26 and 2026-10-27, HTTP 200 (and its Markdown source on GitHub, the same figure)
      access_date: "2026-10-27", // read again the day the build was finished (first read 2026-10-26)
      scope: "\"PBKDF2-HMAC-SHA256: 600,000 iterations (recommended)\": the count this tool uses when encrypting", // what it pins
      status: "active", // current text as read
    },
    {
      id: "nist-sp800-132", // salt size and iteration span
      label: "NIST SP 800-132, Recommendation for Password-Based Key Derivation, Part 1: Storage Applications, December 2010: sections 5.1 and 5.2, appendix A.1 and A.2", // what the engine applies
      type: "standard", // NIST Special Publication
      url: "https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf", // fetched 2026-10-26 and 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read again the day the build was finished (first read 2026-10-26)
      scope: "the random part of the salt at least 128 bits (5.1); a minimum of 1,000 iterations, 10,000,000 for critical keys (5.2); offline, parallel search and passphrase length (A.1). The CSRC page shows a planning note of 2023-05-11: NIST is planning to revise it", // what it pins
      status: "active", // final; a revision is planned
    },
    {
      id: "w3c-webcrypto", // the API
      label: "W3C, Web Cryptography API, Recommendation 26 January 2017; and Web Cryptography Level 2, First Public Working Draft 22 April 2025 (now served at w3.org/TR/WebCryptoAPI/): getRandomValues, AES-GCM, PBKDF2, security considerations", // what the engine calls
      type: "standard", // W3C
      url: "https://www.w3.org/TR/WebCryptoAPI/", // fetched 2026-10-26 and 2026-10-27, HTTP 200, with the 2017 Recommendation at /TR/2017/REC-WebCryptoAPI-20170126/
      access_date: "2026-10-27", // read again the day the build was finished (first read 2026-10-26)
      scope: "getRandomValues fills at most 65,536 bytes with cryptographically secure random bytes (10.1.1); AES-GCM encrypt returns C | T, decrypt throws OperationError on FAIL, tagLength defaults to 128 (29.4); PBKDF2 deriveBits runs RFC 8018 section 5.2 and refuses 0 iterations (34.4.1); keys are not required to be zeroised and script injection can exfiltrate keys or data (6.2)", // what it pins
      status: "active", // the Recommendation, and the Level 2 draft
    },
    {
      id: "rfc4648", // the encoding
      label: "RFC 4648, The Base16, Base32, and Base64 Data Encodings, October 2006: sections 3.2, 3.5, 5 and 10", // what the format uses
      type: "standard", // IETF Standards Track
      url: "https://www.rfc-editor.org/rfc/rfc4648", // fetched as .txt 2026-10-26 and 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read again the day the build was finished (first read 2026-10-26)
      scope: "padding may be omitted when the referring specification says so (3.2); canonical encoding, zero pad bits, a decoder may reject the alternative (3.5); the base64url alphabet (5); the test vectors (10)", // what it pins
      status: "active", // current
    },
    {
      id: "rfc8265", // passphrase preparation
      label: "RFC 8265, Preparation, Enforcement, and Comparison of Internationalized Strings Representing Usernames and Passwords, October 2017: section 4.2.2, OpaqueString profile", // the mapping applied
      type: "standard", // IETF Standards Track
      url: "https://www.rfc-editor.org/rfc/rfc8265", // fetched as .txt 2026-10-26 and 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read again the day the build was finished (first read 2026-10-26)
      scope: "rule 2, non-ASCII spaces mapped to U+0020, and rule 4, NFC; no width or case mapping (rules 1 and 3). The code-point check of section 4.2.1 is not applied", // what it pins
      status: "active", // current
    },
    {
      id: "nist-sp800-63b-4", // the passphrase note
      label: "NIST SP 800-63B-4, Digital Identity Guidelines: Authentication and Authenticator Management (page dated 26 August 2025): appendix A, Strength of Passwords", // the note's basis
      type: "standard", // NIST Special Publication
      url: "https://pages.nist.gov/800-63-4/sp800-63b.html", // fetched 2026-10-26 and 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read again the day the build was finished (first read 2026-10-26)
      scope: "length is a primary factor in password strength; composition rules add less than expected; offline attacks need passwords orders of magnitude stronger; keystroke logging is as effective on long passwords as on short ones. Why the page shows counts and no score", // what it pins
      status: "active", // current revision
    },
    {
      id: "rfc3629", // the text encoding
      label: "RFC 3629, UTF-8, a transformation format of ISO 10646, November 2003", // the encoding of text and passphrase
      type: "standard", // IETF Standards Track
      url: "https://www.rfc-editor.org/rfc/rfc3629", // fetched as .txt 2026-10-26 and 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read again the day the build was finished (first read 2026-10-26)
      scope: "the text and the prepared passphrase are encoded as UTF-8; surrogate code points are not valid characters, so a lone surrogate is refused", // what it pins
      status: "active", // current
    },
    {
      id: "whatwg-html-spellcheck", // why the fields switch spell checking off
      label: "WHATWG HTML Living Standard, section 6.8.5, Spelling and grammar checking", // the attribute the component sets
      type: "standard", // WHATWG Living Standard
      url: "https://html.spec.whatwg.org/multipage/interaction.html", // fetched 2026-10-26 and 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read again the day the build was finished (first read 2026-10-26)
      scope: "spellcheck=\"false\" disables checking unless the user has forced it on; user agents should consider only text, search, URL and email inputs, textareas and editable content checkable, a list that leaves out password fields (Show turns them into text fields)", // what it pins
      status: "active", // living standard
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

/** The accept vectors, by the conventional name (the round trips). */
export const goldenVectors = ROUND_TRIP_VECTORS; // re-exported
/** The reject vectors, by the conventional name (decryption refusals). */
export const rejectVectors = DECRYPT_REJECT_VECTORS; // re-exported

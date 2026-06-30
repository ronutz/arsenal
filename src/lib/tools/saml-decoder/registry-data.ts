// ============================================================================
// src/lib/tools/saml-decoder/registry-data.ts
// ----------------------------------------------------------------------------
// REFERENCE DATA for the SAML 2.0 decoder: the well-known URNs that appear in a
// SAML message, mapped to short, stable technical labels, plus the XML-DSig /
// XML-Enc algorithm catalogue with weak-algorithm flags, the known root element
// names, and the hard parser limits that keep the decode bounded (XXE / billion-
// laughs / oversize defences live in compute.ts; the numeric limits live here).
//
// These are TECHNICAL TOKENS (URNs and their conventional short names), not
// prose. User-facing explanation text is localized in the message pack via the
// stable reason codes the engine emits; this file only normalizes raw URNs into
// the short forms a SAML-literate reader expects (e.g. the transient NameID
// format URN -> "transient").
//
// Sources: OASIS SAML 2.0 Core, the SAML 2.0 authn-context and bindings specs,
// and the W3C XML Signature / XML Encryption algorithm URIs.
// ============================================================================

export const REGISTRY_SNAPSHOT = "saml-reference-2026-06-29";

// -- Hard parser limits (XXE/oversize/depth guards enforced in compute.ts) ----
/** Reject input larger than this many decoded bytes (a SAML message is small). */
export const MAX_INPUT_BYTES = 1_048_576; // 1 MiB
/** Maximum element nesting depth before the parser bails (anti-deep-nesting). */
export const MAX_DEPTH = 100;
/** Maximum element count before the parser bails (anti-amplification). */
export const MAX_NODES = 20_000;

// -- Namespaces ---------------------------------------------------------------
/** Well-known SAML / XML-DSig namespace URIs -> conventional prefix. */
export const SAML_NAMESPACES: Record<string, string> = {
  "urn:oasis:names:tc:SAML:2.0:assertion": "saml",
  "urn:oasis:names:tc:SAML:2.0:protocol": "samlp",
  "urn:oasis:names:tc:SAML:2.0:metadata": "md",
  "http://www.w3.org/2000/09/xmldsig#": "ds",
  "http://www.w3.org/2001/04/xmlenc#": "xenc",
  "http://www.w3.org/2001/04/xmldsig-more#": "dsig-more",
};

// -- Root element -> document type label -------------------------------------
/** Recognized SAML root element local names -> a short document-type label. */
export const ROOT_ELEMENTS: Record<string, string> = {
  Response: "SAML Response",
  LogoutResponse: "Logout Response",
  ArtifactResponse: "Artifact Response",
  AuthnRequest: "Authn Request",
  LogoutRequest: "Logout Request",
  ArtifactResolve: "Artifact Resolve",
  Assertion: "Assertion",
  EncryptedAssertion: "Encrypted Assertion",
  AttributeQuery: "Attribute Query",
  EntityDescriptor: "Metadata (EntityDescriptor)",
  EntitiesDescriptor: "Metadata (EntitiesDescriptor)",
};

// -- NameID formats -----------------------------------------------------------
const NAMEID_FORMAT_PREFIX = "urn:oasis:names:tc:SAML:";
/** NameID Format URN -> short label. */
export const NAMEID_FORMATS: Record<string, string> = {
  [`${NAMEID_FORMAT_PREFIX}2.0:nameid-format:transient`]: "transient",
  [`${NAMEID_FORMAT_PREFIX}2.0:nameid-format:persistent`]: "persistent",
  [`${NAMEID_FORMAT_PREFIX}2.0:nameid-format:entity`]: "entity",
  [`${NAMEID_FORMAT_PREFIX}2.0:nameid-format:encrypted`]: "encrypted",
  [`${NAMEID_FORMAT_PREFIX}2.0:nameid-format:kerberos`]: "kerberos",
  [`${NAMEID_FORMAT_PREFIX}1.1:nameid-format:emailAddress`]: "emailAddress",
  [`${NAMEID_FORMAT_PREFIX}1.1:nameid-format:unspecified`]: "unspecified",
  [`${NAMEID_FORMAT_PREFIX}1.1:nameid-format:X509SubjectName`]: "X509SubjectName",
  [`${NAMEID_FORMAT_PREFIX}1.1:nameid-format:WindowsDomainQualifiedName`]: "WindowsDomainQualifiedName",
  [`${NAMEID_FORMAT_PREFIX}2.0:nameid-format:WindowsDomainQualifiedName`]: "WindowsDomainQualifiedName",
};

// -- SubjectConfirmation methods ---------------------------------------------
/** SubjectConfirmation @Method URN -> short label. */
export const CONFIRMATION_METHODS: Record<string, string> = {
  "urn:oasis:names:tc:SAML:2.0:cm:bearer": "bearer",
  "urn:oasis:names:tc:SAML:2.0:cm:holder-of-key": "holder-of-key",
  "urn:oasis:names:tc:SAML:2.0:cm:sender-vouches": "sender-vouches",
};

// -- Status codes -------------------------------------------------------------
const STATUS_PREFIX = "urn:oasis:names:tc:SAML:2.0:status:";
/** Status @Value URN -> short label (top-level and common second-level). */
export const STATUS_CODES: Record<string, string> = {
  [`${STATUS_PREFIX}Success`]: "Success",
  [`${STATUS_PREFIX}Requester`]: "Requester",
  [`${STATUS_PREFIX}Responder`]: "Responder",
  [`${STATUS_PREFIX}VersionMismatch`]: "VersionMismatch",
  [`${STATUS_PREFIX}AuthnFailed`]: "AuthnFailed",
  [`${STATUS_PREFIX}InvalidAttrNameOrValue`]: "InvalidAttrNameOrValue",
  [`${STATUS_PREFIX}InvalidNameIDPolicy`]: "InvalidNameIDPolicy",
  [`${STATUS_PREFIX}NoAuthnContext`]: "NoAuthnContext",
  [`${STATUS_PREFIX}NoPassive`]: "NoPassive",
  [`${STATUS_PREFIX}PartialLogout`]: "PartialLogout",
  [`${STATUS_PREFIX}RequestDenied`]: "RequestDenied",
  [`${STATUS_PREFIX}RequestUnsupported`]: "RequestUnsupported",
  [`${STATUS_PREFIX}UnsupportedBinding`]: "UnsupportedBinding",
};
/** The success status URN, for the engine's success/non-success assessment. */
export const STATUS_SUCCESS = `${STATUS_PREFIX}Success`;

// -- AuthnContext classes -----------------------------------------------------
const AC_PREFIX = "urn:oasis:names:tc:SAML:2.0:ac:classes:";
/** AuthnContextClassRef URN -> short label. */
export const AUTHN_CONTEXT_CLASSES: Record<string, string> = {
  [`${AC_PREFIX}Password`]: "Password",
  [`${AC_PREFIX}PasswordProtectedTransport`]: "PasswordProtectedTransport",
  [`${AC_PREFIX}TLSClient`]: "TLSClient",
  [`${AC_PREFIX}X509`]: "X509",
  [`${AC_PREFIX}Kerberos`]: "Kerberos",
  [`${AC_PREFIX}Smartcard`]: "Smartcard",
  [`${AC_PREFIX}SmartcardPKI`]: "SmartcardPKI",
  [`${AC_PREFIX}MobileTwoFactorContract`]: "MobileTwoFactorContract",
  [`${AC_PREFIX}TimeSyncToken`]: "TimeSyncToken",
  [`${AC_PREFIX}unspecified`]: "unspecified",
  [`${AC_PREFIX}PreviousSession`]: "PreviousSession",
  // Microsoft / federation common extension class (kept as-is, recognized label):
  "http://schemas.microsoft.com/ws/2008/06/identity/authenticationmethod/password": "Password (MS)",
};

// -- Bindings -----------------------------------------------------------------
const BINDING_PREFIX = "urn:oasis:names:tc:SAML:2.0:bindings:";
/** Protocol binding URN -> short label. */
export const BINDINGS: Record<string, string> = {
  [`${BINDING_PREFIX}HTTP-POST`]: "HTTP-POST",
  [`${BINDING_PREFIX}HTTP-Redirect`]: "HTTP-Redirect",
  [`${BINDING_PREFIX}HTTP-Artifact`]: "HTTP-Artifact",
  [`${BINDING_PREFIX}SOAP`]: "SOAP",
  [`${BINDING_PREFIX}PAOS`]: "PAOS",
};

// -- XML Signature / Encryption algorithms (with weak flags) ------------------
/** An algorithm record: a short label and whether it is cryptographically weak. */
export interface AlgorithmRecord {
  label: string;
  weak: boolean;
}

/** SignatureMethod @Algorithm URI -> record. SHA-1, MD5, and DSA-SHA1 are weak. */
export const SIGNATURE_ALGORITHMS: Record<string, AlgorithmRecord> = {
  "http://www.w3.org/2000/09/xmldsig#rsa-sha1": { label: "RSA-SHA1", weak: true },
  "http://www.w3.org/2000/09/xmldsig#dsa-sha1": { label: "DSA-SHA1", weak: true },
  "http://www.w3.org/2000/09/xmldsig#hmac-sha1": { label: "HMAC-SHA1", weak: true },
  "http://www.w3.org/2001/04/xmldsig-more#rsa-md5": { label: "RSA-MD5", weak: true },
  "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256": { label: "RSA-SHA256", weak: false },
  "http://www.w3.org/2001/04/xmldsig-more#rsa-sha384": { label: "RSA-SHA384", weak: false },
  "http://www.w3.org/2001/04/xmldsig-more#rsa-sha512": { label: "RSA-SHA512", weak: false },
  "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha1": { label: "ECDSA-SHA1", weak: true },
  "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256": { label: "ECDSA-SHA256", weak: false },
  "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha384": { label: "ECDSA-SHA384", weak: false },
  "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha512": { label: "ECDSA-SHA512", weak: false },
  "http://www.w3.org/2007/05/xmldsig-more#sha256-rsa-MGF1": { label: "RSA-PSS-SHA256", weak: false },
};

/** DigestMethod @Algorithm URI -> record. SHA-1 and MD5 are weak. */
export const DIGEST_ALGORITHMS: Record<string, AlgorithmRecord> = {
  "http://www.w3.org/2000/09/xmldsig#sha1": { label: "SHA-1", weak: true },
  "http://www.w3.org/2001/04/xmlenc#sha256": { label: "SHA-256", weak: false },
  "http://www.w3.org/2001/04/xmldsig-more#sha384": { label: "SHA-384", weak: false },
  "http://www.w3.org/2001/04/xmlenc#sha512": { label: "SHA-512", weak: false },
  "http://www.w3.org/2001/04/xmlenc#ripemd160": { label: "RIPEMD-160", weak: true },
};

/** CanonicalizationMethod @Algorithm URI -> short label. */
export const C14N_METHODS: Record<string, string> = {
  "http://www.w3.org/2001/10/xml-exc-c14n#": "Exclusive C14N",
  "http://www.w3.org/2001/10/xml-exc-c14n#WithComments": "Exclusive C14N (with comments)",
  "http://www.w3.org/TR/2001/REC-xml-c14n-20010315": "Inclusive C14N",
  "http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments": "Inclusive C14N (with comments)",
};

// -- Lookup helpers (graceful: return the raw value when unknown) -------------
function lookup(table: Record<string, string>, urn: string | undefined): string | undefined {
  if (!urn) return undefined;
  return table[urn];
}

/** Short label for a NameID Format URN, or the raw URN if unrecognized. */
export function nameIdFormatLabel(urn: string | undefined): string | undefined {
  if (!urn) return undefined;
  return lookup(NAMEID_FORMATS, urn) ?? urn;
}
/** Short label for a status URN, or the raw URN if unrecognized. */
export function statusLabel(urn: string | undefined): string | undefined {
  if (!urn) return undefined;
  return lookup(STATUS_CODES, urn) ?? urn;
}
/** Short label for a SubjectConfirmation method, or the raw URN. */
export function confirmationMethodLabel(urn: string | undefined): string | undefined {
  if (!urn) return undefined;
  return lookup(CONFIRMATION_METHODS, urn) ?? urn;
}
/** Short label for an AuthnContextClassRef, or the raw URN. */
export function authnContextLabel(urn: string | undefined): string | undefined {
  if (!urn) return undefined;
  return lookup(AUTHN_CONTEXT_CLASSES, urn) ?? urn;
}
/** Record for a signature algorithm URI, or undefined if unknown. */
export function signatureAlgorithm(uri: string | undefined): AlgorithmRecord | undefined {
  return uri ? SIGNATURE_ALGORITHMS[uri] : undefined;
}
/** Record for a digest algorithm URI, or undefined if unknown. */
export function digestAlgorithm(uri: string | undefined): AlgorithmRecord | undefined {
  return uri ? DIGEST_ALGORITHMS[uri] : undefined;
}

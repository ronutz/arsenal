// ============================================================================
// src/lib/tools/saml-decoder/compute.ts
// ----------------------------------------------------------------------------
// THE SAML 2.0 DECODER ENGINE.
//
// Pipeline: normalize the input (raw XML, URL-encoded, or base64 POST-binding) ->
// XXE-HARDENED parse -> extract the SAML structure -> rule-based assessment.
//
// SECURITY MODEL (the headline property of this tool):
//   * A DOCTYPE or an <!ENTITY> declaration is REJECTED outright. SAML messages
//     have no legitimate DTD, and rejecting it defeats classic XXE (external
//     general/parameter entities) and the billion-laughs expansion, which both
//     require an internal or external DTD to define the entities.
//   * The parser expands ONLY the five predefined XML entities and numeric
//     character references. An unknown &name; reference is left literal, never
//     resolved, so no custom entity can be introduced even if one slipped past.
//   * Input size, element nesting depth, and element count are all capped.
//   * The parser is a single linear scan with simple, anchored sub-scans (no
//     backtracking regex over attacker input), so it is ReDoS-safe.
//
// The engine NEVER fetches anything, NEVER verifies or forges a signature, and
// NEVER decrypts an EncryptedAssertion. It decodes and explains structure, and
// reports whether a signature is PRESENT and which algorithm it names. It is
// deterministic and clock-independent: it surfaces NotBefore / NotOnOrAfter for
// the reader to judge, but never compares them to the current time.
// ============================================================================

import {
  MAX_INPUT_BYTES,
  MAX_DEPTH,
  MAX_NODES,
  ROOT_ELEMENTS,
  STATUS_SUCCESS,
  nameIdFormatLabel,
  statusLabel,
  confirmationMethodLabel,
  authnContextLabel,
  signatureAlgorithm,
  digestAlgorithm,
  C14N_METHODS,
} from "./registry-data";

// -- Errors -------------------------------------------------------------------
export type SamlParseErrorCode =
  | "empty"
  | "not-decodable"
  | "deflated"
  | "doctype-forbidden"
  | "not-xml"
  | "no-saml"
  | "malformed"
  | "too-large"
  | "too-deep"
  | "too-many-nodes";

/** Thrown for input that cannot be safely decoded into a SAML message. */
export class SamlParseError extends Error {
  code: SamlParseErrorCode;
  constructor(code: SamlParseErrorCode, message?: string) {
    super(message ?? code);
    this.name = "SamlParseError";
    this.code = code;
  }
}

// -- Public report shape ------------------------------------------------------
export interface SamlReason {
  code: string;
  value?: string;
}

export interface SignatureAlgorithms {
  sig?: string;
  sigLabel?: string;
  digest?: string;
  digestLabel?: string;
  c14n?: string;
  c14nLabel?: string;
  weakSig: boolean;
  weakDigest: boolean;
}

export interface SubjectInfo {
  nameId?: string;
  nameIdFormat?: string;
  nameIdFormatLabel?: string;
  confirmationMethod?: string;
  confirmationMethodLabel?: string;
  notOnOrAfter?: string;
  recipient?: string;
  inResponseTo?: string;
}

export interface ConditionsInfo {
  notBefore?: string;
  notOnOrAfter?: string;
  audiences: string[];
}

export interface AuthnInfo {
  authnInstant?: string;
  sessionIndex?: string;
  contextClass?: string;
  contextClassLabel?: string;
}

export interface SamlAttribute {
  name?: string;
  nameFormat?: string;
  friendlyName?: string;
  values: string[];
}

export interface AssertionInfo {
  id?: string;
  issueInstant?: string;
  issuer?: string;
  signed: boolean;
  signatureAlgorithms?: SignatureAlgorithms;
  subject?: SubjectInfo;
  conditions?: ConditionsInfo;
  authn?: AuthnInfo;
  attributes: SamlAttribute[];
}

export interface StatusInfo {
  code?: string;
  codeLabel?: string;
  subCode?: string;
  subCodeLabel?: string;
  message?: string;
  success: boolean;
}

export interface SamlReport {
  docType: string;
  rootLocal: string;
  message: {
    id?: string;
    version?: string;
    issueInstant?: string;
    destination?: string;
    inResponseTo?: string;
    consent?: string;
    issuer?: string;
    status?: StatusInfo;
  };
  signedResponse: boolean;
  responseSignatureAlgorithms?: SignatureAlgorithms;
  assertions: AssertionInfo[];
  encryptedAssertionCount: number;
  reasons: SamlReason[];
}

// -- Minimal hardened XML model ----------------------------------------------
interface XmlElement {
  name: string;
  local: string;
  prefix: string;
  attrs: Record<string, string>;
  children: XmlElement[];
  text: string;
}

function isWs(c: string): boolean {
  return c === " " || c === "\t" || c === "\n" || c === "\r";
}

function splitQName(name: string): { prefix: string; local: string } {
  const i = name.indexOf(":");
  if (i === -1) return { prefix: "", local: name };
  return { prefix: name.slice(0, i), local: name.slice(i + 1) };
}

/**
 * Decode the five predefined XML entities and numeric character references.
 * Unknown &name; references are returned LITERAL (never expanded), which is the
 * core of the no-custom-entity guarantee. The pattern is a simple alternation of
 * character classes with no nested quantifiers, so it is linear / ReDoS-safe.
 */
function decodeEntities(s: string): string {
  if (s.indexOf("&") === -1) return s;
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, ent: string) => {
    if (ent[0] === "#") {
      const code =
        ent[1] === "x" || ent[1] === "X"
          ? parseInt(ent.slice(2), 16)
          : parseInt(ent.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return m;
      try {
        return String.fromCodePoint(code);
      } catch {
        return m;
      }
    }
    switch (ent) {
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "amp":
        return "&";
      case "quot":
        return '"';
      case "apos":
        return "'";
      default:
        return m; // unknown entity: leave literal, do NOT expand
    }
  });
}

/** Find the index of the '>' that ends a tag, skipping quoted attribute values. */
function findTagEnd(s: string, from: number): number {
  let i = from;
  let q = "";
  while (i < s.length) {
    const c = s[i];
    if (q) {
      if (c === q) q = "";
    } else if (c === '"' || c === "'") {
      q = c;
    } else if (c === ">") {
      return i;
    }
    i++;
  }
  return -1;
}

/** Parse the body of a start tag (no angle brackets) into a name + attributes. */
function parseStartTag(body: string): { name: string; attrs: Record<string, string> } {
  const n = body.length;
  let i = 0;
  while (i < n && isWs(body[i])) i++;
  const nameStart = i;
  while (i < n && !isWs(body[i])) i++;
  const name = body.slice(nameStart, i);
  const attrs: Record<string, string> = {};
  while (i < n) {
    while (i < n && isWs(body[i])) i++;
    if (i >= n) break;
    const aStart = i;
    while (i < n && body[i] !== "=" && !isWs(body[i])) i++;
    const aName = body.slice(aStart, i);
    while (i < n && isWs(body[i])) i++;
    if (body[i] === "=") {
      i++;
      while (i < n && isWs(body[i])) i++;
      const q = body[i];
      if (q === '"' || q === "'") {
        i++;
        const vStart = i;
        while (i < n && body[i] !== q) i++;
        const val = body.slice(vStart, i);
        i++; // closing quote
        if (aName) attrs[aName] = decodeEntities(val);
      } else {
        const vStart = i;
        while (i < n && !isWs(body[i])) i++;
        if (aName) attrs[aName] = decodeEntities(body.slice(vStart, i));
      }
    } else if (aName) {
      attrs[aName] = "";
    }
  }
  return { name, attrs };
}

/**
 * Parse XML into a minimal element tree. Hardened: rejects DOCTYPE / declaration
 * markup, caps depth and node count, and decodes only safe entities. Throws a
 * SamlParseError on any structural problem.
 */
function parseXmlSafe(xml: string): XmlElement {
  const n = xml.length;
  let i = 0;
  let nodeCount = 0;
  let depth = 0;
  const root: XmlElement = { name: "#root", local: "#root", prefix: "", attrs: {}, children: [], text: "" };
  const stack: XmlElement[] = [root];
  const cur = () => stack[stack.length - 1];

  while (i < n) {
    const lt = xml.indexOf("<", i);
    if (lt === -1) break; // only trailing text remains; ignored for SAML
    if (lt > i) {
      cur().text += decodeEntities(xml.slice(i, lt));
    }

    if (xml.startsWith("<!--", lt)) {
      const end = xml.indexOf("-->", lt + 4);
      if (end === -1) throw new SamlParseError("malformed");
      i = end + 3;
      continue;
    }
    if (xml.startsWith("<![CDATA[", lt)) {
      const end = xml.indexOf("]]>", lt + 9);
      if (end === -1) throw new SamlParseError("malformed");
      cur().text += xml.slice(lt + 9, end); // raw, no entity decode inside CDATA
      i = end + 3;
      continue;
    }
    if (xml.startsWith("<?", lt)) {
      const end = xml.indexOf("?>", lt + 2);
      if (end === -1) throw new SamlParseError("malformed");
      i = end + 2;
      continue;
    }
    if (xml.startsWith("<!", lt)) {
      // DOCTYPE or any other declaration: not permitted in a SAML message.
      throw new SamlParseError("doctype-forbidden");
    }
    if (xml.startsWith("</", lt)) {
      const gt = xml.indexOf(">", lt + 2);
      if (gt === -1) throw new SamlParseError("malformed");
      if (stack.length <= 1) throw new SamlParseError("malformed");
      stack.pop();
      depth--;
      i = gt + 1;
      continue;
    }

    // start tag
    const gt = findTagEnd(xml, lt + 1);
    if (gt === -1) throw new SamlParseError("malformed");
    const inner = xml.slice(lt + 1, gt);
    const selfClose = inner.endsWith("/");
    const { name, attrs } = parseStartTag(selfClose ? inner.slice(0, -1) : inner);
    if (!name) throw new SamlParseError("malformed");
    if (++nodeCount > MAX_NODES) throw new SamlParseError("too-many-nodes");
    const { prefix, local } = splitQName(name);
    const el: XmlElement = { name, local, prefix, attrs, children: [], text: "" };
    cur().children.push(el);
    if (!selfClose) {
      stack.push(el);
      if (++depth > MAX_DEPTH) throw new SamlParseError("too-deep");
    }
    i = gt + 1;
  }

  if (stack.length !== 1) throw new SamlParseError("malformed"); // unclosed element
  if (root.children.length === 0) throw new SamlParseError("not-xml");
  return root.children[0];
}

// -- Tree accessors (namespace-agnostic: match by local name) ----------------
function attr(el: XmlElement, local: string): string | undefined {
  for (const key of Object.keys(el.attrs)) {
    if (splitQName(key).local === local) return el.attrs[key];
  }
  return undefined;
}
function kids(el: XmlElement, local: string): XmlElement[] {
  return el.children.filter((c) => c.local === local);
}
function kid(el: XmlElement, local: string): XmlElement | undefined {
  return el.children.find((c) => c.local === local);
}
function descendant(el: XmlElement, local: string): XmlElement | undefined {
  const queue = [...el.children];
  while (queue.length) {
    const node = queue.shift() as XmlElement;
    if (node.local === local) return node;
    queue.push(...node.children);
  }
  return undefined;
}
function textOf(el: XmlElement | undefined): string | undefined {
  if (!el) return undefined;
  const t = el.text.trim();
  return t.length ? t : undefined;
}

// -- Signature algorithm extraction ------------------------------------------
function readSignatureAlgorithms(sig: XmlElement): SignatureAlgorithms {
  const sigMethod = descendant(sig, "SignatureMethod");
  const digestMethod = descendant(sig, "DigestMethod");
  const c14nMethod = descendant(sig, "CanonicalizationMethod");
  const sigUri = sigMethod ? attr(sigMethod, "Algorithm") : undefined;
  const digestUri = digestMethod ? attr(digestMethod, "Algorithm") : undefined;
  const c14nUri = c14nMethod ? attr(c14nMethod, "Algorithm") : undefined;
  const sigRec = signatureAlgorithm(sigUri);
  const digestRec = digestAlgorithm(digestUri);
  return {
    sig: sigUri,
    sigLabel: sigRec?.label ?? sigUri,
    digest: digestUri,
    digestLabel: digestRec?.label ?? digestUri,
    c14n: c14nUri,
    c14nLabel: c14nUri ? (C14N_METHODS[c14nUri] ?? c14nUri) : undefined,
    weakSig: sigRec?.weak ?? false,
    weakDigest: digestRec?.weak ?? false,
  };
}

/** A direct-child Signature (XML-DSig enveloped signature sits directly under
 * the element it signs). We match a direct child to avoid attributing a nested
 * assertion's signature to its parent. */
function directSignature(el: XmlElement): XmlElement | undefined {
  return el.children.find((c) => c.local === "Signature" && c.prefix !== "");
}

// -- Assertion extraction -----------------------------------------------------
function extractAssertion(a: XmlElement): AssertionInfo {
  const issuer = textOf(kid(a, "Issuer"));
  const sig = directSignature(a) ?? (kid(a, "Signature") && kid(a, "Signature")!.local === "Signature" ? kid(a, "Signature") : undefined);
  const signed = !!sig;

  // Subject
  let subject: SubjectInfo | undefined;
  const subjectEl = kid(a, "Subject");
  if (subjectEl) {
    const nameIdEl = kid(subjectEl, "NameID") ?? kid(subjectEl, "EncryptedID");
    const scEl = kid(subjectEl, "SubjectConfirmation");
    const scData = scEl ? kid(scEl, "SubjectConfirmationData") : undefined;
    const fmt = nameIdEl ? attr(nameIdEl, "Format") : undefined;
    const method = scEl ? attr(scEl, "Method") : undefined;
    subject = {
      nameId: nameIdEl && nameIdEl.local === "NameID" ? textOf(nameIdEl) : undefined,
      nameIdFormat: fmt,
      nameIdFormatLabel: nameIdFormatLabel(fmt),
      confirmationMethod: method,
      confirmationMethodLabel: confirmationMethodLabel(method),
      notOnOrAfter: scData ? attr(scData, "NotOnOrAfter") : undefined,
      recipient: scData ? attr(scData, "Recipient") : undefined,
      inResponseTo: scData ? attr(scData, "InResponseTo") : undefined,
    };
  }

  // Conditions
  let conditions: ConditionsInfo | undefined;
  const condEl = kid(a, "Conditions");
  if (condEl) {
    const audiences: string[] = [];
    for (const ar of kids(condEl, "AudienceRestriction")) {
      for (const aud of kids(ar, "Audience")) {
        const v = textOf(aud);
        if (v) audiences.push(v);
      }
    }
    conditions = {
      notBefore: attr(condEl, "NotBefore"),
      notOnOrAfter: attr(condEl, "NotOnOrAfter"),
      audiences,
    };
  }

  // AuthnStatement
  let authn: AuthnInfo | undefined;
  const authnEl = kid(a, "AuthnStatement");
  if (authnEl) {
    const ctxEl = kid(authnEl, "AuthnContext");
    const classRef = ctxEl ? textOf(kid(ctxEl, "AuthnContextClassRef")) : undefined;
    authn = {
      authnInstant: attr(authnEl, "AuthnInstant"),
      sessionIndex: attr(authnEl, "SessionIndex"),
      contextClass: classRef,
      contextClassLabel: authnContextLabel(classRef),
    };
  }

  // Attributes
  const attributes: SamlAttribute[] = [];
  const attrStmt = kid(a, "AttributeStatement");
  if (attrStmt) {
    for (const at of kids(attrStmt, "Attribute")) {
      const values: string[] = [];
      for (const av of kids(at, "AttributeValue")) {
        const v = textOf(av);
        values.push(v ?? "");
      }
      attributes.push({
        name: attr(at, "Name"),
        nameFormat: attr(at, "NameFormat"),
        friendlyName: attr(at, "FriendlyName"),
        values,
      });
    }
  }

  return {
    id: attr(a, "ID"),
    issueInstant: attr(a, "IssueInstant"),
    issuer,
    signed,
    signatureAlgorithms: sig ? readSignatureAlgorithms(sig) : undefined,
    subject,
    conditions,
    authn,
    attributes,
  };
}

// -- Top-level extraction + assessment ---------------------------------------
function extractSaml(root: XmlElement): SamlReport {
  const rootLocal = root.local;
  const docType = ROOT_ELEMENTS[rootLocal] ?? rootLocal;

  // Status (responses)
  let status: StatusInfo | undefined;
  const statusEl = kid(root, "Status");
  if (statusEl) {
    const codeEl = kid(statusEl, "StatusCode");
    const codeUri = codeEl ? attr(codeEl, "Value") : undefined;
    const subCodeEl = codeEl ? kid(codeEl, "StatusCode") : undefined;
    const subUri = subCodeEl ? attr(subCodeEl, "Value") : undefined;
    status = {
      code: codeUri,
      codeLabel: statusLabel(codeUri),
      subCode: subUri,
      subCodeLabel: statusLabel(subUri),
      message: textOf(kid(statusEl, "StatusMessage")),
      success: codeUri === STATUS_SUCCESS,
    };
  }

  // Encrypted assertions
  const encryptedAssertionCount = kids(root, "EncryptedAssertion").length;

  // Assertions (direct children, plus the root itself if it IS an assertion)
  const assertionEls = kids(root, "Assertion");
  if (rootLocal === "Assertion") assertionEls.unshift(root);
  const assertions = assertionEls.map(extractAssertion);

  // Response-level signature
  const respSig = directSignature(root);
  const signedResponse = !!respSig;
  const responseSignatureAlgorithms = respSig ? readSignatureAlgorithms(respSig) : undefined;

  // Validate that this actually looked like SAML
  const knownRoot = rootLocal in ROOT_ELEMENTS;
  if (!knownRoot && assertions.length === 0 && !status) {
    throw new SamlParseError("no-saml");
  }

  // -- Assessment (stable coded reasons; no clock comparison) --
  const reasons: SamlReason[] = [];
  const signedAssertions = assertions.filter((a) => a.signed).length;

  if (signedResponse) reasons.push({ code: "SIGNED_RESPONSE" });
  if (signedAssertions > 0)
    reasons.push({ code: "SIGNED_ASSERTION", value: String(signedAssertions) });
  if (!signedResponse && signedAssertions === 0 && encryptedAssertionCount === 0) {
    reasons.push({ code: "UNSIGNED" });
  }

  // Weak algorithms (aggregate across response + assertions)
  const allSigs: SignatureAlgorithms[] = [];
  if (responseSignatureAlgorithms) allSigs.push(responseSignatureAlgorithms);
  for (const a of assertions) if (a.signatureAlgorithms) allSigs.push(a.signatureAlgorithms);
  const weakSig = allSigs.find((s) => s.weakSig);
  const weakDigest = allSigs.find((s) => s.weakDigest);
  if (weakSig) reasons.push({ code: "WEAK_SIG_ALGO", value: weakSig.sigLabel });
  if (weakDigest) reasons.push({ code: "WEAK_DIGEST_ALGO", value: weakDigest.digestLabel });

  if (encryptedAssertionCount > 0)
    reasons.push({ code: "ENCRYPTED_ASSERTION", value: String(encryptedAssertionCount) });

  if (status) {
    if (status.success) reasons.push({ code: "STATUS_SUCCESS" });
    else reasons.push({ code: "STATUS_NOT_SUCCESS", value: status.codeLabel ?? status.code });
  }

  // Per-assertion structural cautions
  for (const a of assertions) {
    if (!a.conditions) {
      reasons.push({ code: "NO_CONDITIONS" });
    } else if (a.conditions.audiences.length === 0) {
      reasons.push({ code: "NO_AUDIENCE_RESTRICTION" });
    }
    if (a.subject?.confirmationMethodLabel === "bearer") {
      if (!a.subject.notOnOrAfter) reasons.push({ code: "BEARER_NO_NOTONORAFTER" });
      if (!a.subject.recipient) reasons.push({ code: "BEARER_NO_RECIPIENT" });
    }
  }

  if (assertions.length > 1)
    reasons.push({ code: "MULTIPLE_ASSERTIONS", value: String(assertions.length) });

  return {
    docType,
    rootLocal,
    message: {
      id: attr(root, "ID"),
      version: attr(root, "Version"),
      issueInstant: attr(root, "IssueInstant"),
      destination: attr(root, "Destination"),
      inResponseTo: attr(root, "InResponseTo"),
      consent: attr(root, "Consent"),
      issuer: textOf(kid(root, "Issuer")),
      status,
    },
    signedResponse,
    responseSignatureAlgorithms,
    assertions,
    encryptedAssertionCount,
    reasons,
  };
}

// -- Input normalization + base64 --------------------------------------------
/** Browser + Node safe base64 -> UTF-8 string. Returns null if not valid base64. */
function base64ToString(b64: string): string | null {
  let s = b64.replace(/[\r\n\t ]+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) return null;
  try {
    const bin = atob(s);
    if (bin.length > MAX_INPUT_BYTES) throw new SamlParseError("too-large");
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch (e) {
    if (e instanceof SamlParseError) throw e;
    return null;
  }
}

/** Strip a UTF-8 BOM and leading whitespace, then test for an XML start. */
function looksLikeXml(s: string): boolean {
  return s.replace(/^\uFEFF/, "").trimStart().startsWith("<");
}

/**
 * analyzeSaml - the engine entry point. Accepts raw XML, a URL-encoded form
 * value, or a base64 (HTTP-POST binding) SAML message. Throws SamlParseError
 * for input that is empty, not decodable, deflate-compressed (Redirect binding),
 * or that carries a DOCTYPE.
 */
export function analyzeSaml(input: string): SamlReport {
  const raw = input.trim();
  if (!raw) throw new SamlParseError("empty");

  let xml: string;
  if (looksLikeXml(raw)) {
    xml = raw;
  } else {
    let candidate = raw;
    if (/%[0-9A-Fa-f]{2}/.test(candidate)) {
      try {
        candidate = decodeURIComponent(candidate.replace(/\+/g, " "));
      } catch {
        /* keep original */
      }
    }
    if (looksLikeXml(candidate)) {
      xml = candidate;
    } else {
      const decoded = base64ToString(candidate);
      if (decoded === null) throw new SamlParseError("not-decodable");
      if (!looksLikeXml(decoded)) throw new SamlParseError("deflated");
      xml = decoded;
    }
  }

  xml = xml.replace(/^\uFEFF/, "");
  if (xml.length > MAX_INPUT_BYTES) throw new SamlParseError("too-large");
  // XXE kill-switch: no DTD / entity declarations in a SAML message.
  if (/<!DOCTYPE/i.test(xml) || /<!ENTITY/i.test(xml)) {
    throw new SamlParseError("doctype-forbidden");
  }

  const root = parseXmlSafe(xml);
  return extractSaml(root);
}

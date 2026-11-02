// ============================================================================
// src/lib/tools/xml-decoder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the XML decoder (posture "input-caution"; the
// manifest: "XML can carry internal hostnames, tokens, and PII"). A link
// carries the document as pasted, once the page has read it as XML, with a
// caution line. Before a link is offered the family's secrets check reads it
// (src/lib/share/text-secrets.ts: a PEM private key, a JWT, a password in a URL, an
// Authorization or Cookie line ...), with three rules of this tool's own:
//   wsse-password   the text of a UsernameToken's Password element (OASIS Web
//                   Services Security UsernameToken Profile 1.1.1, read
//                   2026-10-27: "/wsse:UsernameToken/wsse:Password This
//                   optional element provides password information (or
//                   equivalent such as a hash)"): a secret;
//   saml-assertion  a signed Assertion (an Assertion with a Signature child,
//                   or a Response with a Signature child holding Assertions)
//                   or an EncryptedAssertion: a secret, as in the SAML
//                   decoder (SAML 2.0 Profiles sections 3.3 and 4.1.4.5: a
//                   bearer assertion signs its subject in);
//   secret-name     an element or attribute whose name looks like a secret
//                   (the site's check's heuristic: ApiKey, client_secret,
//                   token, password ...) with a value: a maybe-secret.
// A secret blocks the link (code "secret"; the popover names the line and the
// element), and the reader replaces it first; a maybe-secret is named in the
// caution line. Lines are the start tags' lines.
//
// Arrival: the document fills the box as a paste would and the page reads it
// (locally; it never resolves an entity or fetches anything). Any non-blank
// text is accepted, exactly as a paste is.
// ============================================================================

import { parseXml, type XmlNode } from "./compute"; // the page's own parser
import { isReportableValue, isSecretName } from "../code-to-image/secrets"; // the site's name heuristic and placeholder test
import { encodeCheckedBox, findShareSecrets, type ShareSecretFinding, type ShareSecretReport } from "../../share/text-secrets"; // the family's secrets check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface XmlShareState {
  /** The box as pasted. */
  input: string;
}

/** An element node of the parser's tree. */
type XmlElement = Extract<XmlNode, { kind: "element" }>; // the element variant

/**
 * The element children of an element.
 * @param el the element
 * @returns its child elements, in order
 */
function childElements(el: XmlElement): XmlElement[] {
  return el.children.filter((c): c is XmlElement => c.kind === "element"); // elements only
} // childElements

/**
 * The text an element holds directly (its text and CDATA children, joined, trimmed).
 * @param el the element
 * @returns the text
 */
function ownText(el: XmlElement): string {
  return el.children.map((c) => (c.kind === "text" || c.kind === "cdata" ? c.value : "")).join("").trim(); // direct text only
} // ownText

/**
 * This tool's rules, read from the parser's tree in document order (an explicit stack, no recursion).
 * @param norm the document with line feeds only
 * @returns the findings, each at its start tag's line
 */
export function xmlShareFindings(norm: string): ShareSecretFinding[] {
  const parsed = parseXml(norm); // the tree, as the page reads it
  const out: ShareSecretFinding[] = []; // the findings
  let cursor = 0; // where the next start tag is searched from (tags come in document order)
  let lineCursor = 0; // the offset the line count has reached
  let line = 1; // the line at lineCursor
  const stack: { el: XmlElement; parent: XmlElement | null }[] = [...parsed.roots].reverse().map((el) => ({ el, parent: null })); // the roots, first on top
  while (stack.length > 0) { // depth first, in document order
    const { el, parent } = stack.pop()!; // the next element
    const found = norm.indexOf(`<${el.name}`, cursor); // its start tag
    const at = found >= 0 ? found : cursor; // or where the last one was
    cursor = at + 1; // the next tag comes after it
    for (; lineCursor < at; lineCursor++) if (norm.charCodeAt(lineCursor) === 10) line++; // the line of the tag
    const add = (rule: ShareSecretFinding["rule"], kind: "secret" | "maybe", label: string): void => { out.push({ rule, kind, line, label, start: at, end: at + el.name.length + 1 }); }; // a finding at the tag
    const kids = childElements(el); // its child elements
    const text = ownText(el); // its own text
    if (el.localName === "Password" && parent?.localName === "UsernameToken" && text !== "") add("wsse-password", "secret", el.name); // a WS-Security password
    else if (el.localName === "EncryptedAssertion") add("saml-assertion", "secret", el.name); // an assertion the service provider can open
    else if (el.localName === "Assertion" && kids.some((k) => k.localName === "Signature")) add("saml-assertion", "secret", el.name); // a signed assertion
    else if (el.localName === "Response" && kids.some((k) => k.localName === "Signature") && kids.some((k) => k.localName === "Assertion")) add("saml-assertion", "secret", el.name); // a signed Response with assertions
    else if (kids.length === 0 && isSecretName(el.localName) && text !== "" && isReportableValue(text)) add("secret-name", "maybe", el.name); // a secret-looking element with a value
    for (const a of el.attributes) if (!a.isNamespace && isSecretName(a.localName) && isReportableValue(a.value)) add("secret-name", "maybe", `${el.name} ${a.name}`); // a secret-looking attribute with a value
    for (let k = kids.length - 1; k >= 0; k--) stack.push({ el: kids[k], parent: el }); // children, first on top
  } // while
  return out; // done
} // xmlShareFindings

/**
 * The secrets check for the box (the family's rules and this tool's).
 * @param input the box as pasted
 * @returns the report
 */
export function checkXmlText(input: string): ShareSecretReport {
  return findShareSecrets(input, xmlShareFindings); // checked
} // checkXmlText

/**
 * Encode from what the page already computed (whether it read the box as XML, and the check's report).
 * @param s the state
 * @param recognized whether the page read the box as XML
 * @param report the check's report on the box
 * @returns the box, nothing, or blocked
 */
export function encodeXmlShare(s: XmlShareState, recognized: boolean, report: ShareSecretReport): ShareEncoding {
  if (!recognized) return { ok: false, reason: "empty" }; // not XML: nothing to share
  return encodeCheckedBox(s.input, report); // blocked by a secret, or the box as pasted
} // encodeXmlShare

/** The spec. */
export const XML_SHARE: ShareSpec<XmlShareState> = Object.freeze({
  tool: "xml-decoder", // the slug
  posture: "input-caution", // the document as pasted, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.xml-decoder.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: XmlShareState): ShareEncoding {
    const recognized = s.input.trim() !== "" && parseXml(s.input).recognized; // as the page decides it shows a reading
    return encodeXmlShare(s, recognized, recognized ? checkXmlText(s.input) : { secrets: [], maybe: [], skipped: false }); // read, checked, encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): XmlShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});

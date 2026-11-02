// ============================================================================
// src/lib/tools/icontrol-rest-path-explainer/compute.ts
// ----------------------------------------------------------------------------
// iCONTROL REST PATH EXPLAINER - the pure engine.
//
// THE PAIR. The F5OS RESTCONF explainer built on 2026-08-12 decodes the
// PLATFORM layer (RESTCONF over YANG, VELOS and rSeries). This one decodes the
// TMOS layer: iControl REST, F5's own object model, which is what almost every
// BIG-IP script in existence actually talks to.
//
// Read together they answer the question a reader of both APIs keeps hitting:
// why the two look nothing alike. They come from different traditions, and the
// tilde is the clearest tell - a folder separator invented because a URL
// already uses the slash.
//
// SCOPE. This parses the URL text ONLY. It contacts nothing, authenticates
// against nothing, and does not know whether the object you named exists. Where
// a module is recognised it says what that module governs; where it is not, it
// says so rather than inventing a meaning.
//
// PAGE LANGUAGE (2026-11-02, batch H7): the query options' explanations, the
// notes, the warnings and the error are built as EngineTexts
// (src/lib/tools/engine-text.ts): a stable id, the English exactly as before,
// and their values. decodeIControlPathLocalisable() returns them as such for
// the page (pack keys tools.icontrol-rest-path-explainer.engine.<id>);
// decodeIControlPath() and run(), the API's and the golden vectors' functions,
// return plainText() of the same reading, so the API's JSON is byte for byte
// what it was. A module's description is a catalogue text the page looks up by
// module name (engine.module.<module>; scripts/check-engine-catalogue.mts keeps
// the en pack equal to MODULES). An IControlPathError keeps its class, code and
// message and carries its sentence.
// ============================================================================

import { say, plainText, keySegment, withEngineText, type EngineText } from "../engine-text"; // sentences with ids (2026-11-02)

/** A TMOS module and what lives under it. */
export interface ModuleFact {
  module: string;
  governs: string;
}

/** The decoded object path (the tilde-encoded part). */
export interface ObjectPath {
  /** Raw text as typed, still tilde-encoded. */
  raw: string;
  /** The administrative partition, when the path carried one. */
  partition?: string;
  /** Folders between the partition and the object name, in order. */
  folders: string[];
  /** The object's own name. */
  name: string;
  /** The equivalent tmsh path, e.g. /Common/web_pool. */
  tmsh: string;
}

/** One recognised query option. S: string in the API's reading, EngineText in the page's (2026-11-02). */
export interface QueryOption<S = string> {
  key: string;
  value: string;
  explain: S; // what the option does, or that it is not recognised
}

/** The decoded path. S: string in the API's reading, EngineText in the page's (2026-11-02). */
export interface IControlDecode<S = string> {
  normalisedPath: string;
  host?: string;
  /** True when the path begins with the /mgmt root. */
  isMgmt: boolean;
  /** `tm` for the configuration tree, `shared` for the shared worker space. */
  root?: string;
  module?: ModuleFact;
  /** Unrecognised module name, when the module is not in the table. */
  unknownModule?: string;
  /** The collection segments after the module, e.g. ["pool"] or ["virtual"]. */
  collection: string[];
  /** The object, when one was addressed rather than a whole collection. */
  object?: ObjectPath;
  /** Sub-collection addressed after the object, e.g. "members". */
  subCollection?: string;
  /** A member or nested object addressed inside the sub-collection. */
  subObject?: ObjectPath;
  options: QueryOption<S>[]; // in the order typed
  notes: S[]; // worth knowing
  warnings: S[]; // check this
}

/**
 * TMOS modules. Short, and honest about being short: an unrecognised module is
 * reported as unrecognised rather than described from a guess.
 */
const MODULES: readonly ModuleFact[] = Object.freeze([
  { module: "ltm", governs: "Local Traffic Manager: virtual servers, pools, monitors, profiles, iRules, persistence" },
  { module: "gtm", governs: "Global Traffic Manager, now DNS: wide IPs, pools, data centres, servers, topology" },
  { module: "net", governs: "networking: VLANs, self IPs, route domains, trunks, tunnels, ARP" },
  { module: "sys", governs: "system: files, licences, provisioning, NTP, DNS resolvers, database variables, iApps" },
  { module: "security", governs: "AFM, ASM and DoS configuration: firewall rules, policies, protection profiles" },
  { module: "asm", governs: "Application Security Manager: WAF policies, signatures, learning suggestions" },
  { module: "apm", governs: "Access Policy Manager: access profiles, policies, SSO, connectivity" },
  { module: "auth", governs: "authentication of administrators: users, roles, partitions, remote auth sources" },
  { module: "cm", governs: "configuration management: devices, device groups, trust domains, failover" },
  { module: "analytics", governs: "AVR: statistics collection profiles and reports" },
  { module: "pem", governs: "Policy Enforcement Manager: subscriber policies and classification" },
  { module: "vcmp", governs: "virtual clustered multiprocessing: guests and their resource allocation" },
]);
const MODULE_INDEX = new Map(MODULES.map((m) => [m.module, m]));

/** Query options iControl REST understands (exported 2026-11-02 for the catalogue guard; pack keys engine.option.<keySegment(key)>). */
export const OPTION_HELP: Record<string, string> = {
  $select: "Returns only the named properties instead of the whole object. The single most effective way to reduce a large response.",
  $filter: "Filters a collection server-side. Commonly used as partition eq Common to restrict results to one partition.",
  $top: "Returns at most this many items from a collection.",
  $skip: "Skips this many items, used with $top to page through a large collection.",
  expandSubcollections: "When true, inlines sub-collections such as pool members instead of returning links to them. Convenient and expensive: it can multiply the response size.",
  options: "Passes tmsh-style options through, for example options=recursive.",
  ver: "Pins the response to a specific TMOS version's schema.",
};

/** What an option the table does not hold gets (2026-11-02: named, for the catalogue guard; pack key engine.option.unknown). */
export const UNKNOWN_OPTION_EXPLAIN = `Not a query option this tool recognises. It is passed through as typed and nothing is claimed about its effect.`; // as the engine always wrote it

export class IControlPathError extends Error {
  code: "empty";
  constructor(message: string) {
    super(message);
    this.name = "IControlPathError";
    this.code = "empty";
  }
}

/** Decode the tilde-encoded object path into partition, folders and name. */
function decodeObject(raw: string): ObjectPath {
  const decoded = decodeURIComponent(raw);
  if (!decoded.startsWith("~")) {
    // An unqualified name: no partition given, so the device resolves it in the
    // caller's current partition. Worth stating, because it is a common source
    // of "the object is not there" when a script runs as a different user.
    return { raw, folders: [], name: decoded, tmsh: decoded };
  }
  const parts = decoded.split("~").filter((p) => p.length > 0);
  const partition = parts[0];
  const name = parts[parts.length - 1];
  const folders = parts.slice(1, -1);
  return { raw, partition, folders, name, tmsh: `/${parts.join("/")}` };
}

/** Decode an iControl REST URL or path (the API's reading: every sentence as its English, exactly as before 2026-11-02). */
export function decodeIControlPath(input: string): IControlDecode {
  return plainText(decodeIControlPathLocalisable(input)); // the same reading, sentences as their English
} // decodeIControlPath

/**
 * The page's reading: the same as decodeIControlPath(), with every explanation, note and warning an EngineText.
 * @param input the path or URL as typed
 * @returns the reading; throws an IControlPathError (carrying its sentence) for empty input
 */
export function decodeIControlPathLocalisable(input: string): IControlDecode<EngineText> {
  const trimmed = (input ?? "").trim();
  if (!trimmed) { // nothing typed
    const m = say("err.empty", "Nothing to decode: paste an iControl REST path."); // pack key engine.err.empty
    throw withEngineText(new IControlPathError(m.text), m); // same class, code and message, plus the sentence
  } // nothing typed

  const notes: EngineText[] = []; // in order
  const warnings: EngineText[] = []; // in order

  let host: string | undefined;
  let rest = trimmed;
  const url = /^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)([^/]+)(\/.*)?$/.exec(trimmed);
  if (url) {
    host = url[2];
    rest = url[3] ?? "/";
  }

  // Split the query string off before touching the path.
  const qIndex = rest.indexOf("?");
  const query = qIndex >= 0 ? rest.slice(qIndex + 1) : "";
  if (qIndex >= 0) rest = rest.slice(0, qIndex);
  if (!rest.startsWith("/")) rest = `/${rest}`;

  const options: QueryOption<EngineText>[] = []; // in the order typed
  for (const pair of query.split("&").filter(Boolean)) {
    const eq = pair.indexOf("=");
    const key = eq >= 0 ? pair.slice(0, eq) : pair;
    const value = eq >= 0 ? decodeURIComponent(pair.slice(eq + 1)) : "";
    // The table's text, or the not-recognised line. Until 2026-11-02 a key named like an Object prototype member
    // (constructor, toString, __proto__) read that member and the API omitted its explanation; own entries only now.
    const help: unknown = Object.hasOwn(OPTION_HELP, key) ? OPTION_HELP[key] : undefined; // the table's own entry, if any (since 2026-11-02 a key named like a prototype member reads as not recognised)
    const explain = help === undefined || help === null // not in the table
      ? say("option.unknown", UNKNOWN_OPTION_EXPLAIN) // pack key engine.option.unknown
      : typeof help === "string" ? say(`option.${keySegment(key)}`, help) : (help as EngineText); // pack key engine.option.<key>; a prototype member as it is
    options.push({
      key,
      value,
      explain,
    });
  }

  const parts = rest.split("/").filter(Boolean);
  const isMgmt = parts[0] === "mgmt";
  if (!isMgmt) {
    warnings.push(say("warn.notMgmt", "The path does not begin with /mgmt, so this may not be an iControl REST path. It is decoded below on the assumption that it is.")); // pack key engine.warn.notMgmt
  }

  const root = parts[1];
  if (root === "shared") {
    notes.push(say("note.shared", "The /mgmt/shared tree is the shared worker space - iApps LX, file transfer, licensing and similar - rather than the TMOS configuration tree under /mgmt/tm.")); // pack key engine.note.shared
  } else if (root && root !== "tm") {
    warnings.push(say("warn.root", `The root after /mgmt is "${root}". The configuration tree is /mgmt/tm and the shared worker space is /mgmt/shared.`, { root })); // pack key engine.warn.root
  }

  const body = parts.slice(2);
  let module: ModuleFact | undefined;
  let unknownModule: string | undefined;
  if (body.length > 0 && root === "tm") {
    const known = MODULE_INDEX.get(body[0]);
    if (known) module = known;
    else unknownModule = body[0];
  }

  // Everything after the module: collection segments, then possibly an object,
  // then possibly a sub-collection and a member.
  const after = root === "tm" ? body.slice(1) : body;
  const collection: string[] = [];
  let object: ObjectPath | undefined;
  let subCollection: string | undefined;
  let subObject: ObjectPath | undefined;

  for (const seg of after) {
    const looksLikeObject = seg.includes("~") || (collection.length > 0 && !object && /[._-]|\d/.test(seg));
    if (!object && !looksLikeObject) {
      collection.push(seg);
    } else if (!object) {
      object = decodeObject(seg);
    } else if (!subCollection) {
      subCollection = seg;
    } else if (!subObject) {
      subObject = decodeObject(seg);
    } else {
      collection.push(seg);
    }
  }

  if (object && !object.partition) {
    notes.push(say("note.noPartition", "The object name carries no partition. The device resolves it in the caller's current partition, which is why the same request can succeed for one administrator and return a 404 for another.")); // pack key engine.note.noPartition
  }
  if (object?.partition) {
    notes.push(say("note.tilde", "The tilde is a folder separator. A URL already uses the slash for its own structure, so iControl REST encodes the partition and folder path with tildes instead - which is why ~Common~web_pool means /Common/web_pool.")); // pack key engine.note.tilde
  }
  if (subCollection === "members") {
    notes.push(say("note.members", "Pool members are a sub-collection. They are not returned with the pool unless expandSubcollections is set, which is the usual reason a script sees a pool with no members.")); // pack key engine.note.members
  }

  return { normalisedPath: rest, host, isMgmt, root, module, unknownModule, collection, object, subCollection, subObject, options, notes, warnings };
}

/** Every module this tool can describe, for the reference panel. */
export function knownModules(): readonly ModuleFact[] {
  return MODULES;
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: string): IControlDecode {
  return decodeIControlPath(input);
}

// ============================================================================
// SHARE RESULTS: the copy a link carries (2026-10-27)
// ----------------------------------------------------------------------------
// A path can carry a credential, and a Share results link never carries one as
// typed. shareablePath() returns the text with:
//   - the auth token in /mgmt/shared/authz/tokens/<token>: F5's AS3 and
//     Declarative Onboarding guides (clouddocs, "Authentication and
//     Authorization", read 2026-10-27) extend a token with
//     "PATCH /mgmt/shared/authz/tokens/{{ bigip_auth_token }}", so the token
//     itself sits in the path. It is masked with its shape kept (capitals to X,
//     small letters to x, digits to 0, anything else as it is), so the page
//     still reads it as the object it addressed;
//   - the password of a user:password@ before the host: RFC 3986 section
//     3.2.1 (read 2026-10-27): applications "should not render as clear text
//     any data after the first colon" of a userinfo. It becomes SHARE_REDACTED;
//   - the value of an X-F5-Auth-Token or Authorization header pasted with the
//     path (the same guides send the token in X-F5-Auth-Token; RFC 9110
//     section 11.6.2, read 2026-10-27: Authorization carries credentials). It
//     becomes SHARE_REDACTED.
// Everything else (the host, the module, the collection, the object names and
// the query options) stays as typed. Literal-anchored, linear patterns only.
// ============================================================================

/** What replaces a password or a header's credentials in the copy. */
export const SHARE_REDACTED = "[redacted]"; // no slash, no question mark: the path keeps its segments

/** The token segment after /mgmt/shared/authz/tokens/. */
const RE_SHARE_TOKEN = /(\/mgmt\/shared\/authz\/tokens\/)([^/?#\s]+)/gi; // literal anchor, one negated class

/** A URL's scheme and authority, to find a userinfo password. */
const RE_SHARE_AUTHORITY = /^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)([^/\s]+)/; // anchored, as decodeIControlPath reads the host

/** An X-F5-Auth-Token or Authorization header and its value (a scheme and its credentials, or one word). */
const RE_SHARE_HEADER = /((?:x-f5-auth-token|proxy-authorization|authorization)[ \t]*:[ \t]*)((?:basic|bearer|digest|negotiate)[ \t]+[^\s'"]+|[^\s'"]+)/gi; // literal anchor; each alternative bounded by its class

/**
 * Mask a token, keeping its shape: capitals become X, small letters x, digits 0; a percent escape (%HH) stays, so the
 * path still decodes; anything else stays too.
 * @param s the token
 * @returns the masked token, the same length
 */
export function maskToken(s: string): string {
  return s.replace(/%[0-9A-Fa-f]{2}|[A-Za-z0-9]/g, (c) => (c.length === 3 ? c : /[A-Z]/.test(c) ? "X" : /[a-z]/.test(c) ? "x" : "0")); // one linear pass
} // maskToken

/** The copy a Share results link carries. */
export interface ShareablePath {
  /** The text with every credential replaced. */
  text: string;
  /** How many values were replaced. */
  redacted: number;
}

/**
 * The shareable copy of a typed path. Pure and total: it never throws, and a path without a credential comes back
 * unchanged.
 * @param input the path or URL as typed
 * @returns the copy, and how many values it replaced
 */
export function shareablePath(input: string): ShareablePath {
  let redacted = 0; // values replaced
  let text = input.replace(RE_SHARE_TOKEN, (_m, head: string, tok: string) => { const t = maskToken(tok); if (t !== tok) redacted++; return head + t; }); // the token in the path
  text = text.replace(RE_SHARE_HEADER, (m, head: string, value: string) => { if (value === SHARE_REDACTED) return m; redacted++; return head + SHARE_REDACTED; }); // a header's credentials
  const lead = /^\s*/.exec(text)![0]; // white space before the URL, kept
  const a = RE_SHARE_AUTHORITY.exec(text.slice(lead.length)); // the scheme and authority, as the page reads them
  if (a) { // a URL with an authority
    const at = a[2].lastIndexOf("@"); // the end of a userinfo, if any
    const colon = at > 0 ? a[2].indexOf(":") : -1; // the userinfo's first colon
    if (at > 0 && colon >= 0 && colon < at) { // user:password@
      const pw = a[2].slice(colon + 1, at); // the password
      if (pw !== "" && pw !== SHARE_REDACTED) { // something to replace
        const start = lead.length + a[1].length + colon + 1; // where it starts in the text
        text = text.slice(0, start) + SHARE_REDACTED + text.slice(start + pw.length); // replaced
        redacted++; // counted
      } // something to replace
    } // a userinfo password
  } // a URL
  return { text, redacted }; // the copy
} // shareablePath

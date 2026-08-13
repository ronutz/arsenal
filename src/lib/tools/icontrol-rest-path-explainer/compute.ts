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
// ============================================================================

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

/** One recognised query option. */
export interface QueryOption {
  key: string;
  value: string;
  explain: string;
}

export interface IControlDecode {
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
  options: QueryOption[];
  notes: string[];
  warnings: string[];
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

/** Query options iControl REST understands. */
const OPTION_HELP: Record<string, string> = {
  $select: "Returns only the named properties instead of the whole object. The single most effective way to reduce a large response.",
  $filter: "Filters a collection server-side. Commonly used as partition eq Common to restrict results to one partition.",
  $top: "Returns at most this many items from a collection.",
  $skip: "Skips this many items, used with $top to page through a large collection.",
  expandSubcollections: "When true, inlines sub-collections such as pool members instead of returning links to them. Convenient and expensive: it can multiply the response size.",
  options: "Passes tmsh-style options through, for example options=recursive.",
  ver: "Pins the response to a specific TMOS version's schema.",
};

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

/** Decode an iControl REST URL or path. */
export function decodeIControlPath(input: string): IControlDecode {
  const trimmed = (input ?? "").trim();
  if (!trimmed) throw new IControlPathError("Nothing to decode: paste an iControl REST path.");

  const notes: string[] = [];
  const warnings: string[] = [];

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

  const options: QueryOption[] = [];
  for (const pair of query.split("&").filter(Boolean)) {
    const eq = pair.indexOf("=");
    const key = eq >= 0 ? pair.slice(0, eq) : pair;
    const value = eq >= 0 ? decodeURIComponent(pair.slice(eq + 1)) : "";
    options.push({
      key,
      value,
      explain: OPTION_HELP[key] ?? `Not a query option this tool recognises. It is passed through as typed and nothing is claimed about its effect.`,
    });
  }

  const parts = rest.split("/").filter(Boolean);
  const isMgmt = parts[0] === "mgmt";
  if (!isMgmt) {
    warnings.push("The path does not begin with /mgmt, so this may not be an iControl REST path. It is decoded below on the assumption that it is.");
  }

  const root = parts[1];
  if (root === "shared") {
    notes.push("The /mgmt/shared tree is the shared worker space - iApps LX, file transfer, licensing and similar - rather than the TMOS configuration tree under /mgmt/tm.");
  } else if (root && root !== "tm") {
    warnings.push(`The root after /mgmt is "${root}". The configuration tree is /mgmt/tm and the shared worker space is /mgmt/shared.`);
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
    notes.push("The object name carries no partition. The device resolves it in the caller's current partition, which is why the same request can succeed for one administrator and return a 404 for another.");
  }
  if (object?.partition) {
    notes.push("The tilde is a folder separator. A URL already uses the slash for its own structure, so iControl REST encodes the partition and folder path with tildes instead - which is why ~Common~web_pool means /Common/web_pool.");
  }
  if (subCollection === "members") {
    notes.push("Pool members are a sub-collection. They are not returned with the pool unless expandSubcollections is set, which is the usual reason a script sees a pool with no members.");
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

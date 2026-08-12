// ============================================================================
// src/lib/tools/f5os-restconf-path-explainer/compute.ts
// ----------------------------------------------------------------------------
// F5OS RESTCONF PATH EXPLAINER - the pure engine.
//
// WHAT THIS IS FOR (catalogue rank 18, the highest-ranked queued F5 item).
// F5OS - the platform layer on VELOS and rSeries - is driven by RESTCONF over
// YANG, not by iControl REST over a TMOS object model. A reader who knows
// BIG-IP well arrives at a path like
//
//     /restconf/data/f5-tenants:tenants/tenant=tenant1/config/running-state
//
// and has no way to tell which part is a module, which is a container, which
// is a list key, and why the module name appears twice in some paths and once
// in others. That is a vocabulary problem rather than a difficulty problem,
// and it is exactly the sort of thing a deterministic explainer fixes.
//
// SCOPE AND HONESTY. This parses the PATH ONLY. It contacts nothing (zero
// egress), resolves no schema, and does not validate that a node exists in any
// particular F5OS release - it cannot, because it has no schema to check
// against. Where it recognises a module it says what that module governs;
// where it does not, it says the module is unrecognised rather than guessing.
// A tool that invents a meaning for an unknown node is worse than one that
// admits the gap.
// ============================================================================

/** A single decoded segment of the path. */
export interface PathSegment {
  /** The raw text of this segment, exactly as the user typed it. */
  raw: string;
  /** What this segment is: a module-qualified node, a plain node, or a keyed list entry. */
  kind: "module-qualified" | "node" | "list-key";
  /** The YANG module prefix, when the segment carried one (`f5-tenants`). */
  module?: string;
  /** The node name with any module prefix and key predicate removed. */
  node: string;
  /** For a keyed list entry, the key value (`tenant1` in `tenant=tenant1`). */
  keyValue?: string;
  /** Plain explanation of this segment. */
  explain: string;
}

/** What a recognised YANG module governs. */
export interface ModuleFact {
  module: string;
  origin: "openconfig" | "f5";
  governs: string;
}

/** The full decode. */
export interface F5osPathDecode {
  /** The input after trimming, with any scheme/host and query string removed. */
  normalisedPath: string;
  /** The scheme and authority, when the input was a full URL. */
  host?: string;
  /** The port, when one was present - this is the interesting part on F5OS. */
  port?: string;
  /** The API root recognised: RESTCONF proper, or the F5OS 1.8+ /api alias. */
  root: "restconf" | "api" | "unknown";
  /** `data` for the datastore, `operations` for RPCs, etc. */
  rootResource?: string;
  segments: PathSegment[];
  /** Modules recognised in this path, in order of first appearance. */
  modules: ModuleFact[];
  /** Modules referenced but not in the known table. */
  unknownModules: string[];
  /** Observations worth surfacing: port duality, missing module prefix, and so on. */
  notes: string[];
  /** Anything that looks wrong rather than merely unrecognised. */
  warnings: string[];
}

/**
 * The modules this tool can speak about, from the catalogue specification.
 * Deliberately SHORT and deliberately honest: these are the ones named in the
 * F5OS documentation this entry was written against. An unrecognised module is
 * reported as unrecognised, never described from a guess.
 */
const KNOWN_MODULES: readonly ModuleFact[] = Object.freeze([
  { module: "openconfig-system", origin: "openconfig", governs: "system-level configuration and state: hostname, clock, DNS, AAA, logging" },
  { module: "openconfig-interfaces", origin: "openconfig", governs: "physical and logical interfaces, their configuration and counters" },
  { module: "openconfig-vlan", origin: "openconfig", governs: "VLAN definitions and interface membership" },
  { module: "openconfig-platform", origin: "openconfig", governs: "hardware inventory: chassis components, slots, transceivers" },
  { module: "openconfig-lacp", origin: "openconfig", governs: "link aggregation control protocol groups and members" },
  { module: "f5-tenants", origin: "f5", governs: "tenants: the guest BIG-IP instances a VELOS or rSeries system hosts" },
  { module: "f5-system-partition", origin: "f5", governs: "chassis partitions on VELOS - a group of blades presented as one system" },
  { module: "f5-system-slot", origin: "f5", governs: "slot assignment: which blade belongs to which partition or tenant" },
  { module: "f5-tenant-images", origin: "f5", governs: "the tenant image inventory available to launch instances from" },
  { module: "f5-system-image", origin: "f5", governs: "F5OS platform images on the controller itself" },
  { module: "f5-cluster", origin: "f5", governs: "controller clustering and node roles" },
  { module: "f5-utils-file-transfer", origin: "f5", governs: "file import and export operations on the platform" },
]);

const MODULE_INDEX = new Map(KNOWN_MODULES.map((m) => [m.module, m]));

/** Thrown for input that cannot be treated as a path at all. */
export class F5osPathError extends Error {
  code: "empty" | "not-a-path";
  constructor(code: "empty" | "not-a-path", message: string) {
    super(message);
    this.name = "F5osPathError";
    this.code = code;
  }
}

/**
 * Decode an F5OS RESTCONF path.
 *
 * Accepts a bare path (`/restconf/data/...`), a full URL
 * (`https://host:8888/restconf/data/...`), or a path with a query string.
 */
export function decodeF5osPath(input: string): F5osPathDecode {
  const trimmed = (input ?? "").trim();
  if (!trimmed) {
    throw new F5osPathError("empty", "Nothing to decode: paste an F5OS RESTCONF path.");
  }

  const notes: string[] = [];
  const warnings: string[] = [];

  // --- strip scheme + authority if this is a full URL -----------------------
  let host: string | undefined;
  let port: string | undefined;
  let rest = trimmed;

  const urlMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)([^/]+)(\/.*)?$/.exec(trimmed);
  if (urlMatch) {
    host = urlMatch[2];
    rest = urlMatch[3] ?? "/";
    const portMatch = /:(\d+)$/.exec(host);
    if (portMatch) port = portMatch[1];
  }

  // Drop any query string or fragment. RESTCONF query parameters (depth,
  // fields, content) are real, but they qualify the request rather than
  // identify the resource, and this tool is about the resource.
  const queryIndex = rest.search(/[?#]/);
  if (queryIndex >= 0) {
    notes.push(
      "A query string was present and has been set aside. RESTCONF query parameters such as depth, fields and content qualify the request; they do not change which resource the path identifies.",
    );
    rest = rest.slice(0, queryIndex);
  }

  if (!rest.startsWith("/")) rest = `/${rest}`;
  const normalisedPath = rest;

  // --- the port duality, which is the F5OS-specific trap --------------------
  if (port === "8888") {
    notes.push(
      "Port 8888 is the original F5OS RESTCONF listener. From F5OS 1.8 the same API is also reachable on the standard HTTPS port under /api, so a path written against 8888 and one written against 443 can address the identical resource.",
    );
  } else if (port === "443") {
    notes.push(
      "Port 443 with the /api prefix is the F5OS 1.8+ arrangement, equivalent to the original listener on 8888 under /restconf.",
    );
  }

  // --- split and identify the root -----------------------------------------
  const parts = normalisedPath.split("/").filter((p) => p.length > 0);

  let root: F5osPathDecode["root"] = "unknown";
  let rootResource: string | undefined;
  let bodyStart = 0;

  if (parts[0] === "restconf") {
    root = "restconf";
    rootResource = parts[1];
    bodyStart = 2;
  } else if (parts[0] === "api") {
    root = "api";
    rootResource = parts[1];
    bodyStart = 2;
    notes.push(
      "The /api root is the F5OS 1.8+ alias for /restconf on the standard HTTPS port.",
    );
  } else {
    warnings.push(
      "The path does not begin with /restconf or /api, so this may not be an F5OS API path. The segments below are decoded on the assumption that it is.",
    );
  }

  if (rootResource && rootResource !== "data" && rootResource !== "operations") {
    warnings.push(
      `The root resource is "${rootResource}". F5OS paths normally address /data for the configuration and state datastore, or /operations for RPCs.`,
    );
  }
  if (rootResource === "operations") {
    notes.push(
      "This is an RPC path rather than a datastore path: it invokes an operation rather than reading or writing a node.",
    );
  }

  // --- decode each remaining segment ---------------------------------------
  const segments: PathSegment[] = [];
  const modulesSeen: ModuleFact[] = [];
  const unknownModules: string[] = [];
  let lastModule: string | undefined;

  for (const raw of parts.slice(bodyStart)) {
    // A list key looks like `tenant=tenant1` or `interface=1.0`.
    const eq = raw.indexOf("=");
    const beforeEq = eq >= 0 ? raw.slice(0, eq) : raw;
    const keyValue = eq >= 0 ? decodeURIComponent(raw.slice(eq + 1)) : undefined;

    // A module-qualified node looks like `f5-tenants:tenants`.
    const colon = beforeEq.indexOf(":");
    const moduleName = colon >= 0 ? beforeEq.slice(0, colon) : undefined;
    const node = colon >= 0 ? beforeEq.slice(colon + 1) : beforeEq;

    if (moduleName) {
      lastModule = moduleName;
      const known = MODULE_INDEX.get(moduleName);
      if (known && !modulesSeen.some((m) => m.module === moduleName)) {
        modulesSeen.push(known);
      } else if (!known && !unknownModules.includes(moduleName)) {
        unknownModules.push(moduleName);
      }
    }

    let kind: PathSegment["kind"];
    let explain: string;

    if (keyValue !== undefined) {
      kind = "list-key";
      explain = `Selects one entry from the "${node}" list, the one whose key is "${keyValue}". In RESTCONF a list entry is addressed by its key in the path itself rather than by a query parameter.`;
    } else if (moduleName) {
      kind = "module-qualified";
      const known = MODULE_INDEX.get(moduleName);
      explain = known
        ? `The node "${node}", qualified by the YANG module "${moduleName}" (${known.governs}).`
        : `The node "${node}", qualified by the YANG module "${moduleName}". That module is not in this tool's table, so nothing is claimed about what it governs.`;
    } else {
      kind = "node";
      explain = lastModule
        ? `A container or leaf named "${node}", inside the module qualified earlier in the path. Only the FIRST node of a module needs the module prefix; the nodes below it inherit it.`
        : `A container or leaf named "${node}".`;
    }

    segments.push({ raw, kind, module: moduleName, node, keyValue, explain });
  }

  if (segments.length === 0) {
    warnings.push("No addressable nodes were found after the API root.");
  }

  // The prefixing convention is the single most confusing thing about these
  // paths for somebody arriving from iControl REST, so it is stated whenever
  // the path actually demonstrates it.
  const qualified = segments.filter((s) => s.module).length;
  if (qualified > 0 && segments.length > qualified) {
    notes.push(
      "Note the module:node prefixing convention: a module prefix appears when the path crosses into that module's tree, and the nodes beneath it are written bare. A prefix reappearing mid-path means the path has crossed into a different module.",
    );
  }

  if (unknownModules.length > 0) {
    notes.push(
      `Unrecognised module ${unknownModules.length === 1 ? "prefix" : "prefixes"}: ${unknownModules.join(", ")}. The structure is still decoded; only the description of what the module governs is withheld.`,
    );
  }

  return {
    normalisedPath,
    host,
    port,
    root,
    rootResource,
    segments,
    modules: modulesSeen,
    unknownModules,
    notes,
    warnings,
  };
}

/** Every module this tool can describe, for the reference panel. */
export function knownModules(): readonly ModuleFact[] {
  return KNOWN_MODULES;
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: string): F5osPathDecode {
  return decodeF5osPath(input);
}

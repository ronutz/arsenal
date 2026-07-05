// ============================================================================
// src/lib/tools/telemetry-streaming-explainer/compute.ts
// ----------------------------------------------------------------------------
// F5 BIG-IP TS (Telemetry Streaming) DECLARATION EXPLAINER + STRUCTURAL
// VALIDATOR (arsenal-local, pure, deterministic).
//
// Paste a TS declaration (the JSON you POST to /mgmt/shared/telemetry/declare)
// and this reads it back to you: it confirms the top-level Telemetry class,
// reads the optional Controls (log level, debug/memoryMonitor), and walks every
// named class-object grouped by its ROLE in the telemetry pipeline: the DATA
// SOURCES that produce telemetry (a Telemetry_System with its systemPoller or
// iHealthPoller, a standalone Telemetry_System_Poller, or a Telemetry_Listener
// that ingests events), the CONSUMERS that forward it out (Telemetry_Consumer
// push consumers like Splunk / Azure / AWS / DataDog / Generic HTTP, or
// Telemetry_Pull_Consumer pull consumers like Prometheus), and the supporting
// classes (Telemetry_Namespace grouping, Telemetry_Endpoints custom endpoints).
// Every class is named and explained. It also checks the STRUCTURAL rules the
// docs describe, and flags the pipeline gaps that make a declaration succeed
// but collect or forward nothing.
//
// SCOPE. This is a structure explainer and sanity checker, NOT a full
// JSON-Schema validator: it does not reproduce the entire TS schema or check
// every property, so a declaration that passes here can still be rejected by
// TS itself (validate against the published schema for that). It never contacts
// a BIG-IP and never fetches; the same input always yields the same output
// (D-49).
//
// TS is the third F5 Automation Toolchain declarative extension alongside AS3
// (application services) and DO (device onboarding). Where AS3 and DO CONFIGURE
// the box, TS OBSERVES it: it aggregates, normalizes, and forwards statistics
// and events from the BIG-IP to a consumer application. Same declarative model
// (POST one JSON document), different job.
//
// GROUNDING (see index.ts `sources`, fetched 2026-07-05 from clouddocs, TS
// 1.41.0 / 1.42.0): the top-level Telemetry class and the base declaration
// (quick-start.html); the class inventory Telemetry_System / _System_Poller /
// _Listener / _Consumer / _Pull_Consumer / _Namespace / _Endpoints and the full
// push + pull consumer type catalogue (using-ts.html); the Controls class with
// logLevel default info (quick-start.html) and the memoryMonitor beta
// (memory-monitor.html); the endpoints /mgmt/shared/telemetry/declare and
// /mgmt/shared/telemetry/info (quick-start.html); the troubleshooting rule that
// a Telemetry_System used for metrics must have systemPoller defined and that
// event ingest needs a Telemetry_Listener (troubleshooting.html); the default
// Listener port 6514 and Consumer protocol default http (quick-start.html).
// Nothing here is invented from memory.
// ============================================================================

const MAX_INPUT = 200_000; // generous; declarations are JSON, not payloads

export type DocKind = "telemetry" | "not-telemetry";

// The role a TS class plays in the telemetry pipeline. This drives the walk
// grouping: sources produce telemetry, consumers forward it, control/support
// classes shape and group the rest. A working declaration needs at least one
// SOURCE and at least one CONSUMER, or it succeeds while doing nothing useful.
export type Role = "source" | "consumer" | "control" | "support" | "other";

interface ClassInfo {
  readonly role: Role;
  readonly explain: string;
}

// Catalog of TS classes. Explanations are paraphrased from F5's TS user guide
// and schema reference; the list covers every class in the standard examples
// plus the documented extras, and is representative rather than exhaustive
// (unknown classes are still reported).
const CLASS_CATALOG: Record<string, ClassInfo> = {
  // Control.
  Controls: { role: "control", explain: "optional top-level controls for logging and debugging (logLevel, debug, and the beta memoryMonitor); the class value must always be Controls" },
  // Data sources: they produce telemetry.
  Telemetry_System: { role: "source", explain: "a target system to poll; define a systemPoller inside it to collect and normalize device, virtual-server, pool, and pool-member statistics on an interval, and optionally an iHealthPoller" },
  Telemetry_System_Poller: { role: "source", explain: "a standalone (referenced) system poller, e.g. to pull statistics from an additional BIG-IP by host/username/passphrase" },
  Telemetry_Listener: { role: "source", explain: "an event listener on TCP and UDP (default port 6514) that ingests logs and events the BIG-IP publishes (LTM request logs, AFM/ASM security logs)" },
  // Consumers: they forward telemetry out.
  Telemetry_Consumer: { role: "consumer", explain: "a push consumer that forwards telemetry to an external system; the type selects the target (Splunk, Azure Log Analytics, AWS CloudWatch/S3, Graphite, Kafka, ElasticSearch, DataDog, Generic HTTP, OpenTelemetry, and more)" },
  Telemetry_Pull_Consumer: { role: "consumer", explain: "a pull consumer that exposes telemetry for an external system to scrape on demand rather than pushing (e.g. the Prometheus pull consumer); added in TS 1.11" },
  // Supporting structure.
  Telemetry_Namespace: { role: "support", explain: "a namespace that groups a set of pollers, listeners, and consumers so they operate as an isolated unit (objects inside a namespace only see each other)" },
  Telemetry_Endpoints: { role: "support", explain: "a reusable set of custom TMSH/REST endpoints a system poller can query, for statistics beyond the default output" },
  iHealth_Poller: { role: "source", explain: "an iHealth poller (referenced form) that creates a QKView, uploads it to the F5 iHealth Service, and fetches the analysis; must be attached to a Telemetry_System" },
};

// The full push-consumer type catalogue, verbatim from the TS user guide
// (using-ts.html, TS 1.42.0). Used to confirm a Telemetry_Consumer.type is a
// real target and to name it back; an unrecognized type is still reported.
const PUSH_CONSUMER_TYPES = new Set<string>([
  "default", "splunk", "azure_log_analytics", "azure_application_insights",
  "aws_cloudwatch", "aws_s3", "graphite", "kafka", "elasticsearch",
  "sumo_logic", "statsd", "generic_http", "fluentd",
  "google_cloud_monitoring", "google_cloud_logging", "f5_cloud",
  "datadog", "opentelemetry_exporter",
]);
// Pull-consumer types (pull-consumers.html): Default and Prometheus.
const PULL_CONSUMER_TYPES = new Set<string>(["default", "prometheus"]);

export type FindingKind =
  | { kind: "parse-error"; detail: string }
  | { kind: "not-telemetry" }
  | { kind: "no-source" }
  | { kind: "no-consumer" }
  | { kind: "system-without-poller"; name: string }
  | { kind: "consumer-missing-type"; name: string }
  | { kind: "consumer-unknown-type"; name: string; type: string }
  | { kind: "namespaces-present" }
  | { kind: "controls-note"; logLevel: string };
export type Finding = FindingKind;

export interface ObjectInfo {
  readonly name: string;      // the declaration key
  readonly className: string; // its "class"
  readonly role: Role;
  readonly explain: string;
  readonly unknown: boolean;  // class not in the catalog
  readonly notes: readonly string[]; // per-object notes (e.g. consumer type, poller present)
}

export interface RoleGroup {
  readonly role: Role;
  readonly label: string;
  readonly objects: readonly ObjectInfo[];
}

export interface ControlsInfo {
  readonly logLevel: string | null;
  readonly debug: boolean | null;
  readonly memoryMonitor: boolean;
}

export interface TsStats {
  readonly totalObjects: number;
  readonly sources: number;
  readonly consumers: number;
  readonly namespaces: number;
  readonly hasNamespaces: boolean;
}

export interface TsResult {
  readonly kind: DocKind;
  readonly controls: ControlsInfo | null;
  readonly groups: readonly RoleGroup[];
  readonly findings: readonly Finding[];
  readonly stats: TsStats;
}

// Human-facing order + labels for the role groups.
export const ROLE_ORDER: readonly Role[] = ["source", "consumer", "support", "control", "other"];
export const ROLE_LABEL: Record<Role, string> = {
  source: "Data sources (produce telemetry)",
  consumer: "Consumers (forward telemetry out)",
  support: "Grouping and endpoints",
  control: "Controls",
  other: "Other classes",
};

export const KNOWN_CLASSES = Object.freeze(Object.keys(CLASS_CATALOG));

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Normalize a consumer type for catalogue lookup: TS types are matched
// case-insensitively here (e.g. "Splunk" -> "splunk").
function normType(t: string): string {
  return t.trim().toLowerCase();
}

/**
 * Explain a TS declaration. Pure and deterministic; never throws, never
 * fetches. Returns null only for empty input.
 */
export function explainTs(input: string): TsResult | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  // Bound the work: declarations are small JSON documents.
  const slice = trimmed.length > MAX_INPUT ? trimmed.slice(0, MAX_INPUT) : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(slice);
  } catch (e) {
    return {
      kind: "not-telemetry",
      controls: null,
      groups: [],
      findings: [{ kind: "parse-error", detail: e instanceof Error ? e.message : "invalid JSON" }],
      stats: { totalObjects: 0, sources: 0, consumers: 0, namespaces: 0, hasNamespaces: false },
    };
  }

  if (!isPlainObject(parsed)) {
    return {
      kind: "not-telemetry",
      controls: null,
      groups: [],
      findings: [{ kind: "not-telemetry" }],
      stats: { totalObjects: 0, sources: 0, consumers: 0, namespaces: 0, hasNamespaces: false },
    };
  }

  // The top-level class must be Telemetry.
  const topClass = typeof parsed["class"] === "string" ? (parsed["class"] as string) : null;
  if (topClass !== "Telemetry") {
    return {
      kind: "not-telemetry",
      controls: null,
      groups: [],
      findings: [{ kind: "not-telemetry" }],
      stats: { totalObjects: 0, sources: 0, consumers: 0, namespaces: 0, hasNamespaces: false },
    };
  }

  const findings: Finding[] = [];

  // Controls (optional).
  let controls: ControlsInfo | null = null;
  const controlsRaw = parsed["controls"];
  if (isPlainObject(controlsRaw)) {
    const logLevel = typeof controlsRaw["logLevel"] === "string" ? (controlsRaw["logLevel"] as string) : null;
    const debug = typeof controlsRaw["debug"] === "boolean" ? (controlsRaw["debug"] as boolean) : null;
    const memoryMonitor = isPlainObject(controlsRaw["memoryMonitor"]);
    controls = { logLevel, debug, memoryMonitor };
    findings.push({ kind: "controls-note", logLevel: logLevel ?? "info" });
  }

  // Walk the named class-objects (every top-level key that is an object with a
  // "class", other than the reserved "controls" key which we handled above).
  const objectsByRole = new Map<Role, ObjectInfo[]>();
  let sources = 0, consumers = 0, namespaces = 0, total = 0;

  const consider = (name: string, raw: Record<string, unknown>) => {
    const className = typeof raw["class"] === "string" ? (raw["class"] as string) : "(no class)";
    const info = CLASS_CATALOG[className];
    const role: Role = info?.role ?? "other";
    const explain = info?.explain ?? "a class not in this tool's catalog (reported as-is)";
    const unknown = !info;
    const notes: string[] = [];

    if (className === "Telemetry_System") {
      sources++;
      // Troubleshooting rule: a Telemetry_System used for metrics must define
      // systemPoller. Note whether it has one (or an iHealthPoller).
      const hasSystemPoller = "systemPoller" in raw && raw["systemPoller"] != null;
      const hasIHealth = "iHealthPoller" in raw && raw["iHealthPoller"] != null;
      if (!hasSystemPoller && !hasIHealth) {
        findings.push({ kind: "system-without-poller", name });
      }
    } else if (className === "Telemetry_System_Poller" || className === "Telemetry_Listener" || className === "iHealth_Poller") {
      sources++;
    } else if (className === "Telemetry_Consumer") {
      consumers++;
      const type = typeof raw["type"] === "string" ? (raw["type"] as string) : null;
      if (!type) {
        findings.push({ kind: "consumer-missing-type", name });
      } else {
        notes.push(type);
        if (!PUSH_CONSUMER_TYPES.has(normType(type))) {
          findings.push({ kind: "consumer-unknown-type", name, type });
        }
      }
    } else if (className === "Telemetry_Pull_Consumer") {
      consumers++;
      const type = typeof raw["type"] === "string" ? (raw["type"] as string) : null;
      if (!type) {
        findings.push({ kind: "consumer-missing-type", name });
      } else {
        notes.push(type);
        if (!PULL_CONSUMER_TYPES.has(normType(type))) {
          findings.push({ kind: "consumer-unknown-type", name, type });
        }
      }
    } else if (className === "Telemetry_Namespace") {
      namespaces++;
      // A namespace is itself a mini-declaration; count its inner sources and
      // consumers so the pipeline check accounts for them.
      for (const [, innerRaw] of Object.entries(raw)) {
        if (!isPlainObject(innerRaw)) continue;
        const inner = typeof innerRaw["class"] === "string" ? (innerRaw["class"] as string) : "";
        if (inner === "Telemetry_System" || inner === "Telemetry_System_Poller" || inner === "Telemetry_Listener" || inner === "iHealth_Poller") sources++;
        else if (inner === "Telemetry_Consumer" || inner === "Telemetry_Pull_Consumer") consumers++;
      }
    }

    total++;
    const list = objectsByRole.get(role) ?? [];
    list.push({ name, className, role, explain, unknown, notes });
    objectsByRole.set(role, list);
  };

  for (const [key, raw] of Object.entries(parsed)) {
    if (key === "class" || key === "controls") continue;
    if (!isPlainObject(raw)) continue;
    consider(key, raw);
  }

  // Pipeline completeness: a declaration that succeeds but has no source or no
  // consumer does nothing useful. Only meaningful once there is at least one
  // TS object at all.
  if (total > 0) {
    if (sources === 0) findings.push({ kind: "no-source" });
    if (consumers === 0) findings.push({ kind: "no-consumer" });
  }
  if (namespaces > 0) findings.push({ kind: "namespaces-present" });

  // Assemble role groups in canonical order.
  const groups: RoleGroup[] = [];
  for (const role of ROLE_ORDER) {
    const objs = objectsByRole.get(role);
    if (objs && objs.length > 0) {
      groups.push({ role, label: ROLE_LABEL[role], objects: objs });
    }
  }

  return {
    kind: "telemetry",
    controls,
    groups,
    findings,
    stats: {
      totalObjects: total,
      sources,
      consumers,
      namespaces,
      hasNamespaces: namespaces > 0,
    },
  };
}

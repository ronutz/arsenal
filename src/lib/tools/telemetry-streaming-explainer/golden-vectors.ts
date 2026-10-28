// ============================================================================
// src/lib/tools/telemetry-streaming-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the TS (Telemetry Streaming) declaration explainer. The
// positive cases use F5's OWN example declarations from the TS docs (the Quick
// Start Splunk example, the base declaration, the referenced-poller example,
// the Generic HTTP consumer, and a namespace example), so the parse and class
// recognition are pinned to shapes F5 publishes. The validation cases pin the
// documented rules and the pipeline gaps: the top-level Telemetry class, the
// source-and-consumer completeness (a declaration that succeeds while
// collecting or forwarding nothing), a Telemetry_System without its
// systemPoller (the troubleshooting doc's explicit gotcha), a Consumer missing
// its type, and namespace scoping. Checks assert on the derived result, never
// on internal representation.
//
// Source: clouddocs.f5.com/products/extensions/f5-telemetry-streaming/latest
// (quick-start.html, using-ts.html, declarations.html, troubleshooting.html),
// TS 1.41.0 / 1.42.0, fetched 2026-07-05.
//
// SHARE VECTORS (2026-10-27, Share results): SHARE_VECTORS pin the copy a
// Share results link carries (shareableDeclaration in compute.ts) byte for
// byte: every cipherText, passphrase, apiKey, privateKey and header value
// replaced by "[redacted]", everything else as pasted, and the receiving page
// reading the same declaration. The set id moved from
// telemetry-streaming-golden-v1 to telemetry-streaming-golden-2026-10-27 with
// them.
// ============================================================================

import { explainTs, KNOWN_CLASSES, shareableDeclaration } from "./compute";

export const SET_ID = "telemetry-streaming-golden-2026-10-27"; // was telemetry-streaming-golden-v1 until the share vectors (2026-10-27)

interface Vector {
  readonly id: string;
  readonly description: string;
  readonly check: () => string | null;
}
function expect(cond: boolean, msg: string): string | null {
  return cond ? null : msg;
}

// F5's Quick Start example (quick-start.html): a System with a poller, a
// Listener, and a Splunk push Consumer. A complete pipeline (source + consumer).
const QUICKSTART = JSON.stringify({
  class: "Telemetry",
  My_System: { class: "Telemetry_System", systemPoller: { interval: 60 } },
  My_Listener: { class: "Telemetry_Listener", port: 6514 },
  My_Consumer: {
    class: "Telemetry_Consumer",
    type: "Splunk",
    host: "192.168.2.1",
    protocol: "https",
    port: 8088,
    passphrase: { cipherText: "apikey" },
  },
});

// F5's base declaration (declarations.html): System poller + Splunk consumer,
// no listener. Still a complete pipeline (poller is a source).
const BASE = JSON.stringify({
  class: "Telemetry",
  My_System: { class: "Telemetry_System", systemPoller: { interval: 60 } },
  My_Listener: { class: "Telemetry_Listener", port: 6514 },
  My_Consumer: {
    class: "Telemetry_Consumer",
    type: "Splunk",
    host: "192.0.2.1",
    protocol: "https",
    port: 8088,
    passphrase: { cipherText: "apikey" },
  },
});

// F5's referenced-poller example (declarations.html): a standalone
// Telemetry_System_Poller that pulls stats from an additional BIG-IP. On its
// own it has a source but no consumer.
const REFERENCED_POLLER = JSON.stringify({
  class: "Telemetry",
  My_Poller: {
    class: "Telemetry_System_Poller",
    interval: 60,
    host: "192.0.2.1",
    port: 443,
    username: "myuser",
    passphrase: { cipherText: "mypassphrase" },
  },
});

// F5's Generic HTTP consumer example (customizing-data.html): a System poller +
// a Generic_HTTP consumer. Complete pipeline; Generic_HTTP is a known type.
const GENERIC_HTTP = JSON.stringify({
  class: "Telemetry",
  My_System: { class: "Telemetry_System", systemPoller: { interval: 60 } },
  My_Consumer: {
    class: "Telemetry_Consumer",
    type: "Generic_HTTP",
    host: "192.0.2.1",
    protocol: "http",
    port: 8080,
    path: "/bigip",
  },
});

// F5's namespace + proxy example (declarations.html), trimmed: a
// Telemetry_Namespace holding its own poller and Splunk consumer. Sources and
// consumers live INSIDE the namespace, so the pipeline check must see them.
const NAMESPACED = JSON.stringify({
  class: "Telemetry",
  controls: { class: "Controls", logLevel: "debug", debug: false },
  With_Proxy_HTTPS_target: {
    class: "Telemetry_Namespace",
    Poller: { class: "Telemetry_System_Poller", interval: 60 },
    Splunk: {
      class: "Telemetry_Consumer",
      type: "Splunk",
      host: "192.0.2.1",
      protocol: "https",
      port: 8088,
      passphrase: { cipherText: "apikey" },
    },
  },
});

// A Prometheus pull consumer (pull-consumers.html), with a system poller.
const PULL = JSON.stringify({
  class: "Telemetry",
  My_System: { class: "Telemetry_System", systemPoller: { interval: 60 } },
  My_Pull_Consumer: { class: "Telemetry_Pull_Consumer", type: "Prometheus" },
});

// --- Negative / structural shapes -----------------------------------------

// Wrong top-level class (an AS3 declaration, not TS).
const NOT_TS = JSON.stringify({ class: "AS3", declaration: { class: "ADC", schemaVersion: "3.0.0" } });

// A Telemetry_System with NO systemPoller and NO iHealthPoller (troubleshooting
// doc gotcha) — and no consumer either.
const SYSTEM_NO_POLLER = JSON.stringify({
  class: "Telemetry",
  My_System: { class: "Telemetry_System" },
});

// A consumer with no type.
const CONSUMER_NO_TYPE = JSON.stringify({
  class: "Telemetry",
  My_System: { class: "Telemetry_System", systemPoller: { interval: 60 } },
  My_Consumer: { class: "Telemetry_Consumer", host: "192.0.2.1" },
});

// Consumers only, no data source at all.
const NO_SOURCE = JSON.stringify({
  class: "Telemetry",
  My_Consumer: { class: "Telemetry_Consumer", type: "Splunk", host: "192.0.2.1", passphrase: { cipherText: "x" } },
});

const hasFinding = (input: string, kind: string): boolean =>
  (explainTs(input)?.findings ?? []).some((f) => f.kind === kind);

export const VECTORS: readonly Vector[] = [
  // ---- Kind detection ----
  {
    id: "quickstart-is-telemetry",
    description: "The Quick Start example is recognized as a Telemetry declaration.",
    check: () => expect(explainTs(QUICKSTART)?.kind === "telemetry", "Quick Start not recognized as telemetry"),
  },
  {
    id: "not-ts-detected",
    description: "An AS3 declaration is not a TS declaration.",
    check: () => expect(explainTs(NOT_TS)?.kind === "not-telemetry" && hasFinding(NOT_TS, "not-telemetry"), "AS3 declaration not rejected"),
  },
  {
    id: "empty-returns-null",
    description: "Empty input returns null.",
    check: () => expect(explainTs("   ") === null, "empty input did not return null"),
  },
  {
    id: "garbage-parse-error",
    description: "Non-JSON input yields a parse-error finding, not a throw.",
    check: () => expect(hasFinding("{not json", "parse-error"), "garbage did not yield parse-error"),
  },

  // ---- Roles + walk ----
  {
    id: "quickstart-has-source-and-consumer",
    description: "Quick Start has at least one source and one consumer.",
    check: () => {
      const r = explainTs(QUICKSTART);
      return expect(!!r && r.stats.sources >= 1 && r.stats.consumers >= 1, "Quick Start source/consumer counts wrong");
    },
  },
  {
    id: "quickstart-system-is-source",
    description: "Telemetry_System is grouped as a data source.",
    check: () => {
      const r = explainTs(QUICKSTART);
      const src = r?.groups.find((g) => g.role === "source");
      return expect(!!src && src.objects.some((o) => o.className === "Telemetry_System"), "Telemetry_System not grouped as source");
    },
  },
  {
    id: "quickstart-consumer-is-consumer",
    description: "Telemetry_Consumer is grouped as a consumer, with its type noted.",
    check: () => {
      const r = explainTs(QUICKSTART);
      const con = r?.groups.find((g) => g.role === "consumer");
      const obj = con?.objects.find((o) => o.className === "Telemetry_Consumer");
      return expect(!!obj && obj.notes.includes("Splunk"), "Consumer not grouped/typed correctly");
    },
  },
  {
    id: "listener-is-source",
    description: "Telemetry_Listener counts as a data source (event ingest).",
    check: () => {
      const r = explainTs(QUICKSTART);
      const src = r?.groups.find((g) => g.role === "source");
      return expect(!!src && src.objects.some((o) => o.className === "Telemetry_Listener"), "Listener not a source");
    },
  },
  {
    id: "referenced-poller-is-source",
    description: "A standalone Telemetry_System_Poller is a data source.",
    check: () => {
      const r = explainTs(REFERENCED_POLLER);
      return expect(!!r && r.stats.sources === 1, "referenced poller not counted as source");
    },
  },
  {
    id: "generic-http-known-type",
    description: "Generic_HTTP is a recognized consumer type (no unknown-type finding).",
    check: () => expect(!hasFinding(GENERIC_HTTP, "consumer-unknown-type"), "Generic_HTTP flagged as unknown type"),
  },
  {
    id: "pull-consumer-counts",
    description: "A Telemetry_Pull_Consumer counts as a consumer and Prometheus is known.",
    check: () => {
      const r = explainTs(PULL);
      return expect(!!r && r.stats.consumers === 1 && !hasFinding(PULL, "consumer-unknown-type"), "pull consumer/Prometheus wrong");
    },
  },

  // ---- Controls ----
  {
    id: "controls-parsed",
    description: "Controls logLevel and debug are read.",
    check: () => {
      const r = explainTs(NAMESPACED);
      return expect(!!r && r.controls?.logLevel === "debug" && r.controls?.debug === false, "controls not parsed");
    },
  },
  {
    id: "controls-note-emitted",
    description: "A controls-note finding is emitted when Controls is present.",
    check: () => expect(hasFinding(NAMESPACED, "controls-note"), "controls-note not emitted"),
  },

  // ---- Namespaces ----
  {
    id: "namespace-inner-pipeline-seen",
    description: "Sources and consumers INSIDE a namespace are counted for the pipeline check.",
    check: () => {
      const r = explainTs(NAMESPACED);
      return expect(!!r && r.stats.sources >= 1 && r.stats.consumers >= 1, "namespace inner source/consumer not counted");
    },
  },
  {
    id: "namespace-no-false-pipeline-gap",
    description: "A namespaced declaration with inner source+consumer does NOT report no-source/no-consumer.",
    check: () => expect(!hasFinding(NAMESPACED, "no-source") && !hasFinding(NAMESPACED, "no-consumer"), "false pipeline-gap on namespace"),
  },
  {
    id: "namespaces-present-note",
    description: "A namespaces-present note is emitted when a namespace is used.",
    check: () => expect(hasFinding(NAMESPACED, "namespaces-present"), "namespaces-present not emitted"),
  },

  // ---- Pipeline-gap findings ----
  {
    id: "system-without-poller-flagged",
    description: "A Telemetry_System with no systemPoller/iHealthPoller is flagged.",
    check: () => expect(hasFinding(SYSTEM_NO_POLLER, "system-without-poller"), "system-without-poller not flagged"),
  },
  {
    id: "no-consumer-flagged",
    description: "A declaration with a source but no consumer is flagged.",
    check: () => expect(hasFinding(SYSTEM_NO_POLLER, "no-consumer"), "no-consumer not flagged"),
  },
  {
    id: "no-source-flagged",
    description: "A declaration with consumers but no source is flagged.",
    check: () => expect(hasFinding(NO_SOURCE, "no-source"), "no-source not flagged"),
  },
  {
    id: "consumer-missing-type-flagged",
    description: "A Telemetry_Consumer with no type is flagged.",
    check: () => expect(hasFinding(CONSUMER_NO_TYPE, "consumer-missing-type"), "consumer-missing-type not flagged"),
  },
  {
    id: "complete-pipeline-no-gap-findings",
    description: "The Quick Start example reports neither no-source nor no-consumer.",
    check: () => expect(!hasFinding(QUICKSTART, "no-source") && !hasFinding(QUICKSTART, "no-consumer"), "false pipeline gap on Quick Start"),
  },

  // ---- Catalog sanity ----
  {
    id: "known-classes-present",
    description: "The class catalog includes the core TS classes.",
    check: () => {
      const need = ["Telemetry_System", "Telemetry_Listener", "Telemetry_Consumer", "Telemetry_Pull_Consumer", "Telemetry_Namespace"];
      return expect(need.every((c) => KNOWN_CLASSES.includes(c)), "core TS classes missing from catalog");
    },
  },
];

// ---- share vectors (Share results, 2026-10-27) ------------------------------

/** One share vector: a paste, and the exact copy a link carries (or the secret name that leaves it without one). */
export interface ShareVector {
  /** A stable id. */
  readonly id: string;
  /** What it pins. */
  readonly description: string;
  /** The paste. */
  readonly input: string;
  /** The exact copy, or null when no copy may be made. */
  readonly expect: string | null;
  /** How many values the copy replaces (0 when there is no copy). */
  readonly redacted: number;
  /** For a paste with no copy: the secret name it mentions. */
  readonly blockedName?: string;
  /** Strings that must never be in the copy (the secrets themselves). */
  readonly secrets: readonly string[];
}

/**
 * A text with given substrings replaced, each of which must occur exactly once (so a vector cannot pass by accident).
 * @param text the original
 * @param swaps [from, to] pairs
 * @returns the text with every swap made, or a marker that fails the vector
 */
function swap(text: string, swaps: readonly (readonly [string, string])[]): string {
  let out = text; // the working copy
  for (const [from, to] of swaps) { // each swap
    if (out.split(from).length !== 2) return `swap target not found exactly once: ${from}`; // a vector defect, reported as a mismatch
    out = out.replace(from, to); // made
  } // swaps
  return out; // done
} // swap

/** A Generic HTTP consumer with token headers and a BIG-IP poller with its passphrase (consumer guide, Generic HTTP). */
const HEADERS_DECL = JSON.stringify({
  class: "Telemetry",
  My_System: { class: "Telemetry_System", host: "192.0.2.30", username: "tsuser", passphrase: { cipherText: "poller-pass" }, systemPoller: { interval: 60 } },
  My_Consumer: { class: "Telemetry_Consumer", type: "Generic_HTTP", host: "192.0.2.31", protocol: "https", port: 443, path: "/ingest", method: "POST",
    headers: [{ name: "content-type", value: "application/json" }, { name: "x-api-key", value: "`>@/passphrase`" }, { name: "Authorization", value: "Bearer HDRTOKEN789" }],
    passphrase: { cipherText: "generic-apikey" } },
});

/** Google Cloud Monitoring with a private key, and DataDog with a plain apiKey (consumer guide). */
const CLOUD_DECL = JSON.stringify({
  class: "Telemetry",
  My_System: { class: "Telemetry_System", systemPoller: { interval: 60 } },
  Google: { class: "Telemetry_Consumer", type: "Google_Cloud_Monitoring", privateKeyId: "23k4jh2k3h4k2j3h4", serviceEmail: "ts@project.iam.gserviceaccount.com", privateKey: { cipherText: "-----BEGIN PRIVATE KEY-----\nGOOGLEFAKEKEY\n-----END PRIVATE KEY-----" }, projectId: "project-1" },
  DataDog: { class: "Telemetry_Consumer", type: "DataDog", apiKey: "dd-secret-0123" },
});

/** The share vectors. */
export const SHARE_VECTORS: readonly ShareVector[] = [
  { id: "share-quickstart", description: "F5's Quick Start: the Splunk HEC token's cipherText is replaced; host, port and protocol stay", input: QUICKSTART, expect: swap(QUICKSTART, [['{"cipherText":"apikey"}', '{"cipherText":"[redacted]"}']]), redacted: 1, secrets: ['"apikey"'] },
  { id: "share-generic-http-headers", description: "every Generic HTTP header value and both cipherText values are replaced; header names, username and hosts stay", input: HEADERS_DECL, expect: swap(HEADERS_DECL, [['"value":"application/json"', '"value":"[redacted]"'], ['"value":"`>@/passphrase`"', '"value":"[redacted]"'], ['"value":"Bearer HDRTOKEN789"', '"value":"[redacted]"'], ['{"cipherText":"poller-pass"}', '{"cipherText":"[redacted]"}'], ['{"cipherText":"generic-apikey"}', '{"cipherText":"[redacted]"}']]), redacted: 5, secrets: ["HDRTOKEN789", "poller-pass", "generic-apikey"] },
  { id: "share-google-and-datadog", description: "a Google private key's cipherText and DataDog's plain apiKey are replaced; privateKeyId and serviceEmail stay", input: CLOUD_DECL, expect: swap(CLOUD_DECL, [['"privateKey":{"cipherText":"-----BEGIN PRIVATE KEY-----\\nGOOGLEFAKEKEY\\n-----END PRIVATE KEY-----"}', '"privateKey":{"cipherText":"[redacted]"}'], ['"apiKey":"dd-secret-0123"', '"apiKey":"[redacted]"']]), redacted: 2, secrets: ["GOOGLEFAKEKEY", "dd-secret-0123"] },
  { id: "share-namespaced", description: "a Splunk consumer inside a namespace: its cipherText is replaced and the namespace reads the same", input: NAMESPACED, expect: swap(NAMESPACED, [['{"cipherText":"apikey"}', '{"cipherText":"[redacted]"}']]), redacted: 1, secrets: ['"apikey"'] },
  { id: "share-unparsed-with-secret", description: "text that is not JSON and names a passphrase gets no copy", input: '{ "class": "Telemetry", "C": { "class": "Telemetry_Consumer", "passphrase": { "cipherText": "apikey" ', expect: null, redacted: 0, blockedName: "passphrase", secrets: [] },
  { id: "share-unparsed-clean", description: "text that is not JSON and names no secret goes as typed (the page shows its parse error)", input: '{ "class": "Telemetry", ', expect: '{ "class": "Telemetry", ', redacted: 0, secrets: [] },
  { id: "share-pull-consumer-unchanged", description: "a declaration with no secret: the copy is the paste, nothing replaced", input: PULL, expect: PULL, redacted: 0, secrets: [] },
];

/**
 * Check one share vector: the exact copy and count, no secret in it, and the same reading on the receiving page.
 * @param v the vector
 * @returns null, or what failed
 */
function checkShare(v: ShareVector): string | null {
  const got = shareableDeclaration(v.input); // the engine
  if (v.expect === null) return expect(!got.ok && got.name === v.blockedName, `expected no copy (${v.blockedName}), got ${JSON.stringify(got).slice(0, 120)}`); // no link
  if (!got.ok) return `expected a copy, got none (${got.name})`; // a copy was due
  return (
    expect(got.text === v.expect, `copy differs: ${JSON.stringify(got.text).slice(0, 160)}`) ?? // byte for byte
    expect(got.redacted === v.redacted, `redacted=${got.redacted}, expected ${v.redacted}`) ?? // the count the popover shows
    expect(v.secrets.every((x) => !got.text.includes(x)), "a secret is still in the copy") ?? // never carried
    expect(JSON.stringify(explainTs(got.text)) === JSON.stringify(explainTs(v.input)), "the receiving page would read it differently") // the same reading
  );
} // checkShare

/** Run all vectors; returns the ids (with messages) that failed. */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of VECTORS) {
    let msg: string | null;
    try {
      msg = v.check();
    } catch (e) {
      msg = `threw: ${e instanceof Error ? e.message : String(e)}`;
    }
    if (msg) failures.push(`${v.id}: ${msg}`);
  }
  // The share vectors (2026-10-27), each guarded like the others.
  for (const v of SHARE_VECTORS) {
    let msg: string | null; // the failure, if any
    try {
      msg = checkShare(v); // the check
    } catch (e) {
      msg = `threw: ${e instanceof Error ? e.message : String(e)}`; // a throw is a failure
    } // try
    if (msg) failures.push(`${v.id}: ${msg}`); // recorded
  } // share vectors
  return failures;
}

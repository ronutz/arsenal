// ============================================================================
// src/lib/tools/fortigate-security-profile-coverage-checker/compute.ts
// ----------------------------------------------------------------------------
// FORTIGATE SECURITY PROFILE COVERAGE CHECKER — pure engine.
//
// WHAT IT ANSWERS
// "The profile is attached and configured. Why is it not doing anything?"
//
// THE DEPENDENCY CHAIN
// A security profile only acts when every precondition above it holds:
//   1. a firewall policy PERMITS the traffic   (nothing inspects what was denied)
//   2. SSL inspection DECRYPTS it, if encrypted
//   3. the inspection MODE supports the feature
//   4. only then does the profile act
//
// Most "my profile is not working" reports resolve at step 2: the traffic is
// HTTPS, the policy carries certificate inspection rather than deep inspection,
// and there is simply nothing for the profile to read. The profile looks
// attached, the configuration looks right, and it is blind.
//
// This tool walks that chain per profile and says which link failed. It models
// COVERAGE, not detection: it answers "can this profile see the traffic",
// never "will this profile catch a given threat".
//
// Pure, bounded, never fetches, never evaluates input as code.
//
// PAGE LANGUAGE (02/11/2026): every detail, note, warning and error is built as
// an EngineText (src/lib/tools/engine-text.ts): a stable id, the English as
// before, and its values. runLocalisable() returns them as such for the page
// (pack keys tools.fortigate-security-profile-coverage-checker.engine.<id>);
// run(), parseInput() and checkProfile() return plainText() of the same
// readings, so the API, the share spec and the golden vectors are unchanged.
// ============================================================================

import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

const MAX_INPUT = 20_000;

/** How the policy handles TLS. */
export type SslMode = "none" | "certificate" | "deep";
/** The inspection engine in force. */
export type InspectionMode = "flow" | "proxy";
/** Whether the traffic under discussion is encrypted. */
export type TrafficKind = "http" | "https";

export type Coverage = "effective" | "blind" | "degraded" | "not-attached";

/** S is string in the API's reading and EngineText in the page's (runLocalisable). */
export interface ProfileFinding<S = string> {
  readonly profile: string;
  readonly coverage: Coverage;
  /** Which link in the chain failed, when one did. */
  readonly failedAt: 1 | 2 | 3 | null;
  readonly detail: S; // a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface CoverageResult<S = string> {
  readonly mode: "check" | "reference";
  readonly ssl: SslMode;
  readonly inspection: InspectionMode;
  readonly traffic: TrafficKind;
  readonly policyPermits: boolean;
  readonly attached: readonly string[];
  readonly findings: readonly ProfileFinding<S>[]; // each profile's reading
  readonly notes: readonly S[]; // each a sentence
  readonly parseWarnings: readonly S[]; // each a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface ToolRunResult<S = string> {
  readonly result: CoverageResult<S>; // the reading
}

/**
 * The profiles this models, and what each one NEEDS.
 *
 * `needsPayload` is the key column: a profile that must read the message body
 * is blind behind certificate inspection, while one that only needs connection
 * metadata still works. Getting that split wrong in either direction would be
 * the whole value of the tool inverted, so it is data rather than logic.
 */
const PROFILES: ReadonlyArray<{
  readonly key: string;
  readonly label: string;
  readonly needsPayload: boolean;
  /** Behaviour when payload is unavailable but metadata is. */
  readonly degradedNote: EngineText | null; // a sentence (02/11/2026)
  /** Note when running in flow mode, where some behaviours are constrained. */
  readonly flowNote: EngineText | null; // a sentence (02/11/2026)
}> = Object.freeze([
  { key: "antivirus", label: "AntiVirus", needsPayload: true, degradedNote: null,
    flowNote: say("flow.antivirus", "In flow mode the file is scanned as it streams rather than buffered whole, so very large files and deeply nested archives are where coverage thins. Check the oversize-file action: the default passes them, which leaves the biggest downloads uninspected.") }, // AntiVirus in flow mode
  { key: "ips", label: "IPS", needsPayload: true, degradedNote: null,
    flowNote: null },
  { key: "application-control", label: "Application control", needsPayload: true,
    degradedNote: say("degraded.application-control", "Without decryption it can still identify some applications from handshake metadata such as SNI, so coverage is partial rather than absent. Many applications are not distinguishable that way."), // application control without decryption
    flowNote: null },
  { key: "web-filter", label: "Web filter", needsPayload: true,
    degradedNote: say("degraded.web-filter", "Without decryption it can filter by hostname from SNI, but not by URL path or page content, so a per-path policy does not apply."), // web filter without decryption
    flowNote: null },
  { key: "dlp", label: "DLP", needsPayload: true, degradedNote: null,
    flowNote: say("flow.dlp", "Data loss prevention depends on seeing complete objects, so proxy mode is the stronger position.") }, // DLP in flow mode
  { key: "file-filter", label: "File filter", needsPayload: true, degradedNote: null,
    flowNote: null },
]);

/** What parseInput reads; S is string in the API's reading and EngineText in the page's. */
type Parsed<S> = {
  ssl: SslMode; inspection: InspectionMode; traffic: TrafficKind;
  policyPermits: boolean; attached: string[]; warnings: S[];
};

/**
 * Read the box: the API's reading, warnings in English, exactly as before 02/11/2026.
 * @param text the box
 * @returns the settings and the warnings
 */
export function parseInput(text: string): Parsed<string> {
  return plainText(parseInputLocalisable(text)); // the same reading, sentences as their English
} // parseInput

/**
 * Read the box: the page's reading, each warning an EngineText.
 * @param text the box
 * @returns the settings and the warnings
 */
function parseInputLocalisable(text: string): Parsed<EngineText> {
  const warnings: EngineText[] = []; // each warning with its id
  const get = (k: string): string | null => {
    const m = new RegExp(`^\\s*${k}\\s*[:=]\\s*(.+)$`, "im").exec(text);
    return m ? m[1].trim().toLowerCase() : null;
  };

  const sslRaw = get("ssl") ?? get("ssl-inspection");
  let ssl: SslMode = "certificate";
  if (sslRaw) {
    if (/deep|full/.test(sslRaw)) ssl = "deep";
    else if (/cert/.test(sslRaw)) ssl = "certificate";
    else if (/none|no-inspection|off|disable/.test(sslRaw)) ssl = "none";
    else warnings.push(say("warn.sslUnknown", `Did not recognise ssl "${sslRaw}"; expected none, certificate or deep. Assuming certificate.`, { value: sslRaw })); // an unknown ssl value
  } else {
    warnings.push(say("warn.sslMissing", "No ssl setting supplied; assuming certificate inspection, which is the common default and the usual cause of a blind profile.")); // no ssl line
  }

  const modeRaw = get("mode") ?? get("inspection");
  let inspection: InspectionMode = "flow";
  if (modeRaw) {
    if (/proxy/.test(modeRaw)) inspection = "proxy";
    else if (/flow/.test(modeRaw)) inspection = "flow";
    else warnings.push(say("warn.modeUnknown", `Did not recognise mode "${modeRaw}"; expected flow or proxy. Assuming flow.`, { value: modeRaw })); // an unknown mode
  }

  const trafficRaw = get("traffic");
  const traffic: TrafficKind = trafficRaw && /^http\b|plain|clear/.test(trafficRaw) ? "http" : "https";

  const permitsRaw = get("policy");
  // Default true: the tool is about profiles, so assuming the policy permits is
  // the useful default. An explicit deny is modelled because it short-circuits
  // the entire chain and people do ask about it.
  const policyPermits = permitsRaw ? !/deny|block|drop/.test(permitsRaw) : true;

  const profRaw = get("profiles") ?? get("profile");
  const attached = profRaw
    ? profRaw.split(/\s*,\s*/).map((p) => p.trim().replace(/\s+/g, "-")).filter(Boolean)
    : [];
  if (attached.length === 0) {
    warnings.push(say("warn.noProfiles", "No profiles listed. Add a line like: profiles: antivirus, ips, application-control")); // no profiles line
  }
  for (const a of attached) {
    if (!PROFILES.some((p) => p.key === a)) {
      const known = PROFILES.map((p) => p.key).join(", "); // the modelled keys
      warnings.push(say("warn.unknownProfile", `Unknown profile "${a}". Known: ${known}.`, { profile: a, known })); // a profile the tool does not model
    }
  }
  return { ssl, inspection, traffic, policyPermits, attached, warnings };
}

/** Walk the dependency chain for one profile: the API's reading, its detail in English, exactly as before 02/11/2026. */
export function checkProfile(
  key: string, ssl: SslMode, inspection: InspectionMode,
  traffic: TrafficKind, policyPermits: boolean,
): ProfileFinding {
  return plainText(checkProfileLocalisable(key, ssl, inspection, traffic, policyPermits)); // the same reading, as English
} // checkProfile

/** Walk the dependency chain for one profile: the page's reading, its detail an EngineText. */
function checkProfileLocalisable(
  key: string, ssl: SslMode, inspection: InspectionMode,
  traffic: TrafficKind, policyPermits: boolean,
): ProfileFinding<EngineText> {
  const def = PROFILES.find((p) => p.key === key);
  if (!def) {
    return { profile: key, coverage: "not-attached", failedAt: null,
      detail: say("detail.unknown", "Not a profile this tool models.") }; // not modelled
  }

  // Link 1: the policy must permit the traffic.
  if (!policyPermits) {
    return { profile: def.label, coverage: "blind", failedAt: 1,
      detail: say("detail.denied", "The policy DENIES this traffic, so it never reaches any security profile. Nothing inspects what was blocked, and attaching profiles to a deny policy has no effect.") }; // link 1 failed
  }

  // Link 2: the payload must be readable.
  const payloadVisible = traffic === "http" || ssl === "deep";
  if (def.needsPayload && !payloadVisible) {
    const none = ssl === "none"; // no SSL inspection at all, or certificate inspection
    if (def.degradedNote) {
      const note = def.degradedNote; // what still works without decryption
      return { profile: def.label, coverage: "degraded", failedAt: 2,
        detail: none // which inspection the policy carries
          ? say("detail.degradedNone", `The traffic is encrypted and the policy uses no SSL inspection, so the payload is never decrypted. ${note}`, { note }) // no inspection
          : say("detail.degradedCert", `The traffic is encrypted and the policy uses certificate inspection, so the payload is never decrypted. ${note}`, { note }) }; // certificate inspection
    }
    return { profile: def.label, coverage: "blind", failedAt: 2,
      detail: none // which inspection the policy carries
        ? say("detail.blindNone", "BLIND. The traffic is encrypted and the policy uses no SSL inspection, so there is no payload to examine. The profile is attached and configured and does nothing. Deep inspection is what this profile needs.") // no inspection
        : say("detail.blindCert", "BLIND. The traffic is encrypted and the policy uses certificate inspection, so there is no payload to examine. The profile is attached and configured and does nothing. Deep inspection is what this profile needs.") }; // certificate inspection
  }

  // Link 3: the mode must support the behaviour.
  if (inspection === "flow" && def.flowNote) {
    const note = def.flowNote; // the flow-mode caveat
    return { profile: def.label, coverage: "degraded", failedAt: 3,
      detail: say("detail.flowCaveat", `Working, with a mode caveat. ${note}`, { note }) }; // link 3 caveat
  }
  return { profile: def.label, coverage: "effective", failedAt: null,
    detail: traffic === "https" // why the payload is readable
      ? say("detail.effectiveDeep", `Effective. The policy permits the traffic, the payload is readable because deep inspection is in force, and ${inspection} mode supports it.`, { inspection }) // decrypted
      : say("detail.effectivePlain", `Effective. The policy permits the traffic, the payload is readable because the traffic is not encrypted, and ${inspection} mode supports it.`, { inspection }) }; // in the clear
}

function referenceResult(): CoverageResult<EngineText> {
  return {
    mode: "reference", ssl: "certificate", inspection: "flow", traffic: "https",
    policyPermits: true, attached: [], findings: [],
    notes: [
      say("ref.chain", "A security profile only acts when every precondition above it holds: the policy must permit the traffic, SSL inspection must decrypt it, the inspection mode must support the feature, and only then does the profile act."), // the chain
      say("ref.secondStep", "Most reports that a profile is not working resolve at the second step. The traffic is HTTPS, the policy carries certificate inspection rather than deep inspection, and there is nothing to read."), // where it breaks
      say("ref.certInspection", "Certificate inspection validates the certificate and reads the handshake. It does NOT decrypt the payload, so AntiVirus, IPS, DLP and file filter have nothing to examine."), // what certificate inspection reads
      say("ref.degrade", "Application control and web filter degrade rather than go blind: SNI still identifies some hosts, but not URL paths or page content."), // the two that degrade
      say("ref.describe", "Describe a policy:"), // the sample's heading
      say("ref.lineTraffic", "traffic: https"), // a sample line (code)
      say("ref.lineSsl", "ssl: certificate"), // a sample line (code)
      say("ref.lineMode", "mode: flow"), // a sample line (code)
      say("ref.lineProfiles", "profiles: antivirus, ips, application-control, web-filter"), // a sample line (code)
    ],
    parseWarnings: [],
  };
}

/** Tool entry point: the API's reading (and the golden vectors'), every sentence in English, exactly as before. */
export function run(input: string): ToolRunResult {
  return plainText(runLocalisable(input)); // the same reading, sentences as their English
} // run

/** The page's reading: the same as run(), with every sentence an EngineText (id, English, values). Deterministic, bounded, never fetches. */
export function runLocalisable(input: string): ToolRunResult<EngineText> {
  if (typeof input !== "string") throw engineError(say("err.notString", "Input must be a string.")); // not text
  if (input.length > MAX_INPUT) {
    const chars = String(input.length), limit = String(MAX_INPUT); // the sizes
    throw engineError(say("err.tooLarge", `Input too large (${chars} chars; limit ${limit}).`, { chars, limit })); // too large
  }
  const text = input.trim();
  if (text === "") return { result: referenceResult() };
  const { ssl, inspection, traffic, policyPermits, attached, warnings } = parseInputLocalisable(text); // the settings, warnings with ids
  const findings = attached.map((a) => checkProfileLocalisable(a, ssl, inspection, traffic, policyPermits)); // each profile, detail with an id
  const notes: EngineText[] = []; // each note with its id
  const blind = findings.filter((f) => f.coverage === "blind");
  if (blind.length > 0 && blind.every((f) => f.failedAt === 2)) {
    const count = String(blind.length); // how many
    notes.push(blind.length === 1 // one profile, or several
      ? say("note.blindOne", `${count} profile is attached and blind for the same reason: the payload is never decrypted. Switching this policy to deep inspection is the single change that fixes all of them - and it is a real decision, because deep inspection means terminating TLS, which has certificate-trust, privacy and performance consequences.`, { count }) // one
      : say("note.blindMany", `${count} profiles are attached and blind for the same reason: the payload is never decrypted. Switching this policy to deep inspection is the single change that fixes all of them - and it is a real decision, because deep inspection means terminating TLS, which has certificate-trust, privacy and performance consequences.`, { count })); // several
  }
  if (traffic === "https" && ssl === "certificate") {
    notes.push(say("note.certNotWeaker", "Certificate inspection is not a weaker form of deep inspection; it is a different thing. It validates the certificate and reads the handshake, and never decrypts the body.")); // a different thing
  }
  notes.push(say("note.coverage", "This models COVERAGE, not detection: it answers whether a profile can see the traffic, never whether it would catch a particular threat.")); // the scope

  return {
    result: { mode: "check", ssl, inspection, traffic, policyPermits, attached, findings, notes, parseWarnings: warnings },
  };
}

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
// ============================================================================

const MAX_INPUT = 20_000;

/** How the policy handles TLS. */
export type SslMode = "none" | "certificate" | "deep";
/** The inspection engine in force. */
export type InspectionMode = "flow" | "proxy";
/** Whether the traffic under discussion is encrypted. */
export type TrafficKind = "http" | "https";

export type Coverage = "effective" | "blind" | "degraded" | "not-attached";

export interface ProfileFinding {
  readonly profile: string;
  readonly coverage: Coverage;
  /** Which link in the chain failed, when one did. */
  readonly failedAt: 1 | 2 | 3 | null;
  readonly detail: string;
}

export interface CoverageResult {
  readonly mode: "check" | "reference";
  readonly ssl: SslMode;
  readonly inspection: InspectionMode;
  readonly traffic: TrafficKind;
  readonly policyPermits: boolean;
  readonly attached: readonly string[];
  readonly findings: readonly ProfileFinding[];
  readonly notes: readonly string[];
  readonly parseWarnings: readonly string[];
}

export interface ToolRunResult {
  readonly result: CoverageResult;
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
  readonly degradedNote: string | null;
  /** Note when running in flow mode, where some behaviours are constrained. */
  readonly flowNote: string | null;
}> = Object.freeze([
  { key: "antivirus", label: "AntiVirus", needsPayload: true, degradedNote: null,
    flowNote: "In flow mode the file is scanned as it streams rather than buffered whole, so very large files and deeply nested archives are where coverage thins. Check the oversize-file action: the default passes them, which leaves the biggest downloads uninspected." },
  { key: "ips", label: "IPS", needsPayload: true, degradedNote: null,
    flowNote: null },
  { key: "application-control", label: "Application control", needsPayload: true,
    degradedNote: "Without decryption it can still identify some applications from handshake metadata such as SNI, so coverage is partial rather than absent. Many applications are not distinguishable that way.",
    flowNote: null },
  { key: "web-filter", label: "Web filter", needsPayload: true,
    degradedNote: "Without decryption it can filter by hostname from SNI, but not by URL path or page content, so a per-path policy does not apply.",
    flowNote: null },
  { key: "dlp", label: "DLP", needsPayload: true, degradedNote: null,
    flowNote: "Data loss prevention depends on seeing complete objects, so proxy mode is the stronger position." },
  { key: "file-filter", label: "File filter", needsPayload: true, degradedNote: null,
    flowNote: null },
]);

export function parseInput(text: string): {
  ssl: SslMode; inspection: InspectionMode; traffic: TrafficKind;
  policyPermits: boolean; attached: string[]; warnings: string[];
} {
  const warnings: string[] = [];
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
    else warnings.push(`Did not recognise ssl "${sslRaw}"; expected none, certificate or deep. Assuming certificate.`);
  } else {
    warnings.push("No ssl setting supplied; assuming certificate inspection, which is the common default and the usual cause of a blind profile.");
  }

  const modeRaw = get("mode") ?? get("inspection");
  let inspection: InspectionMode = "flow";
  if (modeRaw) {
    if (/proxy/.test(modeRaw)) inspection = "proxy";
    else if (/flow/.test(modeRaw)) inspection = "flow";
    else warnings.push(`Did not recognise mode "${modeRaw}"; expected flow or proxy. Assuming flow.`);
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
    warnings.push("No profiles listed. Add a line like: profiles: antivirus, ips, application-control");
  }
  for (const a of attached) {
    if (!PROFILES.some((p) => p.key === a)) {
      warnings.push(`Unknown profile "${a}". Known: ${PROFILES.map((p) => p.key).join(", ")}.`);
    }
  }
  return { ssl, inspection, traffic, policyPermits, attached, warnings };
}

/** Walk the dependency chain for one profile. */
export function checkProfile(
  key: string, ssl: SslMode, inspection: InspectionMode,
  traffic: TrafficKind, policyPermits: boolean,
): ProfileFinding {
  const def = PROFILES.find((p) => p.key === key);
  if (!def) {
    return { profile: key, coverage: "not-attached", failedAt: null,
      detail: "Not a profile this tool models." };
  }

  // Link 1: the policy must permit the traffic.
  if (!policyPermits) {
    return { profile: def.label, coverage: "blind", failedAt: 1,
      detail: "The policy DENIES this traffic, so it never reaches any security profile. Nothing inspects what was blocked, and attaching profiles to a deny policy has no effect." };
  }

  // Link 2: the payload must be readable.
  const payloadVisible = traffic === "http" || ssl === "deep";
  if (def.needsPayload && !payloadVisible) {
    if (def.degradedNote) {
      return { profile: def.label, coverage: "degraded", failedAt: 2,
        detail: `The traffic is encrypted and the policy uses ${ssl === "none" ? "no SSL inspection" : "certificate inspection"}, so the payload is never decrypted. ${def.degradedNote}` };
    }
    return { profile: def.label, coverage: "blind", failedAt: 2,
      detail: `BLIND. The traffic is encrypted and the policy uses ${ssl === "none" ? "no SSL inspection" : "certificate inspection"}, so there is no payload to examine. The profile is attached and configured and does nothing. Deep inspection is what this profile needs.` };
  }

  // Link 3: the mode must support the behaviour.
  if (inspection === "flow" && def.flowNote) {
    return { profile: def.label, coverage: "degraded", failedAt: 3,
      detail: `Working, with a mode caveat. ${def.flowNote}` };
  }

  return { profile: def.label, coverage: "effective", failedAt: null,
    detail: `Effective. The policy permits the traffic, the payload is readable${traffic === "https" ? " because deep inspection is in force" : " because the traffic is not encrypted"}, and ${inspection} mode supports it.` };
}

function referenceResult(): CoverageResult {
  return {
    mode: "reference", ssl: "certificate", inspection: "flow", traffic: "https",
    policyPermits: true, attached: [], findings: [],
    notes: [
      "A security profile only acts when every precondition above it holds: the policy must permit the traffic, SSL inspection must decrypt it, the inspection mode must support the feature, and only then does the profile act.",
      "Most reports that a profile is not working resolve at the second step. The traffic is HTTPS, the policy carries certificate inspection rather than deep inspection, and there is nothing to read.",
      "Certificate inspection validates the certificate and reads the handshake. It does NOT decrypt the payload, so AntiVirus, IPS, DLP and file filter have nothing to examine.",
      "Application control and web filter degrade rather than go blind: SNI still identifies some hosts, but not URL paths or page content.",
      "Describe a policy:",
      "traffic: https",
      "ssl: certificate",
      "mode: flow",
      "profiles: antivirus, ips, application-control, web-filter",
    ],
    parseWarnings: [],
  };
}

/** Tool entry point. Deterministic, bounded, never fetches. */
export function run(input: string): ToolRunResult {
  if (typeof input !== "string") throw new Error("Input must be a string.");
  if (input.length > MAX_INPUT) {
    throw new Error(`Input too large (${input.length} chars; limit ${MAX_INPUT}).`);
  }
  const text = input.trim();
  if (text === "") return { result: referenceResult() };

  const { ssl, inspection, traffic, policyPermits, attached, warnings } = parseInput(text);
  const findings = attached.map((a) => checkProfile(a, ssl, inspection, traffic, policyPermits));

  const notes: string[] = [];
  const blind = findings.filter((f) => f.coverage === "blind");
  if (blind.length > 0 && blind.every((f) => f.failedAt === 2)) {
    notes.push(
      `${blind.length} profile${blind.length === 1 ? " is" : "s are"} attached and blind for the same reason: the payload is never decrypted. Switching this policy to deep inspection is the single change that fixes all of them — and it is a real decision, because deep inspection means terminating TLS, which has certificate-trust, privacy and performance consequences.`,
    );
  }
  if (traffic === "https" && ssl === "certificate") {
    notes.push("Certificate inspection is not a weaker form of deep inspection; it is a different thing. It validates the certificate and reads the handshake, and never decrypts the body.");
  }
  notes.push("This models COVERAGE, not detection: it answers whether a profile can see the traffic, never whether it would catch a particular threat.");

  return {
    result: { mode: "check", ssl, inspection, traffic, policyPermits, attached, findings, notes, parseWarnings: warnings },
  };
}

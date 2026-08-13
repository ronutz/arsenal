// ============================================================================
// src/lib/tools/sse-architecture-explainer/compute.ts
// ----------------------------------------------------------------------------
// SSE / SASE SINGLE-PASS ARCHITECTURE EXPLAINER - the pure engine.
//
// WHAT THIS IS FOR. "Single-pass" is the word every SSE vendor uses and almost
// nobody unpacks. A learner can recite that SWG, CASB, ZTNA, DLP and FWaaS are
// converged without being able to say what actually happens to one request, in
// what order, or why the arrangement is different from four appliances in a
// row.
//
// This describes a request and returns the pass: which services engage, which
// are PILLARS and which are CROSS-CUTTING, and what the chained-appliance
// alternative would have cost. It is deterministic - the same description
// always produces the same pass - and it contacts nothing.
//
// THE INSIGHT IT EXISTS TO TEACH:
//
//   DLP and threat protection are NOT pillars. They are cross-cutting. They run
//   inside the single-pass engine, so any pillar's decrypted traffic is handed
//   to the same engines. You write the data profile once and it is enforced on
//   web, on SaaS and on a private application alike.
//
// That is why "converged" is an architectural claim rather than a bundling
// claim, and it is the thing a student most often gets wrong.
//
// VENDOR SCOPE. The stage names and the platform vocabulary here follow
// Netskope's published description of its Zero Trust Engine and NewEdge. The
// STRUCTURAL argument - single pass, cross-cutting inspection, full compute at
// the edge - is general to SSE and is stated as such.
// ============================================================================

/** How the traffic reaches the service edge. */
export type Steering = "client" | "ipsec" | "gre" | "proxy-chain" | "dns";

/** What the request is trying to reach. */
export type Destination = "web" | "sanctioned-saas" | "unsanctioned-saas" | "private-app" | "non-web-port";

export interface RequestShape {
  destination: Destination;
  steering: Steering;
  /** Is the endpoint managed by the organisation? */
  managedDevice: boolean;
  /** Is the flow TLS, and is decryption permitted by policy? */
  tls: boolean;
  decrypt: boolean;
  /** Does the request carry a payload worth inspecting (an upload, a post)? */
  hasPayload: boolean;
}

export type StageKind = "pillar" | "cross-cutting" | "network" | "conditional";

export interface Stage {
  order: number;
  name: string;
  kind: StageKind;
  what: string;
  /** Why this stage engages, or the condition that skipped it. */
  because: string;
  engaged: boolean;
}

export interface PassResult {
  stages: Stage[];
  /** The pillars that engaged for this request. */
  pillars: string[];
  /** Cross-cutting services that ran inside the same pass. */
  crossCutting: string[];
  /** What a chained-appliance architecture would have done differently. */
  contrast: string[];
  notes: string[];
  warnings: string[];
}

export class SseInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SseInputError";
  }
}

/** Build the single pass for one described request. */
export function explainPass(r: RequestShape): PassResult {
  if (!r || !r.destination || !r.steering) {
    throw new SseInputError("Describe the request: at least a destination and a steering method.");
  }

  const stages: Stage[] = [];
  const notes: string[] = [];
  const warnings: string[] = [];
  let order = 0;
  const add = (name: string, kind: StageKind, what: string, because: string, engaged = true) =>
    stages.push({ order: ++order, name, kind, what, because, engaged });

  // --- getting there --------------------------------------------------------
  const steeringWhy: Record<Steering, string> = {
    client: "The endpoint agent steers selected traffic to the nearest point of presence. It is the only method that carries device posture and user identity with the flow.",
    ipsec: "A tunnel from the site's edge device. It steers everything from that site, and it knows the site rather than the user - identity has to come from somewhere else.",
    gre: "A tunnel like IPsec but unencrypted, used where the path is already trusted and throughput matters more than confidentiality on that hop.",
    "proxy-chain": "An existing on-premises proxy forwards to the service edge. Useful during a migration; the first proxy is still in the path and still yours to operate.",
    dns: "DNS steering points a name at the service edge. It is the lightest touch and the least specific: it cannot distinguish two applications behind one address.",
  };
  add("Steering", "network", `Traffic reaches the service edge by ${r.steering}.`, steeringWhy[r.steering]);

  add(
    "Point of presence",
    "network",
    "The request arrives at an edge location running the complete inspection stack.",
    "The architectural claim worth checking in any SSE product is whether every location runs full compute, or whether some are thin nodes that only resolve DNS and forward. A thin node means a detour to somewhere that can actually inspect.",
  );

  // --- decryption -----------------------------------------------------------
  const decrypting = r.tls && r.decrypt;
  add(
    "TLS decryption",
    "conditional",
    decrypting ? "The session is decrypted once." : "The session is not decrypted.",
    decrypting
      ? "Decryption happens ONCE for the whole pass. In a chain of separate appliances each device decrypts and re-encrypts, and that repetition is most of the latency people blame on inspection."
      : r.tls
        ? "TLS is present but policy does not permit decryption here. Everything below that needs payload visibility is limited to what the handshake and the metadata reveal."
        : "The flow is not TLS, so there is nothing to decrypt.",
    r.tls,
  );

  // --- identification -------------------------------------------------------
  add(
    "Application identification",
    "cross-cutting",
    "Protocol, host and path are examined to identify the application, and often the specific instance and the activity.",
    "This is the step that distinguishes a corporate tenant of a service from a personal one. Without it, policy can only speak about domains, and 'allow the company account but not the personal account' is not expressible.",
  );

  // --- the pillars ----------------------------------------------------------
  const pillars: string[] = [];
  const wantsSwg = r.destination === "web" || r.destination === "unsanctioned-saas";
  const wantsCasb = r.destination === "sanctioned-saas" || r.destination === "unsanctioned-saas";
  const wantsZtna = r.destination === "private-app";
  const wantsFw = r.destination === "non-web-port";

  add(
    "Secure web gateway",
    "pillar",
    "URL category, risk and web policy are evaluated.",
    wantsSwg
      ? "The destination is web traffic, which is what a secure web gateway governs."
      : "Not engaged: this request is not to the general web.",
    wantsSwg,
  );
  if (wantsSwg) pillars.push("SWG");

  add(
    "Cloud access security broker",
    "pillar",
    "Application, instance and activity are matched against policy - upload, download, share, post.",
    wantsCasb
      ? "The destination is a software-as-a-service application, where the useful unit of control is the ACTIVITY rather than the address."
      : "Not engaged: no software-as-a-service application is involved.",
    wantsCasb,
  );
  if (wantsCasb) pillars.push("CASB");

  add(
    "Zero trust network access",
    "pillar",
    "The user is brokered to one private application, and to nothing else.",
    wantsZtna
      ? "A private application is being reached. The broker connects the user to that application alone, rather than placing them on a network the way a virtual private network does."
      : "Not engaged: no private application is involved.",
    wantsZtna,
  );
  if (wantsZtna) pillars.push("ZTNA");

  add(
    "Cloud firewall",
    "pillar",
    "Ports and protocols outside web traffic are evaluated.",
    wantsFw
      ? "The request is on a non-web port, which the web-facing services do not govern."
      : "Not engaged: this is web or application traffic.",
    wantsFw,
  );
  if (wantsFw) pillars.push("FWaaS");

  // --- the cross-cutting engines -------------------------------------------
  const crossCutting: string[] = [];
  const canSeePayload = decrypting || !r.tls;

  add(
    "Data loss prevention",
    "cross-cutting",
    "Content is classified against the data profile.",
    canSeePayload && r.hasPayload
      ? "DLP is NOT a pillar. It runs inside the same pass and receives whatever the pillars decrypted, which is why one data profile covers web, software-as-a-service and private applications alike."
      : !canSeePayload
        ? "Cannot run meaningfully: without decryption there is no content to classify."
        : "Little to do: this request carries no payload worth classifying.",
    canSeePayload && r.hasPayload,
  );
  if (canSeePayload && r.hasPayload) crossCutting.push("DLP");

  add(
    "Threat protection",
    "cross-cutting",
    "Files and content are scanned, with sandboxing where the verdict is uncertain.",
    canSeePayload
      ? "Also cross-cutting, and running in the same pass on the same decrypted stream rather than after a re-encryption."
      : "Limited without decryption: the verdict rests on reputation and metadata rather than on content.",
    canSeePayload,
  );
  if (canSeePayload) crossCutting.push("Threat protection");

  // --- adaptive outcomes ----------------------------------------------------
  add(
    "Adaptive decision",
    "conditional",
    "The verdict can be more than allow or block: coach the user, isolate the session in a remote browser, require step-up authentication, or permit a read-only view.",
    r.managedDevice
      ? "Device posture is known, so policy can be more permissive with justification rather than simply refusing."
      : "The device is unmanaged, which is the case where isolation and read-only outcomes earn their keep - access without the data landing on the endpoint.",
  );

  if (!r.managedDevice) {
    notes.push("On an unmanaged device the interesting policy outcomes are not allow and block. Remote browser isolation and read-only access let work continue while keeping data off an endpoint nobody controls.");
  }
  if (r.steering === "dns") {
    warnings.push("DNS steering cannot distinguish two applications that share an address, and it carries no user identity. It is a coarse instrument - useful for coverage, insufficient for activity-level policy.");
  }
  if (r.tls && !r.decrypt) {
    warnings.push("Without decryption, every stage below application identification is working from metadata. A policy written as though content were visible will not do what its author believes.");
  }
  if (r.destination === "private-app" && r.steering !== "client") {
    notes.push("Private application access is normally brokered through the endpoint agent, because the broker needs to know the user rather than the site.");
  }

  // --- the contrast, which is the point -------------------------------------
  const contrast: string[] = [
    "Chained appliances decrypt and re-encrypt at every hop. A single pass decrypts once and hands the same stream to every engine.",
    "Chained appliances each hold their own policy. A single engine holds one policy, so 'block this data leaving' does not need writing four times in four dialects.",
    "Chained appliances add their latencies together, and each one is a place the chain can break. A single pass adds its engines in parallel within one traversal.",
  ];
  notes.push(
    "Single-pass is an architectural claim, not a bundling claim. Several products are sold as converged and are four engines behind one invoice - the question to ask is whether the payload is decrypted once or once per engine.",
  );

  return { stages, pillars, crossCutting, contrast, notes, warnings };
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: RequestShape): PassResult {
  return explainPass(input);
}

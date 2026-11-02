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
//
// PAGE LANGUAGE (02/11/2026): every stage name and explanation, contrast, note,
// warning and error is built as an EngineText (src/lib/tools/engine-text.ts): a
// stable id, the English as before, and its values. explainPassLocalisable()
// returns them as such for the page (pack keys
// tools.sse-architecture-explainer.engine.<id>); explainPass() and run() return
// plainText() of the same reading, so the API and the golden vectors are
// unchanged. Pillar acronyms (SWG, CASB, ZTNA, FWaaS) stay strings.
// ============================================================================

import { say, plainText, withEngineText, keySegment, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

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

/** S is string in the API's reading and EngineText in the page's (explainPassLocalisable). */
export interface Stage<S = string> {
  order: number;
  name: S; // the stage's name
  kind: StageKind;
  what: S; // a sentence
  /** Why this stage engages, or the condition that skipped it. */
  because: S; // a sentence
  engaged: boolean;
}

/** S is string in the API's reading and EngineText in the page's. */
export interface PassResult<S = string> {
  stages: Stage<S>[]; // the pass, stage by stage
  /** The pillars that engaged for this request. */
  pillars: string[];
  /** Cross-cutting services that ran inside the same pass. */
  crossCutting: S[]; // each a name
  /** What a chained-appliance architecture would have done differently. */
  contrast: S[]; // each a sentence
  notes: S[]; // each a sentence
  warnings: S[]; // each a sentence
}

export class SseInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SseInputError";
  }
}

/** Build the single pass for one described request. */
// --- getting there --------------------------------------------------------
export function explainPass(r: RequestShape): PassResult {
  return plainText(explainPassLocalisable(r)); // the same reading, as English (the API's and the vectors')
} // explainPass

/** The page's reading: the same as explainPass(), with every sentence an EngineText (id, English, values). */
export function explainPassLocalisable(r: RequestShape): PassResult<EngineText> {
  if (!r || !r.destination || !r.steering) {
    const m = say("err.noRequest", "Describe the request: at least a destination and a steering method."); // nothing described
    throw withEngineText(new SseInputError(m.text), m); // the same class and message, plus the sentence
  }
  const stages: Stage<EngineText>[] = []; // each stage, sentences with ids
  const notes: EngineText[] = []; // each note with its id
  const warnings: EngineText[] = []; // each warning with its id
  let order = 0;
  const add = (name: EngineText, kind: StageKind, what: EngineText, because: EngineText, engaged = true) =>
    stages.push({ order: ++order, name, kind, what, because, engaged });
  const steeringWhy: Record<Steering, EngineText> = {
    client: say("steer.client", "The endpoint agent steers selected traffic to the nearest point of presence. It is the only method that carries device posture and user identity with the flow."), // the client
    ipsec: say("steer.ipsec", "A tunnel from the site's edge device. It steers everything from that site, and it knows the site rather than the user - identity has to come from somewhere else."), // IPsec
    gre: say("steer.gre", "A tunnel like IPsec but unencrypted, used where the path is already trusted and throughput matters more than confidentiality on that hop."), // GRE
    "proxy-chain": say("steer.proxyChain", "An existing on-premises proxy forwards to the service edge. Useful during a migration; the first proxy is still in the path and still yours to operate."), // proxy chaining
    dns: say("steer.dns", "DNS steering points a name at the service edge. It is the lightest touch and the least specific: it cannot distinguish two applications behind one address."), // DNS
  };
  const steering = say(`method.${keySegment(String(r.steering))}`, String(r.steering)); // the method's token, with an id of its own so the page can name it (the English is the token, as before)
  add(say("stage.steering", "Steering"), "network", say("what.steering", `Traffic reaches the service edge by ${steering}.`, { steering }), steeringWhy[r.steering]); // stage 1

  add(
    say("stage.pop", "Point of presence"), // the stage's name
    "network",
    say("what.pop", "The request arrives at an edge location running the complete inspection stack."), // what happens
    say("because.pop", "The architectural claim worth checking in any SSE product is whether every location runs full compute, or whether some are thin nodes that only resolve DNS and forward. A thin node means a detour to somewhere that can actually inspect."), // why it matters
  );

  // --- decryption -----------------------------------------------------------
  const decrypting = r.tls && r.decrypt;
  add(
    say("stage.tls", "TLS decryption"), // the stage's name
    "conditional",
    decrypting ? say("what.tlsOnce", "The session is decrypted once.") : say("what.tlsNot", "The session is not decrypted."), // what happens
    decrypting
      ? say("because.tlsOnce", "Decryption happens ONCE for the whole pass. In a chain of separate appliances each device decrypts and re-encrypts, and that repetition is most of the latency people blame on inspection.") // once
      : r.tls
        ? say("because.tlsNotPermitted", "TLS is present but policy does not permit decryption here. Everything below that needs payload visibility is limited to what the handshake and the metadata reveal.") // not permitted
        : say("because.notTls", "The flow is not TLS, so there is nothing to decrypt."), // not TLS
    r.tls,
  );

  // --- identification -------------------------------------------------------
  add(
    say("stage.appId", "Application identification"), // the stage's name
    "cross-cutting",
    say("what.appId", "Protocol, host and path are examined to identify the application, and often the specific instance and the activity."), // what happens
    say("because.appId", "This is the step that distinguishes a corporate tenant of a service from a personal one. Without it, policy can only speak about domains, and 'allow the company account but not the personal account' is not expressible."), // why it matters
  );

  // --- the pillars ----------------------------------------------------------
  const pillars: string[] = [];
  const wantsSwg = r.destination === "web" || r.destination === "unsanctioned-saas";
  const wantsCasb = r.destination === "sanctioned-saas" || r.destination === "unsanctioned-saas";
  const wantsZtna = r.destination === "private-app";
  const wantsFw = r.destination === "non-web-port";

  add(
    say("stage.swg", "Secure web gateway"), // the stage's name
    "pillar",
    say("what.swg", "URL category, risk and web policy are evaluated."), // what happens
    wantsSwg
      ? say("because.swg", "The destination is web traffic, which is what a secure web gateway governs.") // engaged
      : say("because.swgNot", "Not engaged: this request is not to the general web."), // not engaged
    wantsSwg,
  );
  if (wantsSwg) pillars.push("SWG");

  add(
    say("stage.casb", "Cloud access security broker"), // the stage's name
    "pillar",
    say("what.casb", "Application, instance and activity are matched against policy - upload, download, share, post."), // what happens
    wantsCasb
      ? say("because.casb", "The destination is a software-as-a-service application, where the useful unit of control is the ACTIVITY rather than the address.") // engaged
      : say("because.casbNot", "Not engaged: no software-as-a-service application is involved."), // not engaged
    wantsCasb,
  );
  if (wantsCasb) pillars.push("CASB");

  add(
    say("stage.ztna", "Zero trust network access"), // the stage's name
    "pillar",
    say("what.ztna", "The user is brokered to one private application, and to nothing else."), // what happens
    wantsZtna
      ? say("because.ztna", "A private application is being reached. The broker connects the user to that application alone, rather than placing them on a network the way a virtual private network does.") // engaged
      : say("because.ztnaNot", "Not engaged: no private application is involved."), // not engaged
    wantsZtna,
  );
  if (wantsZtna) pillars.push("ZTNA");

  add(
    say("stage.fw", "Cloud firewall"), // the stage's name
    "pillar",
    say("what.fw", "Ports and protocols outside web traffic are evaluated."), // what happens
    wantsFw
      ? say("because.fw", "The request is on a non-web port, which the web-facing services do not govern.") // engaged
      : say("because.fwNot", "Not engaged: this is web or application traffic."), // not engaged
    wantsFw,
  );
  if (wantsFw) pillars.push("FWaaS");

  // --- the cross-cutting engines -------------------------------------------
  const crossCutting: EngineText[] = []; // the cross-cutting services engaged
  const canSeePayload = decrypting || !r.tls;

  add(
    say("stage.dlp", "Data loss prevention"), // the stage's name
    "cross-cutting",
    say("what.dlp", "Content is classified against the data profile."), // what happens
    canSeePayload && r.hasPayload
      ? say("because.dlp", "DLP is NOT a pillar. It runs inside the same pass and receives whatever the pillars decrypted, which is why one data profile covers web, software-as-a-service and private applications alike.") // engaged
      : !canSeePayload
        ? say("because.dlpBlind", "Cannot run meaningfully: without decryption there is no content to classify.") // no content
        : say("because.dlpNothing", "Little to do: this request carries no payload worth classifying."), // nothing to classify
    canSeePayload && r.hasPayload,
  );
  if (canSeePayload && r.hasPayload) crossCutting.push(say("cross.dlp", "DLP")); // DLP engaged

  add(
    say("stage.threat", "Threat protection"), // the stage's name
    "cross-cutting",
    say("what.threat", "Files and content are scanned, with sandboxing where the verdict is uncertain."), // what happens
    canSeePayload
      ? say("because.threat", "Also cross-cutting, and running in the same pass on the same decrypted stream rather than after a re-encryption.") // engaged
      : say("because.threatLimited", "Limited without decryption: the verdict rests on reputation and metadata rather than on content."), // limited
    canSeePayload,
  );
  if (canSeePayload) crossCutting.push(say("cross.threat", "Threat protection")); // threat protection engaged

  // --- adaptive outcomes ----------------------------------------------------
  add(
    say("stage.adaptive", "Adaptive decision"), // the stage's name
    "conditional",
    say("what.adaptive", "The verdict can be more than allow or block: coach the user, isolate the session in a remote browser, require step-up authentication, or permit a read-only view."), // what happens
    r.managedDevice
      ? say("because.adaptiveManaged", "Device posture is known, so policy can be more permissive with justification rather than simply refusing.") // managed
      : say("because.adaptiveUnmanaged", "The device is unmanaged, which is the case where isolation and read-only outcomes earn their keep - access without the data landing on the endpoint."), // unmanaged
  );

  if (!r.managedDevice) {
    notes.push(say("note.unmanaged", "On an unmanaged device the interesting policy outcomes are not allow and block. Remote browser isolation and read-only access let work continue while keeping data off an endpoint nobody controls.")); // unmanaged outcomes
  }
  if (r.steering === "dns") {
    warnings.push(say("warn.dns", "DNS steering cannot distinguish two applications that share an address, and it carries no user identity. It is a coarse instrument - useful for coverage, insufficient for activity-level policy.")); // DNS steering
  }
  if (r.tls && !r.decrypt) {
    warnings.push(say("warn.noDecrypt", "Without decryption, every stage below application identification is working from metadata. A policy written as though content were visible will not do what its author believes.")); // no decryption
  }
  if (r.destination === "private-app" && r.steering !== "client") {
    notes.push(say("note.privateApp", "Private application access is normally brokered through the endpoint agent, because the broker needs to know the user rather than the site.")); // private apps via the client
  }

  // --- the contrast, which is the point -------------------------------------
  const contrast: EngineText[] = [
    say("contrast.decrypt", "Chained appliances decrypt and re-encrypt at every hop. A single pass decrypts once and hands the same stream to every engine."), // decryption
    say("contrast.policy", "Chained appliances each hold their own policy. A single engine holds one policy, so 'block this data leaving' does not need writing four times in four dialects."), // policy
    say("contrast.latency", "Chained appliances add their latencies together, and each one is a place the chain can break. A single pass adds its engines in parallel within one traversal."), // latency
  ];
  notes.push(say("note.singlePass", // the architectural claim
    "Single-pass is an architectural claim, not a bundling claim. Several products are sold as converged and are four engines behind one invoice - the question to ask is whether the payload is decrypted once or once per engine.",
  ));

  return { stages, pillars, crossCutting, contrast, notes, warnings };
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: RequestShape): PassResult {
  return explainPass(input);
}

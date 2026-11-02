// ============================================================================
// src/lib/tools/netskope-steering-explainer/compute.ts
// ----------------------------------------------------------------------------
// NETSKOPE STEERING-METHOD EXPLAINER - the pure engine.
//
// THE QUESTION. Traffic has to reach the service edge before any policy applies,
// and there are five ways to get it there: the endpoint client, an IPsec tunnel,
// a GRE tunnel, an explicit proxy, and proxy chaining from a proxy you already
// run. They are not interchangeable. Each one changes what the edge can KNOW,
// not merely how the packets arrive.
//
// This takes a description of the situation and says which method fits, what it
// costs, and - the part that matters - WHAT YOU LOSE by choosing it.
//
// *** THE INTERACTION THAT SURPRISES PEOPLE ***
//
//   The Netskope Client DETECTS other steering methods, and by default it
//   DISABLES ITSELF when it finds IPsec, GRE or an explicit proxy.
//
// So "we have the client AND a tunnel" is not automatically belt and braces. It
// is one of them, and which one depends on a setting most people have never
// opened. The client can be deliberately configured to steer anyway - and it
// can also be deployed alongside a tunnel purely to provision certificates and
// supply user identity, which is a different and very useful arrangement.
//
// *** THE SECOND THING, AND IT IS A HARD LIMIT ***
//
//   TLS inspection and SAML authentication require the Netskope root and
//   intermediate certificates on the endpoint.
//
// A tunnel from a site carries traffic from devices nobody manages. If the
// certificate bundle cannot be installed on those devices, the traffic arrives
// but cannot be decrypted, and every policy that assumes content visibility is
// writing cheques the deployment cannot cash.
//
// SCOPE. Deterministic and offline. Describes a design; it does not read a
// tenant, and it cannot know your licences.
//
// PAGE LANGUAGE (02/11/2026): every reason, cost, note, warning and error is
// built as an EngineText (src/lib/tools/engine-text.ts): a stable id, the
// English as before, and its values. explainSteeringLocalisable() returns them
// as such for the page (pack keys tools.netskope-steering-explainer.engine.<id>);
// explainSteering() and run() return plainText() of the same reading, so the API
// and the golden vectors are unchanged.
// ============================================================================

import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

export type Method = "client" | "ipsec" | "gre" | "explicit-proxy" | "proxy-chain";

export interface Situation {
  /** Is the device managed by the organisation? */
  managedDevice: boolean;
  /** Is the user on a corporate site, or anywhere? */
  onPremises: boolean;
  /** Can the Netskope certificate bundle be installed on the endpoint? */
  canInstallCert: boolean;
  /** Does policy need to name the user, not just the site? */
  needUserIdentity: boolean;
  /** Does the design need private application access? */
  needPrivateApps: boolean;
  /** Traffic beyond ports 80 and 443. */
  needNonWebPorts: boolean;
  /** An existing on-premises proxy that is staying, at least for now. */
  existingProxy: boolean;
}

/** S is string in the API's reading and EngineText in the page's (explainSteeringLocalisable). */
export interface Recommendation<S = string> {
  method: Method;
  fit: "primary" | "secondary" | "unsuitable";
  why: S; // a sentence
  /** What this method cannot do, stated whether or not it was chosen. */
  costs: S[]; // each a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface SteeringResult<S = string> {
  recommendations: Recommendation<S>[]; // each method
  primary?: Method;
  notes: S[]; // each a sentence
  warnings: S[]; // each a sentence
}

export class SteeringInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SteeringInputError";
  }
}

/** Work out which steering method fits the described situation. */
export function explainSteering(s: Situation): SteeringResult {
  return plainText(explainSteeringLocalisable(s)); // the same reading, as English (the API's and the vectors')
} // explainSteering

/** The page's reading: the same as explainSteering(), with every sentence an EngineText (id, English, values). */
export function explainSteeringLocalisable(s: Situation): SteeringResult<EngineText> {
  if (!s || typeof s.managedDevice !== "boolean") {
    const m = say("err.noSituation", "Describe the situation: at least whether the device is managed."); // nothing described
    throw withEngineText(new SteeringInputError(m.text), m); // the same class and message, plus the sentence
  }
  const recs: Recommendation<EngineText>[] = []; // each method, sentences with ids
  const notes: EngineText[] = []; // each note with its id
  const warnings: EngineText[] = []; // each warning with its id

  // --- the client ----------------------------------------------------------
  const clientFits = s.managedDevice;
  recs.push({
    method: "client",
    fit: clientFits ? "primary" : "unsuitable",
    why: clientFits
      ? say("why.client", "The endpoint agent is the recommended method for end-user traffic, and the only one that carries user identity and device posture with the flow rather than inferring them. It follows the user off the corporate network, which a tunnel from a site cannot do.") // the client fits
      : say("why.clientUnmanaged", "An agent cannot be installed on a device the organisation does not manage. That is not a limitation of the product; it is what unmanaged means."), // unmanaged
    costs: [
      say("cost.clientDeploy", "It has to be deployed and kept current on every device, which is an endpoint-management problem before it is a security one."), // deployment
      say("cost.clientTamper", "Steering exceptions live on the client, so a device that has been tampered with is a device whose exceptions you no longer control."), // tampering
    ],
  });

  // --- tunnels -------------------------------------------------------------
  const tunnelFits = s.onPremises;
  const tunnelNoSite = say("why.tunnelNoSite", "A tunnel steers a site. It cannot follow a user who is not at that site."); // a tunnel off-site
  recs.push({
    method: "ipsec",
    fit: tunnelFits ? "primary" : "unsuitable",
    why: tunnelFits // at a site, or not
      ? say("why.ipsec", "A tunnel from the site steers everything leaving it, including devices that will never run an agent - printers, appliances, contractor laptops. It also preserves the user's private address, which is what makes address-based policy and detailed logging possible. IPsec encrypts the hop, which matters when the path to the edge is not already trusted.") // IPsec fits
      : tunnelNoSite, // not at a site
    costs: [
      say("cost.tunnelIdentity", "It knows the site, not the person. User identity has to come from somewhere else - commonly the client deployed alongside it purely to provision certificates and identify the user."), // identity
      say("cost.tunnelTwo", "Build at least two tunnels to different data planes. One tunnel is a single point of failure for an entire site."), // redundancy
    ],
  });
  recs.push({
    method: "gre",
    fit: tunnelFits ? "secondary" : "unsuitable",
    why: tunnelFits
      ? say("why.gre", "The same site-level steering as IPsec without the encryption overhead, for a path that is already private. Choose it over IPsec on throughput grounds, not on convenience grounds.") // GRE fits
      : tunnelNoSite, // not at a site
    costs: [say("cost.greClear", "Unencrypted on that hop, so it belongs only where the path is genuinely trusted."), say("cost.greIdentity", "Same identity gap as IPsec: it knows the site.")], // GRE's costs
  });

  // --- explicit proxy ------------------------------------------------------
  recs.push({
    method: "explicit-proxy",
    fit: !s.managedDevice && s.onPremises ? "secondary" : s.managedDevice ? "secondary" : "unsuitable",
    why:
      say("why.explicitProxy", "Point the browser or the operating system at the service and traffic goes there without an agent or a tunnel. It is the method for legacy and regulated environments, and for cases where policy-based routing cannot be configured."), // explicit proxy
    costs: [
      say("cost.proxyOnly", "It steers what is configured to use it, and nothing else. An application that ignores proxy settings is simply not steered, and nothing will tell you so."), // only what is configured
      say("cost.proxyPerApp", "It is a per-application or per-system setting, which means it is a per-application or per-system failure."), // per application
    ],
  });

  // --- proxy chaining ------------------------------------------------------
  recs.push({
    method: "proxy-chain",
    fit: s.existingProxy ? "secondary" : "unsuitable",
    why: s.existingProxy
      ? say("why.proxyChain", "The proxy already in place forwards to the service edge. This is a migration method: it lets the estate move without touching every endpoint on the same day.") // chaining fits
      : say("why.proxyChainNone", "There is no existing proxy to chain from. Introducing one to enable this would be adding a hop in order to have a hop."), // nothing to chain from
    costs: [
      say("cost.chainFirst", "The first proxy is still in the path and still yours to run, patch and troubleshoot. Two proxies fail in more ways than one."), // two proxies
      say("cost.chainPhase", "Treat it as a phase rather than a destination, and record what would end it."), // a phase
    ],
  });

  // --- the interactions ----------------------------------------------------
  const primary = recs.find((r) => r.fit === "primary")?.method;

  if (clientFits && tunnelFits) {
    warnings.push(say("warn.clientDisables", // the client steps aside
      "The client and a tunnel are both viable here, and that is where the surprise lives: the client detects other steering methods and by default DISABLES ITSELF when it finds IPsec, GRE or an explicit proxy. Running both is not automatically belt and braces - it is one of them, decided by a setting. Choose deliberately, and if the intent is for the client to keep steering, that has to be configured.",
    ));
    notes.push(say("note.thirdArrangement", // client for identity
      "There is a third arrangement worth knowing: deploy the client alongside the tunnel not to steer, but to provision certificates and supply user identity. The tunnel carries the traffic, the client answers who the user is.",
    ));
  }

  if (!s.canInstallCert) {
    warnings.push(say("warn.noCert", // no certificates
      "Without the Netskope root and intermediate certificates on the endpoint, there is no TLS inspection and no SAML authentication. Traffic still arrives and policy still runs - on metadata. Any rule written as though content were visible will not do what its author believes, and it will look correct in the console.",
    ));
  }

  if (s.needUserIdentity && !clientFits) {
    warnings.push(say("warn.identity", // identity without the client
      "User identity is required and the client is not available. A tunnel identifies the site; identity must come from an explicit proxy with authentication, from an identity provider integration, or from the client deployed for identity alone.",
    ));
  }

  if (s.needNonWebPorts) {
    notes.push(say("note.nonWeb", // non-web ports
      "Traffic beyond ports 80 and 443 needs the steering configuration set to all traffic rather than web traffic. Non-standard ports declared as web are sent to the proxy and are NOT inspected by the cloud firewall - so declaring a port as web when it carries something else quietly removes it from firewall policy.",
    ));
  }

  if (s.needPrivateApps) {
    notes.push(say("note.privateApps", // private applications
      "Private application access is a separate steering decision from web traffic, and the client is normally where it lands, because the broker needs to know the user rather than the site.",
    ));
  }

  notes.push(say("note.visibility", // steering sets visibility
    "Steering decides what the edge can see. Everything downstream - inspection, data protection, policy - is limited by what arrived, and a connected client or an established tunnel is one checkpoint rather than proof that a particular request was inspected.",
  ));
  notes.push(say("note.bypassVsNoDecrypt", // bypass is not do-not-decrypt
    "A steering bypass and a do-not-decrypt rule are different things. The first means the traffic never reaches the service; the second means it arrives and is not opened. Certificate-pinned applications usually need the first, and confusing them produces a policy that looks applied and never ran.",
  ));

  return { recommendations: recs, primary, notes, warnings };
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: Situation): SteeringResult {
  return explainSteering(input);
}

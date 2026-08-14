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
// ============================================================================

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

export interface Recommendation {
  method: Method;
  fit: "primary" | "secondary" | "unsuitable";
  why: string;
  /** What this method cannot do, stated whether or not it was chosen. */
  costs: string[];
}

export interface SteeringResult {
  recommendations: Recommendation[];
  primary?: Method;
  notes: string[];
  warnings: string[];
}

export class SteeringInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SteeringInputError";
  }
}

/** Work out which steering method fits the described situation. */
export function explainSteering(s: Situation): SteeringResult {
  if (!s || typeof s.managedDevice !== "boolean") {
    throw new SteeringInputError("Describe the situation: at least whether the device is managed.");
  }

  const recs: Recommendation[] = [];
  const notes: string[] = [];
  const warnings: string[] = [];

  // --- the client ----------------------------------------------------------
  const clientFits = s.managedDevice;
  recs.push({
    method: "client",
    fit: clientFits ? "primary" : "unsuitable",
    why: clientFits
      ? "The endpoint agent is the recommended method for end-user traffic, and the only one that carries user identity and device posture with the flow rather than inferring them. It follows the user off the corporate network, which a tunnel from a site cannot do."
      : "An agent cannot be installed on a device the organisation does not manage. That is not a limitation of the product; it is what unmanaged means.",
    costs: [
      "It has to be deployed and kept current on every device, which is an endpoint-management problem before it is a security one.",
      "Steering exceptions live on the client, so a device that has been tampered with is a device whose exceptions you no longer control.",
    ],
  });

  // --- tunnels -------------------------------------------------------------
  const tunnelFits = s.onPremises;
  const tunnelWhy = tunnelFits
    ? "A tunnel from the site steers everything leaving it, including devices that will never run an agent - printers, appliances, contractor laptops. It also preserves the user's private address, which is what makes address-based policy and detailed logging possible."
    : "A tunnel steers a site. It cannot follow a user who is not at that site.";
  recs.push({
    method: "ipsec",
    fit: tunnelFits ? "primary" : "unsuitable",
    why: tunnelWhy + (tunnelFits ? " IPsec encrypts the hop, which matters when the path to the edge is not already trusted." : ""),
    costs: [
      "It knows the site, not the person. User identity has to come from somewhere else - commonly the client deployed alongside it purely to provision certificates and identify the user.",
      "Build at least two tunnels to different data planes. One tunnel is a single point of failure for an entire site.",
    ],
  });
  recs.push({
    method: "gre",
    fit: tunnelFits ? "secondary" : "unsuitable",
    why: tunnelFits
      ? "The same site-level steering as IPsec without the encryption overhead, for a path that is already private. Choose it over IPsec on throughput grounds, not on convenience grounds."
      : tunnelWhy,
    costs: ["Unencrypted on that hop, so it belongs only where the path is genuinely trusted.", "Same identity gap as IPsec: it knows the site."],
  });

  // --- explicit proxy ------------------------------------------------------
  recs.push({
    method: "explicit-proxy",
    fit: !s.managedDevice && s.onPremises ? "secondary" : s.managedDevice ? "secondary" : "unsuitable",
    why:
      "Point the browser or the operating system at the service and traffic goes there without an agent or a tunnel. It is the method for legacy and regulated environments, and for cases where policy-based routing cannot be configured.",
    costs: [
      "It steers what is configured to use it, and nothing else. An application that ignores proxy settings is simply not steered, and nothing will tell you so.",
      "It is a per-application or per-system setting, which means it is a per-application or per-system failure.",
    ],
  });

  // --- proxy chaining ------------------------------------------------------
  recs.push({
    method: "proxy-chain",
    fit: s.existingProxy ? "secondary" : "unsuitable",
    why: s.existingProxy
      ? "The proxy already in place forwards to the service edge. This is a migration method: it lets the estate move without touching every endpoint on the same day."
      : "There is no existing proxy to chain from. Introducing one to enable this would be adding a hop in order to have a hop.",
    costs: [
      "The first proxy is still in the path and still yours to run, patch and troubleshoot. Two proxies fail in more ways than one.",
      "Treat it as a phase rather than a destination, and record what would end it.",
    ],
  });

  // --- the interactions ----------------------------------------------------
  const primary = recs.find((r) => r.fit === "primary")?.method;

  if (clientFits && tunnelFits) {
    warnings.push(
      "The client and a tunnel are both viable here, and that is where the surprise lives: the client detects other steering methods and by default DISABLES ITSELF when it finds IPsec, GRE or an explicit proxy. Running both is not automatically belt and braces - it is one of them, decided by a setting. Choose deliberately, and if the intent is for the client to keep steering, that has to be configured.",
    );
    notes.push(
      "There is a third arrangement worth knowing: deploy the client alongside the tunnel not to steer, but to provision certificates and supply user identity. The tunnel carries the traffic, the client answers who the user is.",
    );
  }

  if (!s.canInstallCert) {
    warnings.push(
      "Without the Netskope root and intermediate certificates on the endpoint, there is no TLS inspection and no SAML authentication. Traffic still arrives and policy still runs - on metadata. Any rule written as though content were visible will not do what its author believes, and it will look correct in the console.",
    );
  }

  if (s.needUserIdentity && !clientFits) {
    warnings.push(
      "User identity is required and the client is not available. A tunnel identifies the site; identity must come from an explicit proxy with authentication, from an identity provider integration, or from the client deployed for identity alone.",
    );
  }

  if (s.needNonWebPorts) {
    notes.push(
      "Traffic beyond ports 80 and 443 needs the steering configuration set to all traffic rather than web traffic. Non-standard ports declared as web are sent to the proxy and are NOT inspected by the cloud firewall - so declaring a port as web when it carries something else quietly removes it from firewall policy.",
    );
  }

  if (s.needPrivateApps) {
    notes.push(
      "Private application access is a separate steering decision from web traffic, and the client is normally where it lands, because the broker needs to know the user rather than the site.",
    );
  }

  notes.push(
    "Steering decides what the edge can see. Everything downstream - inspection, data protection, policy - is limited by what arrived, and a connected client or an established tunnel is one checkpoint rather than proof that a particular request was inspected.",
  );
  notes.push(
    "A steering bypass and a do-not-decrypt rule are different things. The first means the traffic never reaches the service; the second means it arrives and is not opened. Certificate-pinned applications usually need the first, and confusing them produces a policy that looks applied and never ran.",
  );

  return { recommendations: recs, primary, notes, warnings };
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: Situation): SteeringResult {
  return explainSteering(input);
}

// ============================================================================
// src/content/vendors/profiles/red-hat.ts
// ----------------------------------------------------------------------------
// RED HAT - the company that made open source a business model, and IBM's
// largest acquisition. Knowledge-based, well-documented (2026-07-15): Marc
// Ewing's Red Hat Linux ships 1994 (the fedora-hat name from his Cornell
// lacrosse cap); Bob Young's ACC Corporation merges with Ewing's work to
// incorporate Red Hat Software 1995; IPO August 1999 - one of Wall Street's
// largest first-day pops of the dot-com era; RHEL model debuts 2002 with
// Fedora as the community project from 2003; JBoss 2006, Ansible 2015,
// CoreOS 2018; IBM's ~$34B acquisition closed July 9, 2019 - then the
// largest software acquisition ever; Matt Hicks CEO July 2022; CentOS
// Stream shift announced December 2020.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const redHatProfile: VendorProfile = {
  slug: "red-hat",
  foundings: [
    {
      company: "Red Hat",
      year: 1995,
      place: "Durham, North Carolina",
      founders: ["Bob Young", "Marc Ewing"],
      story:
        "Marc Ewing built his Linux distribution in 1994 and named it for the red Cornell lacrosse cap he wore; Bob Young was selling Linux CDs out of a catalog business and knew distribution when he saw it. Their 1995 merger incorporated Red Hat Software around a heretical idea: give the software away and sell the trust - packaging, updates, certification, support. The August 1999 IPO, one of the wildest first days of the dot-com era, put a market price on that idea; the 2002 pivot to Red Hat Enterprise Linux perfected it. Subscriptions to open source became a business the size of a software giant - which is exactly what eventually bought it.",
    },
  ],
  timeline: [
    { year: 1994, title: "Red Hat Linux ships", detail: "Ewing's distribution arrives with RPM package management on the way - Linux made installable for people with jobs; Young's merger incorporates Red Hat Software the following year." },
    { year: 1999, title: "The IPO heard round the Valley", detail: "The August listing rockets on day one - open source arrives on Wall Street, with Red Hat as the proof that free software could carry a ticker." },
    { year: 2002, title: "RHEL: the model perfected", detail: "Red Hat Enterprise Linux splits the stable, certified, subscription product from the fast-moving community stream - Fedora, from 2003 - creating the template every open-source business since has studied." },
    { year: 2006, title: "Up the stack: JBoss", detail: "The JBoss acquisition adds middleware; Ansible (2015) later adds automation and CoreOS (2018) adds container-Linux DNA - each one widening subscriptions beyond the operating system." },
    { year: 2019, title: "IBM: $34 billion", detail: "IBM completes the acquisition on July 9, 2019 - then the largest software deal in history - buying OpenShift's hybrid-cloud position as much as RHEL, with Red Hat kept deliberately semi-autonomous. Matt Hicks takes the CEO chair in 2022." },
    { year: 2020, title: "CentOS Stream", detail: "The December announcement moves CentOS from downstream rebuild to upstream Stream - controversial with rebuilders, clarifying for the RHEL business, and the spark for a new generation of downstream distributions." },
  ],
  products: [
    { name: "Red Hat Enterprise Linux", what: "The operating system of enterprise open source - the subscription, certification ecosystem, and ten-year lifecycles the model is built on." },
    { name: "OpenShift", what: "The Kubernetes platform - the hybrid-cloud centerpiece that motivated the IBM deal." },
    { name: "Ansible Automation Platform", what: "The automation lingua franca - and the configuration language behind a fair share of the network world's tooling, this site's audience included." },
  ],
  innovations: [
    { title: "The open-source business model", detail: "RHEL's subscription-and-certification structure proved free software could fund an enterprise vendor - the template for every commercial open-source company after it." },
    { title: "RPM and the distribution craft", detail: "Package management, dependency resolution, and the release-engineering discipline Red Hat built became the substrate of enterprise Linux itself." },
  ],
  markets: [
    "Inside IBM since 2019 but run as the open-source standard-bearer: RHEL and OpenShift anchor hybrid cloud across essentially every industry, against Canonical, SUSE, and the hyperscalers' own stacks.",
  ],
  analyst: [
    "The reference vendor of enterprise Linux and a Leader in the container-platform evaluations - the rare company whose product names are also category names.",
  ],
};

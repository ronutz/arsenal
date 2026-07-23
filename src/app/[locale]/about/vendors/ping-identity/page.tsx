// ============================================================================
// Vendor page: Ping Identity and ForgeRock. The identity convergence chapter:
// two bloodlines - Denver-born federation (Ping, 2002) and the Norwegian fork
// of Sun Microsystems' open-source identity stack (ForgeRock, 2010; OpenSSO ->
// OpenAM, OpenDS -> OpenDJ) - combined by Thoma Bravo on August 23, 2023.
// Lineage diagram REINSTATED AND REBUILT RICH (PRIME 2026-07-22, superseding
// the same-day retirement): KEEP LineageDiagram everywhere; this page carries
// the NEW RICH reference implementation - THREE bloodlines (Denver federation,
// the Sun open-source line through ForgeRock, and the UnboundID directory
// craft that became PingDirectory), five stages, tones telling the story.
// RICH Lineage is now MANDATORY on every vendor's details, exactly like the
// RICH Timeline (the F5 standard). PingFederate Practitioner 2025; hub open.
// Authorized Ping Identity instructor since 2026 (PRIME 2026-07-15).
// s2 authorization sentence REMOVED and section retitled (PRIME 2026-07-16):
// the page now closes on the hub/toolset chapter like its siblings.
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";
import type { LineageStage } from "@/components/LineageDiagram";
import { pingIdentityProfile } from "@/content/vendors/profiles/ping-identity";



const lineageStages: LineageStage[] = [
  {
    nodes: [
      { label: "Ping Identity", note: "Denver, 2002 · Andre Durand", tone: "default" },
      { label: "Sun Microsystems", note: "OpenSSO 2005 · OpenDS 2006", tone: "default" },
      { label: "UnboundID", note: "Austin · Sun directory alumni", tone: "default" },
    ],
  },
  {
    edgeLabel: "2010: Oracle absorbs Sun; five engineers fork the stack in Oslo",
    nodes: [
      { label: "Ping Identity", note: "PingFederate · SAML, OAuth, OIDC", tone: "default" },
      { label: "ForgeRock", note: "Oslo, 2010 · OpenAM, OpenDJ", tone: "default" },
    ],
  },
  {
    edgeLabel: "2016: Ping acquires UnboundID; Vista funds the platform",
    nodes: [
      { label: "Ping Identity", note: "PingDirectory · NYSE 2019", tone: "default" },
      { label: "ForgeRock", note: "Identity Platform · NYSE 2021", tone: "default" },
    ],
  },
  {
    edgeLabel: "2022: Thoma Bravo takes both private",
    nodes: [
      { label: "Ping Identity", note: "$2.8B · Oct 18, 2022", tone: "muted" },
      { label: "ForgeRock", note: "$2.3B agreement", tone: "muted" },
    ],
  },
  {
    edgeLabel: "Aug 23, 2023: combined the day the deal closes",
    nodes: [
      { label: "Ping Identity", note: "One platform, both heritages · DaVinci", tone: "accent" },
    ],
  },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="ping"
      sections={["s1", "s2"]}
      lineage={{ stages: lineageStages, titleKey: "ping.lineageTitle", descKey: "ping.lineageDesc" }}
      icons={["gateway", "switch", "router"]}
      profile={pingIdentityProfile}
      next={{ slug: "zscaler", key: "zscaler" }}
    />
  );
}

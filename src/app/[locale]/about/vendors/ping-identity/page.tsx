// ============================================================================
// Vendor page: Ping Identity and ForgeRock. The identity convergence chapter:
// two bloodlines - Denver-born federation (Ping, 2002) and the Norwegian fork
// of Sun Microsystems' open-source identity stack (ForgeRock, 2010; OpenSSO ->
// OpenAM, OpenDS -> OpenDJ) - combined by Thoma Bravo on August 23, 2023.
// Includes the genealogy diagram. PingFederate Practitioner 2025; hub planned.
// NOT an authorized-training vendor for Rodolfo (guardrail stated in i18n).
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";
import type { LineageStage } from "@/components/LineageDiagram";
import { pingIdentityProfile } from "@/content/vendors/profiles/ping-identity";

const lineageStages: LineageStage[] = [
  {
    nodes: [
      { label: "Ping Identity", note: "Denver, 2002 · PingFederate", tone: "default" },
      { label: "Sun Microsystems", note: "OpenSSO open-sourced 2005", tone: "default" },
    ],
  },
  {
    edgeLabel: "2010: Oracle absorbs Sun; five engineers fork the stack",
    nodes: [
      { label: "ForgeRock", note: "Oslo, 2010 · OpenAM, OpenDJ · NYSE 2021", tone: "default" },
    ],
  },
  {
    edgeLabel: "2022 take-privates; combined Aug 23, 2023",
    nodes: [
      { label: "Ping Identity", note: "One platform, both heritages (Thoma Bravo)", tone: "default" },
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
      icons={["gateway", "switch", "router"]}
      lineage={{ stages: lineageStages, titleKey: "ping.lineageTitle", descKey: "ping.lineageDesc" }}
      profile={pingIdentityProfile}
      next={{ slug: "zscaler", key: "zscaler" }}
    />
  );
}

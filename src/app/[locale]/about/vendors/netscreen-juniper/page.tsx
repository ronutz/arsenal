// ============================================================================
// Vendor page: NetScreen and Juniper. Includes the genealogy diagram
// (NetScreen acquired by Juniper in 2004, becoming the SRX security line) and
// original technology icons. Content in the "vendors" namespace.
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";
import type { LineageStage } from "@/components/LineageDiagram";
import { netscreenJuniperProfile } from "@/content/vendors/profiles/netscreen-juniper";

const lineageStages: LineageStage[] = [
  {
    nodes: [{ label: "NetScreen", note: "SSG firewalls", tone: "default" }],
  },
  {
    edgeLabel: "2004 acquisition",
    nodes: [{ label: "Juniper Networks", note: "Worked here 2009 – 2010", tone: "default" }],
  },
  {
    edgeLabel: "became",
    nodes: [{ label: "SRX line", note: "Secure gateways", tone: "default" }],
  },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="juniper"
      sections={["s1", "s2"]}
      icons={["firewall", "gateway", "switch", "router"]}
      lineage={{ stages: lineageStages, titleKey: "juniper.lineageTitle", descKey: "juniper.lineageDesc" }}
      profile={netscreenJuniperProfile}
      next={{ slug: "extreme", key: "extreme" }}
    />
  );
}

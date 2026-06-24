// ============================================================================
// Vendor page: Cabletron and Enterasys. Includes the corporate-genealogy
// diagram (Cabletron's 2000 four-way split; Enterasys to Extreme in 2013) and
// original technology icons. Content in the "vendors" namespace.
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";
import type { LineageStage } from "@/components/LineageDiagram";

// The verified corporate lineage, as diagram stages.
const lineageStages: LineageStage[] = [
  {
    nodes: [
      { label: "Cabletron Systems", note: "Worked here 1996 – 2000", tone: "default" },
    ],
  },
  {
    edgeLabel: "2000 split",
    nodes: [
      { label: "Enterasys", note: "Worked here 2005 – 2007", tone: "default" },
      { label: "Riverstone", tone: "muted" },
      { label: "Aprisma", tone: "muted" },
      { label: "GNTS", tone: "muted" },
    ],
  },
  {
    edgeLabel: "2013",
    nodes: [{ label: "Extreme Networks", note: "Taught today", tone: "accent" }],
  },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="cabletron"
      sections={["s1", "s2"]}
      icons={["switch", "router", "wlan", "firewall"]}
      lineage={{ stages: lineageStages, titleKey: "cabletron.lineageTitle", descKey: "cabletron.lineageDesc" }}
      next={{ slug: "riverstone", key: "riverstone" }}
    />
  );
}

// ============================================================================
// Vendor page: Riverstone Networks. Includes the genealogy diagram (Yago,
// acquired by Cabletron ~1998, spun off as Riverstone in 2001, acquired by
// Alcatel-Lucent in 2006) and original technology icons. Content in "vendors".
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";
import type { LineageStage } from "@/components/LineageDiagram";

const lineageStages: LineageStage[] = [
  { nodes: [{ label: "Yago", tone: "muted" }] },
  { edgeLabel: "~1998", nodes: [{ label: "Cabletron Systems", tone: "default" }] },
  { edgeLabel: "2001 spin-off", nodes: [{ label: "Riverstone", note: "Worked here 2000 – 2002", tone: "default" }] },
  { edgeLabel: "2006", nodes: [{ label: "Alcatel-Lucent", tone: "muted" }] },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="riverstone"
      sections={["s1", "s2"]}
      icons={["metro", "router", "switch"]}
      lineage={{ stages: lineageStages, titleKey: "riverstone.lineageTitle", descKey: "riverstone.lineageDesc" }}
      next={{ slug: "cisco", key: "cisco" }}
    />
  );
}

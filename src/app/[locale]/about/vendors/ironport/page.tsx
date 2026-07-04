// ============================================================================
// Vendor page: IronPort Systems. A brief, independent pre-acquisition
// engagement (late 2004), promoted from a note on the Cisco page to its own
// entry. IronPort was acquired by Cisco in 2007 — after this work — so it is
// recorded here as its own company. Content in the "vendors" namespace.
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="ironport"
      sections={["s1", "s2"]}
      icons={["gateway", "firewall"]}
      next={{ slug: "netscreen-juniper", key: "juniper" }}
    />
  );
}

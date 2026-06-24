// ============================================================================
// Vendor page: Cisco Systems. Original technology icons; includes the IronPort
// special note (accurate, clearly-separated pre-acquisition engagement).
// Content in the "vendors" namespace.
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="cisco"
      sections={["s1", "s2"]}
      icons={["switch", "router", "firewall", "loadbalancer"]}
      specialNote="ironport"
      next={{ slug: "netscreen-juniper", key: "juniper" }}
    />
  );
}

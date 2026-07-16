// ============================================================================
// Vendor page: Fortinet. Second teaching pillar: NSE ladder 2022, Fortinet Certified Trainer 2024, five FCP courses; the Ken Xie / NetScreen bridge to the Juniper page.
// Content in the "vendors" namespace; rich corporate profile below the
// career narrative (same pattern as the Extreme page).
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";
import { fortinetProfile } from "@/content/vendors/profiles/fortinet";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="fortinet"
      sections={["s1", "s2"]}
      icons={["firewall", "gateway", "switch"]}
      profile={fortinetProfile}
      next={{ slug: "netskope", key: "netskope" }}
    />
  );
}

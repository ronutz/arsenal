// ============================================================================
// Vendor page: Pulse Secure. The distribution chapter's secure-access thread
// (ScanSource year, 2018-2019): Neoteris to NetScreen to Juniper to Siris to
// Ivanti, one product family under five flags. Content in the "vendors"
// namespace; rich corporate profile below the career narrative (same pattern
// as the Extreme page). Chain: distribution -> pulse-secure -> palo-alto.
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";
import { pulseSecureProfile } from "@/content/vendors/profiles/pulse-secure";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="pulse"
      sections={["s1", "s2"]}
      icons={["gateway", "firewall", "metro"]}
      profile={pulseSecureProfile}
      next={{ slug: "palo-alto", key: "paloalto" }}
    />
  );
}

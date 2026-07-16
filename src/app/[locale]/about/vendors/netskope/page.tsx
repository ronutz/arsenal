// ============================================================================
// Vendor page: Netskope. The newest teaching pillar: accreditation sprint 2024-2026, Netskope Certified Cloud Security Instructor 2025.
// Content in the "vendors" namespace; rich corporate profile below the
// career narrative (same pattern as the Extreme page).
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";
import { netskopeProfile } from "@/content/vendors/profiles/netskope";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="netskope"
      sections={["s1", "s2"]}
      icons={["gateway", "firewall", "wlan"]}
      profile={netskopeProfile}
      next={{ slug: "ping-identity", key: "ping" }}
    />
  );
}

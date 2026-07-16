// ============================================================================
// Vendor page: Zscaler. The newest chapter: hub open (JA3/JA4 carry the
// zscaler tag), authorized Zscaler instructor since 2026 (PRIME 2026-07-15).
// Content in the "vendors" namespace; rich corporate profile below the
// career narrative (same pattern as the Extreme page).
// s2 authorization sentence REMOVED and section retitled (PRIME 2026-07-16):
// the page now closes on the hub/fingerprinting chapter like its siblings.
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";
import { zscalerProfile } from "@/content/vendors/profiles/zscaler";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="zscaler"
      sections={["s1", "s2"]}
      icons={["gateway", "firewall", "metro"]}
      profile={zscalerProfile}
      next={null}
    />
  );
}

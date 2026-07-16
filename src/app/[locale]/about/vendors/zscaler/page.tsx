// ============================================================================
// Vendor page: Zscaler. The chapter opening now: Zero Trust Exchange study, hub on the roadmap. NOT an authorized-training vendor for Rodolfo (guardrail stated in i18n).
// Content in the "vendors" namespace; rich corporate profile below the
// career narrative (same pattern as the Extreme page).
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

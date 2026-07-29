// ============================================================================
// Vendor page: F5. The platform Rodolfo teaches most: certified since 2015, F5 Authorized Instructor since 2020, DevCentral MVP 2022-2024. Newest career chapter block (2015 - present).
// Content in the "vendors" namespace; rich corporate profile below the
// career narrative (same pattern as the Extreme page).
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";
import { f5Profile } from "@/content/vendors/profiles/f5";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="f5"
      sections={["s1", "s2"]}
      icons={["loadbalancer", "gateway", "firewall"]}
      profile={f5Profile}
      next={{ slug: "fortinet", key: "fortinet" }}
    />
  );
}

// ============================================================================
// Vendor page: Palo Alto Networks. Original technology icons. Last in the
// sequence (next: f5 - the teaching-era chapters follow, PRIME 2026-07-15). Content in the "vendors" namespace.
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";
import { paloAltoProfile } from "@/content/vendors/profiles/palo-alto";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="paloalto"
      sections={["s1", "s2"]}
      icons={["firewall", "gateway"]}
      profile={paloAltoProfile}
      next={{ slug: "f5", key: "f5" }}
    />
  );
}

// ============================================================================
// Vendor page: Palo Alto Networks. Original technology icons. Last in the
// sequence (next: null). Content in the "vendors" namespace.
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="paloalto"
      sections={["s1", "s2"]}
      icons={["firewall", "gateway"]}
      next={null}
    />
  );
}

// ============================================================================
// Vendor page: FireEye, McAfee and Ixia. A combined entry for the 2015–2018
// value-added distribution years — three security and test-and-measurement
// vendors carried into the Brazilian channel. The distributor names are left
// out of the public copy by choice (as with the Extreme partner). Last-but-one
// in the sequence, before Palo Alto. Content in the "vendors" namespace.
// ============================================================================
import { setRequestLocale } from "next-intl/server";
import VendorPage from "@/components/VendorPage";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <VendorPage
      vendorKey="distribution"
      sections={["s1", "s2"]}
      icons={["firewall", "gateway"]}
      next={{ slug: "palo-alto", key: "paloalto" }}
    />
  );
}

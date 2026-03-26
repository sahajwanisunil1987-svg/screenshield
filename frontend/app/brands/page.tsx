import type { Metadata } from "next";
import { BrandGrid } from "@/components/catalog/brand-grid";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildMetadata } from "@/lib/seo";
import { fetchApiOrFallback } from "@/lib/server-api";
import { Brand } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Mobile Brands",
  description:
    "Browse all supported mobile brands in the PurjiX catalog and jump directly into compatible spare parts."
});

export default async function BrandsPage() {
  const brands = await fetchApiOrFallback<Brand[]>("/brands", []);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Brands" title="All supported brands" description="Browse available mobile manufacturers in the PurjiX catalog." />
        <BrandGrid brands={brands} />
      </div>
    </PageShell>
  );
}

import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildMetadata } from "@/lib/seo";
import { fetchApi } from "@/lib/server-api";
import { Brand } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Mobile Brands",
  description:
    "Browse all supported mobile brands in the SpareKart catalog and jump directly into compatible spare parts."
});

export default async function BrandsPage() {
  const brands = await fetchApi<Brand[]>("/brands");

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Brands" title="All supported brands" description="Browse available mobile manufacturers in the SpareKart catalog." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {brands.map((brand) => (
            <a key={brand.id} href={`/products?brand=${brand.slug}`} className="rounded-[28px] bg-white p-6 shadow-card">
              <h3 className="font-display text-2xl text-ink">{brand.name}</h3>
              <p className="mt-2 text-sm text-slate">{brand.description}</p>
            </a>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

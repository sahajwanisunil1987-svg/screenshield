import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildMetadata } from "@/lib/seo";
import { fetchApiOrFallback } from "@/lib/server-api";
import { Brand } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Mobile Brands",
  description:
    "Browse all supported mobile brands in the SpareKart catalog and jump directly into compatible spare parts."
});

export default async function BrandsPage() {
  const brands = await fetchApiOrFallback<Brand[]>("/brands", []);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Brands" title="All supported brands" description="Browse available mobile manufacturers in the SpareKart catalog." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {brands.map((brand) => (
            <a key={brand.id} href={`/brands/${brand.slug}`} className="rounded-[28px] bg-white p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                  {brand.logoUrl ? (
                    <Image src={brand.logoUrl} alt={`${brand.name} logo`} fill className="object-contain p-2" />
                  ) : (
                    <span className="text-lg font-semibold text-ink">{brand.name.slice(0, 1)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-2xl text-ink">{brand.name}</h3>
                  <p className="mt-2 text-sm text-slate">{brand.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { BrandLogo } from "@/components/catalog/brand-logo";
import { ModelImage } from "@/components/catalog/model-image";
import { PageShell } from "@/components/layout/page-shell";
import { fetchApi } from "@/lib/server-api";
import { buildMetadata } from "@/lib/seo";
import { Brand, MobileModel } from "@/types";

export const revalidate = 300;

type BrandPageProps = {
  params: Promise<{ slug: string }>;
};

const getBrands = cache(() => fetchApi<Brand[]>("/brands", { next: { revalidate: 1800 } }));
const getModels = cache(() => fetchApi<MobileModel[]>("/models", { next: { revalidate: 1800 } }));

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brands = await getBrands();
  const brand = brands.find((entry) => entry.slug === slug);

  if (!brand) {
    return buildMetadata({
      title: "Brand Not Found",
      description: "The requested brand could not be found in the PurjiX catalog."
    });
  }

  return buildMetadata({
    title: `${brand.name} Spare Parts`,
    description: `Browse ${brand.name} models and jump directly into compatible spare parts on PurjiX.`
  });
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const [brands, models] = await Promise.all([getBrands(), getModels()]);

  const brand = brands.find((entry) => entry.slug === slug);

  if (!brand) {
    notFound();
  }

  const brandModels = models.filter((model) => model.brandId === brand.id || model.brand?.slug === brand.slug);

  return (
    <PageShell>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate">
            <Link href="/" className="transition hover:text-ink">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/brands" className="transition hover:text-ink">Brands</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-ink">{brand.name}</span>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[112px_minmax(0,1fr)] lg:items-center">
            <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
              {brand.logoUrl ? (
                <BrandLogo name={brand.name} logoUrl={brand.logoUrl} alt={`${brand.name} logo`} wrapperClassName="h-full w-full" imageClassName="p-4" />
              ) : (
                <span className="text-4xl font-semibold text-ink">{brand.name.slice(0, 1)}</span>
              )}
            </div>
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Brand catalog</p>
              <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">{brand.name} Spare Parts</h1>
              <p className="mt-4 text-base text-slate">
                Choose the exact {brand.name} model first, then move into the compatible batteries, displays, charging parts, cameras, and more.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-ink">{brandModels.length} supported models</span>
                <Link href={`/products?brand=${brand.slug}`} className="rounded-full bg-accent px-5 py-2.5 font-semibold text-white transition hover:bg-teal-700">
                  Open all {brand.name} parts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-page-wash">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700/80">Models</p>
              <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Select your {brand.name} model</h2>
              <p className="mt-3 max-w-2xl text-sm text-slate sm:text-base">
                Open the model page to see grouped spare parts and accessories for that exact device.
              </p>
            </div>
          </div>

          {brandModels.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {brandModels.map((model) => (
                <Link
                  key={model.id}
                  href={`/brands/${brand.slug}/models/${model.slug}`}
                  className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-card transition hover:-translate-y-0.5 hover:border-slate-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-[86px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fafc,#eef2f7)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <ModelImage name={model.name} imageUrl={model.imageUrl} alt={model.name} imageClassName="p-1.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate">Model</p>
                      <h3 className="mt-2 font-display text-2xl text-ink">{model.name}</h3>
                      <p className="mt-2 text-sm text-slate">Open compatible spare parts and accessories for this device.</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate">
              No models are mapped for this brand yet.
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

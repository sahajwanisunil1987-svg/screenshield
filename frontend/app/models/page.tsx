import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildMetadata } from "@/lib/seo";
import { fetchApiOrFallback } from "@/lib/server-api";
import { MobileModel } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Supported Mobile Models",
  description:
    "Find supported phone models and filter directly into compatible SpareKart parts for faster discovery."
});

export default async function ModelsPage() {
  const models = await fetchApiOrFallback<MobileModel[]>("/models", []);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Models" title="Supported mobile models" description="Filter directly by phone model to reach compatible spare parts faster." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <a key={model.id} href={model.brand?.slug ? `/brands/${model.brand.slug}/models/${model.slug}` : `/models/${model.slug}`} className="rounded-[28px] bg-white p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                  {model.imageUrl ? (
                    <Image src={model.imageUrl} alt={model.name} fill className="object-cover" />
                  ) : (
                    <span className="text-lg font-semibold text-ink">{model.name.slice(0, 1)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink">{model.name}</h3>
                  <p className="mt-2 text-sm text-slate">{model.brand?.name ?? "Mapped model"}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

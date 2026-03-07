import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { fetchApi } from "@/lib/server-api";
import { MobileModel } from "@/types";

export const dynamic = "force-dynamic";

export default async function ModelsPage() {
  const models = await fetchApi<MobileModel[]>("/models");

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Models" title="Supported mobile models" description="Filter directly by phone model to reach compatible spare parts faster." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <a key={model.id} href={`/products?model=${model.slug}`} className="rounded-[28px] bg-white p-6 shadow-card">
              <h3 className="font-semibold text-ink">{model.name}</h3>
              <p className="mt-2 text-sm text-slate">{model.brand?.name ?? "Mapped model"}</p>
            </a>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

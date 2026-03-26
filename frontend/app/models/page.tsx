import type { Metadata } from "next";
import { ModelGrid } from "@/components/catalog/model-grid";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildMetadata } from "@/lib/seo";
import { fetchApiOrFallback } from "@/lib/server-api";
import { MobileModel } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Supported Mobile Models",
  description:
    "Find supported phone models and filter directly into compatible PurjiX parts for faster discovery."
});

export default async function ModelsPage() {
  const models = await fetchApiOrFallback<MobileModel[]>("/models", []);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Models" title="Supported mobile models" description="Filter directly by phone model to reach compatible spare parts faster." />
        <ModelGrid models={models} />
      </div>
    </PageShell>
  );
}

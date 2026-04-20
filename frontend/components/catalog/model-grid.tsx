import Link from "next/link";
import { ModelImage } from "@/components/catalog/model-image";
import { MobileModel } from "@/types";

export function ModelGrid({ models }: { models: MobileModel[] }) {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {models.map((model) => (
        <Link
          key={model.id}
          href={model.brand?.slug ? `/brands/${model.brand.slug}/models/${model.slug}` : `/models/${model.slug}`}
          className="rounded-[28px] bg-white p-6 shadow-card"
        >
          <div className="flex items-center gap-4">
            <div className="relative flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fafc,#eef2f7)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <ModelImage name={model.name} imageUrl={model.imageUrl} alt={model.name} imageClassName="p-1.5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-ink">{model.name}</h3>
              <p className="mt-2 text-sm text-slate">{model.brand?.name ?? "Mapped model"}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

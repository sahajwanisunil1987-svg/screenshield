import Image from "next/image";
import Link from "next/link";
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
            <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
              {model.imageUrl ? (
                <Image src={model.imageUrl} alt={model.name} fill sizes="64px" className="object-cover" />
              ) : (
                <span className="text-lg font-semibold text-ink">{model.name.slice(0, 1)}</span>
              )}
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

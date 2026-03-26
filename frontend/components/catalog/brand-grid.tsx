import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/types";

export function BrandGrid({ brands }: { brands: Brand[] }) {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {brands.map((brand) => (
        <Link key={brand.id} href={`/brands/${brand.slug}`} className="rounded-[28px] bg-white p-6 shadow-card">
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
        </Link>
      ))}
    </div>
  );
}

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { fetchApi } from "@/lib/server-api";
import { Category } from "@/types";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await fetchApi<Category[]>("/categories");

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Categories" title="Mobile spare categories" description="Displays, batteries, charging ports, cameras, speakers, and more." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <a key={category.id} href={`/products?category=${category.slug}`} className="rounded-[28px] bg-white p-6 shadow-card">
              <h3 className="font-semibold text-ink">{category.name}</h3>
              <p className="mt-2 text-sm text-slate">{category.description}</p>
            </a>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

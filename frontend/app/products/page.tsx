import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/products/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { fetchApi } from "@/lib/server-api";
import { ProductListResponse } from "@/types";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams
}: {
  searchParams: { brand?: string; model?: string; category?: string; search?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams.brand) params.set("brand", searchParams.brand);
  if (searchParams.model) params.set("model", searchParams.model);
  if (searchParams.category) params.set("category", searchParams.category);
  if (searchParams.search) params.set("search", searchParams.search);

  const products = await fetchApi<ProductListResponse>(`/products?${params.toString()}`);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Products"
          title="Filtered spare parts catalog"
          description="Query-param driven listing for SSR-friendly catalog results across brand, model, and part type."
        />
        <div className="mt-10">
          {products.items.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState title="No products found" description="Try changing the selected brand, model, or part type filters." />
          )}
        </div>
      </div>
    </PageShell>
  );
}

import Link from "next/link";
import { ProductCardServer } from "@/components/products/product-card-server";
import { EmptyState } from "@/components/ui/empty-state";
import { Product, ProductListResponse } from "@/types";

export function ProductsResults({
  products,
  activeFilters,
  startResult,
  endResult,
  buildFilterRemovalHref,
  buildPageHref
}: {
  products: ProductListResponse;
  activeFilters: Array<{ key: string; label: string }>;
  startResult: number;
  endResult: number;
  buildFilterRemovalHref: (key: string) => string;
  buildPageHref: (page: number) => string;
}) {
  const currentPage = products.pagination.page;
  const totalPages = products.pagination.pages;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
  );

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.length ? (
            activeFilters.map((filter) => (
              <Link
                key={`${filter.key}-${filter.label}`}
                href={buildFilterRemovalHref(filter.key)}
                className="rounded-full bg-accentSoft px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#cfeee6] dark:text-white"
              >
                {filter.label} ×
              </Link>
            ))
          ) : (
            <span className="rounded-full bg-white px-4 py-2 text-sm text-slate shadow-card">All catalog items</span>
          )}
        </div>
        <p className="text-sm text-slate">
          Showing {startResult}-{endResult} of {products.pagination.total} result(s)
        </p>
      </div>
      <div className="mt-10">
        {products.items.length ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.items.map((product: Product) => (
                <ProductCardServer key={product.id} product={product} />
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={buildPageHref(Math.max(currentPage - 1, 1))}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    currentPage === 1
                      ? "pointer-events-none border border-slate-200 text-slate-300"
                      : "border border-slate-200 text-ink hover:bg-accentSoft"
                  }`}
                >
                  Previous
                </Link>
                {pageNumbers.map((page, index) => {
                  const previousPage = pageNumbers[index - 1];
                  const showGap = previousPage && page - previousPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-3">
                      {showGap ? <span className="text-slate">…</span> : null}
                      <Link
                        href={buildPageHref(page)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          page === currentPage
                            ? "bg-accent text-white"
                            : "border border-slate-200 text-ink hover:bg-accentSoft"
                        }`}
                      >
                        {page}
                      </Link>
                    </div>
                  );
                })}
                <Link
                  href={buildPageHref(Math.min(currentPage + 1, totalPages))}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    currentPage === totalPages
                      ? "pointer-events-none border border-slate-200 text-slate-300"
                      : "border border-slate-200 text-ink hover:bg-accentSoft"
                  }`}
                >
                  Next
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState title="No products found" description="Try changing the selected brand, model, or part type filters." />
        )}
      </div>
    </>
  );
}

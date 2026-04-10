import type { MetadataRoute } from "next";
import { fetchApiOrFallback } from "@/lib/server-api";
import type { Brand, Category, MobileModel, ProductListResponse } from "@/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
const SITEMAP_PAGE_SIZE = 200;

const toAbsolute = (path: string) => `${siteUrl}${path}`;

const emptyProductResponse = {
  items: [],
  pagination: {
    page: 1,
    limit: SITEMAP_PAGE_SIZE,
    total: 0,
    pages: 0
  }
};

const getAllProducts = async () => {
  const firstPage = await fetchApiOrFallback<ProductListResponse>(
    `/products?limit=${SITEMAP_PAGE_SIZE}`,
    emptyProductResponse,
    { next: { revalidate: 300 } }
  );

  if (firstPage.pagination.pages <= 1) {
    return firstPage.items;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pagination.pages - 1 }, (_, index) =>
      fetchApiOrFallback<ProductListResponse>(
        `/products?limit=${SITEMAP_PAGE_SIZE}&page=${index + 2}`,
        emptyProductResponse,
        { next: { revalidate: 300 } }
      )
    )
  );

  return [firstPage, ...remainingPages].flatMap((page) => page.items);
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [brands, categories, models, products] = await Promise.all([
    fetchApiOrFallback<Brand[]>("/brands", [], { next: { revalidate: 1800 } }),
    fetchApiOrFallback<Category[]>("/categories", [], { next: { revalidate: 1800 } }),
    fetchApiOrFallback<MobileModel[]>("/models", [], { next: { revalidate: 1800 } }),
    getAllProducts()
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: toAbsolute("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: toAbsolute("/brands"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: toAbsolute("/models"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: toAbsolute("/categories"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: toAbsolute("/products"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: toAbsolute("/support"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: toAbsolute("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: toAbsolute("/privacy-policy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: toAbsolute("/returns"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: toAbsolute("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.3 }
  ];

  const brandRoutes = brands.map((brand) => ({
    url: toAbsolute(`/brands/${brand.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8
  }));

  const modelRoutes = models.map((model) => ({
    url: toAbsolute(`/models/${model.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));

  const brandModelRoutes = models
    .filter((model) => model.brand?.slug)
    .map((model) => ({
      url: toAbsolute(`/brands/${model.brand!.slug}/models/${model.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }));

  const categoryRoutes = categories.map((category) => ({
    url: toAbsolute(`/category/${category.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));

  const productRoutes = products.map((product) => ({
    url: toAbsolute(`/products/${product.slug}`),
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8
  }));

  return [...staticRoutes, ...brandRoutes, ...modelRoutes, ...brandModelRoutes, ...categoryRoutes, ...productRoutes];
}

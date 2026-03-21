import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Smartphone } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { fetchApi } from "@/lib/server-api";
import { buildMetadata } from "@/lib/seo";
import { formatCurrency } from "@/lib/utils";
import { MobileModel, Product, ProductListResponse } from "@/types";

export const revalidate = 300;

type ModelPageParams = {
  slug: string;
  brandSlug?: string;
};

const getModels = cache(() => fetchApi<MobileModel[]>("/models", { next: { revalidate: 1800 } }));
const getProductsForModel = cache((slug: string) =>
  fetchApi<ProductListResponse>(`/products?model=${slug}&limit=40`, { next: { revalidate: 300 } })
);

const categoryDescriptions: Record<string, string> = {
  "lcd-display": "Display combos, touch panels, and screen assemblies for common repair jobs.",
  battery: "Battery replacements picked for backup complaints and workshop turnaround.",
  "charging-port": "Charging flex, connectors, and dock parts for power and data issues.",
  camera: "Front and rear camera modules for damaged or blurry camera replacements.",
  speaker: "Speaker, earpiece, and audio path parts for sound-related repairs.",
  microphone: "Mic and voice-path parts for call and recording issues.",
  "back-panel": "Back glass, housing, and body parts for physical repair coverage."
};

const categoryOrder = [
  "lcd-display",
  "touch-screen",
  "back-panel",
  "battery",
  "charging-port",
  "camera",
  "speaker",
  "microphone"
];

const compactTitleBySlug: Record<string, string> = {
  "lcd-display": "Display & Screens",
  "touch-screen": "Display & Screens",
  "back-panel": "Body & Housings",
  battery: "Battery",
  "charging-port": "Charging & Power",
  camera: "Camera",
  speaker: "Internal Components",
  microphone: "Internal Components"
};

const humanizeIssue = (slug: string) =>
  categoryDescriptions[slug] ?? "Compatible parts grouped for faster model-first discovery.";

const getModelDisplayName = (model: MobileModel) => {
  const brandName = model.brand?.name?.trim();
  const modelName = model.name.trim();

  if (!brandName) {
    return modelName;
  }

  return modelName.toLowerCase().startsWith(brandName.toLowerCase()) ? modelName : `${brandName} ${modelName}`;
};

const inferSpecs = (products: Product[]) => {
  const specs = products.flatMap((product) =>
    Object.entries(product.specifications ?? {}).map(([key, value]) => ({
      key: key.toLowerCase(),
      value
    }))
  );

  const display = specs.find((item) => item.key.includes("display") || item.key.includes("screen") || item.key.includes("size"));
  const release = specs.find((item) => item.key.includes("release") || item.key.includes("launch") || item.key.includes("year"));

  return {
    display: display?.value ?? null,
    release: release?.value ?? null
  };
};

function ModelPartTile({ product }: { product: Product }) {
  const stock = product.inventory?.stock ?? product.stock;
  const primaryImage = product.images[0]?.url ?? "https://placehold.co/480x480";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-accent/20 hover:shadow-card"
    >
      <div className="relative aspect-square overflow-hidden rounded-[18px] bg-slate-100">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-sm font-semibold leading-snug text-ink">{product.name}</p>
        <p className="mt-1 text-xs text-slate">SKU {product.sku}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-ink">{formatCurrency(product.price)}</span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {stock > 0 ? "In stock" : "Out of stock"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export async function generateModelDetailMetadata(params: ModelPageParams): Promise<Metadata> {
  const models = await getModels();
  const model = models.find((entry) => entry.slug === params.slug);

  if (model && params.brandSlug && model.brand?.slug !== params.brandSlug) {
    return buildMetadata({
      title: "Model Not Found",
      description: "The requested SpareKart model page could not be found."
    });
  }

  if (!model) {
    return buildMetadata({
      title: "Model Not Found",
      description: "The requested SpareKart model page could not be found."
    });
  }

  const modelDisplayName = getModelDisplayName(model);

  return buildMetadata({
    title: `${modelDisplayName} Spare Parts`,
    description: `Browse ${modelDisplayName} spare parts by repair category with model-specific compatibility and quick discovery.`
  });
}

export async function ModelDetailPageContent(params: ModelPageParams) {
  const [models, productsResponse] = await Promise.all([
    getModels(),
    getProductsForModel(params.slug)
  ]);

  const model = models.find((entry) => entry.slug === params.slug);

  if (!model || (params.brandSlug && model.brand?.slug !== params.brandSlug)) {
    notFound();
  }

  const products = productsResponse.items;
  const inferredSpecs = inferSpecs(products);
  const heroImage = model.imageUrl ?? products[0]?.images[0]?.url ?? null;
  const modelDisplayName = getModelDisplayName(model);

  const groupedProducts = Object.entries(
    products.reduce<Record<string, Product[]>>((acc, product) => {
      const key = product.category.slug;
      acc[key] ??= [];
      acc[key].push(product);
      return acc;
    }, {})
  )
    .sort(([leftSlug, leftProducts], [rightSlug, rightProducts]) => {
      const leftOrder = categoryOrder.indexOf(leftSlug);
      const rightOrder = categoryOrder.indexOf(rightSlug);

      if (leftOrder !== -1 || rightOrder !== -1) {
        return (leftOrder === -1 ? Number.MAX_SAFE_INTEGER : leftOrder) - (rightOrder === -1 ? Number.MAX_SAFE_INTEGER : rightOrder);
      }

      return rightProducts.length - leftProducts.length;
    })
    .reduce<Array<{ title: string; slug: string; products: Product[]; description: string }>>((acc, [slug, categoryProducts]) => {
      const title = compactTitleBySlug[slug] ?? categoryProducts[0]?.category.name ?? "Spare Parts";
      const existing = acc.find((item) => item.title === title);

      if (existing) {
        existing.products.push(...categoryProducts);
        return acc;
      }

      acc.push({
        title,
        slug,
        products: [...categoryProducts],
        description: humanizeIssue(slug)
      });
      return acc;
    }, []);

  return (
    <PageShell>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate">
            <Link href="/" className="transition hover:text-ink">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/brands" className="transition hover:text-ink">Brands</Link>
            {model.brand ? (
              <>
                <ChevronRight className="h-4 w-4" />
                <Link href={`/brands/${model.brand.slug}`} className="transition hover:text-ink">{model.brand.name}</Link>
              </>
            ) : null}
            <ChevronRight className="h-4 w-4" />
            <Link href="/models" className="transition hover:text-ink">Models</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/brands/${model.brand?.slug ?? ""}/models/${model.slug}`} className="transition hover:text-ink">{modelDisplayName}</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-ink">{modelDisplayName} Spare Parts & Accessories</span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
            <div className="flex justify-center lg:justify-start">
              <div className="relative aspect-[4/5] w-[180px] overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950/5 shadow-sm">
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={`${model.name} reference`}
                    fill
                    className="object-contain p-1"
                    sizes="180px"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate">
                    <Smartphone className="h-12 w-12" />
                    <span className="text-sm font-medium">{modelDisplayName}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Model spare parts</p>
              <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
                {modelDisplayName} Spare Parts
              </h1>
              <div className="mt-5 grid gap-3 text-sm text-slate sm:grid-cols-2 lg:max-w-2xl">
                <div className="rounded-2xl bg-panel px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">Release</p>
                  <p className="mt-1 font-medium text-ink">{inferredSpecs.release ?? "Model-specific catalog"}</p>
                </div>
                <div className="rounded-2xl bg-panel px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">Display size</p>
                  <p className="mt-1 font-medium text-ink">{inferredSpecs.display ?? "Verified fitment range"}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-ink">{products.length} listed parts</span>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-ink">{groupedProducts.length} repair groups</span>
                <Link href={`/products?model=${model.slug}`} className="rounded-full bg-accent px-5 py-2.5 font-semibold text-white transition hover:bg-teal-700">
                  Open filtered catalog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {products.length ? (
          <div className="space-y-12">
            {groupedProducts.map((group) => (
              <section key={group.title}>
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Repair category</p>
                  <h2 className="mt-2 text-3xl font-semibold text-ink">{group.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm text-slate">{group.description}</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {group.products.map((product) => (
                    <ModelPartTile key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-card">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">No mapped parts yet</p>
            <h2 className="mt-3 font-display text-3xl text-ink">We are still building this model catalog.</h2>
            <p className="mt-4 text-sm text-slate">
              Try the broader product discovery flow or contact support if you need a specific part for {modelDisplayName}.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/products" className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700">
                Browse all spare parts
              </Link>
              <Link href="/support" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent/20 hover:bg-accentSoft">
                Ask for a part
              </Link>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

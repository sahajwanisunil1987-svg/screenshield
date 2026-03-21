import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Smartphone, Sparkles, Wrench } from "lucide-react";
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
  const savings = product.comparePrice && product.comparePrice > product.price ? product.comparePrice - product.price : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-accent/20 hover:shadow-card"
    >
      <div className="relative aspect-[1/1] overflow-hidden bg-[linear-gradient(180deg,#f8fbfc,#eef4f7)]">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
              stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {stock > 0 ? "Ready" : "Sold out"}
          </span>
          {savings > 0 ? (
            <span className="rounded-full bg-[#ffe8d6] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b45309]">
              Save {formatCurrency(savings)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{product.category.name}</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink">{product.name}</p>
        <p className="mt-1 text-xs text-slate">SKU {product.sku}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-ink">{formatCurrency(product.price)}</p>
            {product.comparePrice ? <p className="text-xs text-slate line-through">{formatCurrency(product.comparePrice)}</p> : null}
          </div>
          <span className="rounded-full bg-panel px-3 py-1.5 text-[11px] font-semibold text-slate">
            {stock > 0 ? "In stock" : "Unavailable"}
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
  const [models, productsResponse] = await Promise.all([getModels(), getProductsForModel(params.slug)]);

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

  const heroStats = [
    { label: "Listed parts", value: String(products.length) },
    { label: "Repair groups", value: String(groupedProducts.length) },
    { label: "Display size", value: inferredSpecs.display ?? "Verified fitment" },
    { label: "Release", value: inferredSpecs.release ?? "Model-specific catalog" }
  ];

  return (
    <PageShell>
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f3f8fb)]">
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

          <div className="mt-8 grid gap-8 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start">
            <div className="flex justify-center xl:justify-start">
              <div className="relative aspect-[4/5] w-[210px] overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,#f8fbfc,#e9f1f5)] shadow-card">
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={`${model.name} reference`}
                    fill
                    className="object-contain p-3"
                    sizes="210px"
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accentSoft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                  Model parts page
                </span>
                {model.brand ? (
                  <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate shadow-sm">
                    {model.brand.name}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 font-display text-4xl leading-[0.95] text-ink sm:text-5xl xl:max-w-4xl">
                {modelDisplayName} Spare Parts & Accessories
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate sm:text-base">
                Shop compatible replacement parts for {modelDisplayName} by repair need. Jump straight into display, battery, charging, body, and camera categories with faster model-first discovery.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {heroStats.map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/products?model=${model.slug}`} className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700">
                  Open filtered catalog
                </Link>
                <Link href="#repair-groups" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent/20 hover:bg-accentSoft">
                  Browse repair groups
                </Link>
              </div>

              {groupedProducts.length ? (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {groupedProducts.map((group) => (
                    <a
                      key={group.title}
                      href={`#group-${group.slug}`}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent/20 hover:bg-accentSoft"
                    >
                      {group.title}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section id="repair-groups" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {products.length ? (
          <div className="space-y-12">
            {groupedProducts.map((group, index) => (
              <section
                key={group.title}
                id={`group-${group.slug}`}
                className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-card sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accentSoft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                        Repair category {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="rounded-full bg-panel px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
                        {group.products.length} items
                      </span>
                    </div>
                    <h2 className="mt-3 text-3xl font-semibold text-ink">{group.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate">{group.description}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
                    <div className="rounded-[22px] bg-panel p-4 text-sm text-slate">
                      <div className="flex items-start gap-3">
                        <Wrench className="mt-0.5 h-4.5 w-4.5 text-accent" />
                        <div>
                          <p className="font-semibold text-ink">Repair-first sorting</p>
                          <p className="mt-1 leading-6">Grouped so shoppers and repair shops can jump to the right part type faster.</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[22px] bg-panel p-4 text-sm text-slate">
                      <div className="flex items-start gap-3">
                        <Sparkles className="mt-0.5 h-4.5 w-4.5 text-accent" />
                        <div>
                          <p className="font-semibold text-ink">Model-specific picks</p>
                          <p className="mt-1 leading-6">Every card in this section stays tied to {modelDisplayName} compatibility.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-[32px] bg-[linear-gradient(135deg,#07111f,#0f2731)] p-6 text-white shadow-card sm:grid-cols-3 sm:p-7">
          <div className="rounded-[24px] bg-white/8 p-4">
            <ShieldCheck className="h-5 w-5 text-teal-200" />
            <p className="mt-3 text-sm font-semibold">Compatibility-first cataloging</p>
            <p className="mt-2 text-sm leading-6 text-white/70">Model-first browsing reduces mismatch risk before checkout.</p>
          </div>
          <div className="rounded-[24px] bg-white/8 p-4">
            <Wrench className="h-5 w-5 text-teal-200" />
            <p className="mt-3 text-sm font-semibold">Repair-shop friendly</p>
            <p className="mt-2 text-sm leading-6 text-white/70">Common repair categories stay grouped for faster quoting and sourcing.</p>
          </div>
          <div className="rounded-[24px] bg-white/8 p-4">
            <Sparkles className="h-5 w-5 text-teal-200" />
            <p className="mt-3 text-sm font-semibold">Cleaner discovery flow</p>
            <p className="mt-2 text-sm leading-6 text-white/70">Jump from model landing to exact part pages without scanning the full catalog.</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

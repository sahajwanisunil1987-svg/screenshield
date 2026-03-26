import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/products/product-detail-view";
import { buildMetadata } from "@/lib/seo";
import { fetchApi } from "@/lib/server-api";
import { Product, Review } from "@/types";

export const revalidate = 300;

type ProductPayload = {
  product: Product & { reviews: Review[] };
  relatedProducts: Product[];
};

const getProductPayload = cache((slug: string) =>
  fetchApi<ProductPayload>(`/products/${slug}`, { next: { revalidate: 300 } })
);

type ProductDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getProductPayload(slug);
  const product = payload.product;

  if (!product) {
    return buildMetadata({
      title: "Product Not Found",
      description: "The requested PurjiX product could not be found."
    });
  }

  return {
    ...buildMetadata({
      title: `${product.name} for ${product.model.name}`,
      description:
        product.shortDescription ||
        `Buy ${product.name} for ${product.model.name} from PurjiX with warranty-backed mobile spare parts and fast dispatch.`
    }),
    openGraph: {
      title: `${product.name} for ${product.model.name} | PurjiX`,
      description:
        product.shortDescription ||
        `Buy ${product.name} for ${product.model.name} from PurjiX with warranty-backed mobile spare parts and fast dispatch.`,
      siteName: "PurjiX",
      type: "website",
      images: product.images[0]?.url ? [{ url: product.images[0].url, alt: product.name }] : undefined
    },
    twitter: {
      card: product.images[0]?.url ? "summary_large_image" : "summary",
      title: `${product.name} for ${product.model.name} | PurjiX`,
      description:
        product.shortDescription ||
        `Buy ${product.name} for ${product.model.name} from PurjiX with warranty-backed mobile spare parts and fast dispatch.`,
      images: product.images[0]?.url ? [product.images[0].url] : undefined
    }
  };
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { slug } = await params;
  const payload = await getProductPayload(slug);

  if (!payload.product) {
    notFound();
  }
  return <ProductDetailView payload={payload} />;
}

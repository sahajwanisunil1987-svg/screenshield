import type { Metadata } from "next";
import { Product } from "@/types";

export const siteName = "PurjiX";
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
export const defaultOgImage = `${siteUrl}/icon-512.png`;
export const isProductionSite = !siteUrl.includes("localhost");

export const buildMetadata = ({
  title,
  description,
  path
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata => ({
  title: `${title} | ${siteName}`,
  description,
  alternates: path ? { canonical: `${siteUrl}${path}` } : undefined,
  openGraph: {
    title: `${title} | ${siteName}`,
    description,
    siteName,
    type: "website",
    url: path ? `${siteUrl}${path}` : siteUrl,
    images: [
      {
        url: defaultOgImage,
        width: 512,
        height: 512,
        alt: `${siteName} mobile spare parts store`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${siteName}`,
    description,
    images: [defaultOgImage]
  }
});

export const buildOrganizationStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: defaultOgImage
});

export const buildWebsiteStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/products?search={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
});

export const buildProductStructuredData = (product: Product) => {
  const availability = (product.inventory?.stock ?? product.stock) > 0
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description,
    sku: product.sku,
    image: product.images.map((image) => image.url),
    brand: {
      "@type": "Brand",
      name: product.brand.name
    },
    category: product.category.name,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Compatible Model",
        value: product.model.name
      },
      {
        "@type": "PropertyValue",
        name: "Warranty",
        value: `${product.warrantyMonths} months`
      }
    ],
    aggregateRating: product.reviewCount
      ? {
          "@type": "AggregateRating",
          ratingValue: product.averageRating.toFixed(1),
          reviewCount: product.reviewCount
        }
      : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: String(product.price),
      availability,
      url: `${siteUrl}/products/${product.slug}`,
      itemCondition: "https://schema.org/NewCondition"
    }
  };
};

export const buildBreadcrumbStructuredData = (product: Product) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${siteUrl}/`
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Products",
      item: `${siteUrl}/products`
    },
    {
      "@type": "ListItem",
      position: 3,
      name: product.brand.name,
      item: `${siteUrl}/products?brand=${product.brand.slug}`
    },
    {
      "@type": "ListItem",
      position: 4,
      name: product.model.name,
      item: `${siteUrl}/products?model=${product.model.slug}`
    },
    {
      "@type": "ListItem",
      position: 5,
      name: product.name,
      item: `${siteUrl}/products/${product.slug}`
    }
  ]
});

import type { Metadata } from "next";
import { ModelDetailPageContent, generateModelDetailMetadata } from "../../../../models/model-detail-page";

type BrandModelPageProps = {
  params: { slug: string; modelSlug: string };
};

export const revalidate = 300;

export async function generateMetadata({ params }: BrandModelPageProps): Promise<Metadata> {
  return generateModelDetailMetadata({ slug: params.modelSlug, brandSlug: params.slug });
}

export default async function BrandModelDetailPage({ params }: BrandModelPageProps) {
  return ModelDetailPageContent({ slug: params.modelSlug, brandSlug: params.slug });
}

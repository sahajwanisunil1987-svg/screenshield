import type { Metadata } from "next";
import { ModelDetailPageContent, generateModelDetailMetadata } from "../../../../models/model-detail-page";

type BrandModelPageProps = {
  params: Promise<{ slug: string; modelSlug: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: BrandModelPageProps): Promise<Metadata> {
  const { slug, modelSlug } = await params;
  return generateModelDetailMetadata({ slug: modelSlug, brandSlug: slug });
}

export default async function BrandModelDetailPage({ params }: BrandModelPageProps) {
  const { slug, modelSlug } = await params;
  return ModelDetailPageContent({ slug: modelSlug, brandSlug: slug });
}

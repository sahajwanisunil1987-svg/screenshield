import type { Metadata } from "next";
import { ModelDetailPageContent, generateModelDetailMetadata } from "../model-detail-page";

type ModelPageProps = {
  params: { slug: string };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  return generateModelDetailMetadata({ slug: params.slug });
}

export default async function ModelDetailPage({ params }: ModelPageProps) {
  return ModelDetailPageContent({ slug: params.slug });
}

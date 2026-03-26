import type { Metadata } from "next";
import { ModelDetailPageContent, generateModelDetailMetadata } from "../model-detail-page";

type ModelPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateModelDetailMetadata({ slug });
}

export default async function ModelDetailPage({ params }: ModelPageProps) {
  const { slug } = await params;
  return ModelDetailPageContent({ slug });
}

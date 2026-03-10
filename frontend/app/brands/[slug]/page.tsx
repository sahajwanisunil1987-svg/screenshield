import { redirect } from "next/navigation";

type BrandPageProps = {
  params: { slug: string };
};

export default function BrandPage({ params }: BrandPageProps) {
  redirect(`/products?brand=${params.slug}`);
}

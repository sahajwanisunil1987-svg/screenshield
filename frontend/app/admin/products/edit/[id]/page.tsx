import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";

type AdminEditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditProductPage({ params }: AdminEditProductPageProps) {
  const { id } = await params;

  return (
    <AdminGuard>
      <AdminShell title="Edit Product">
        <ProductForm productId={id} />
      </AdminShell>
    </AdminGuard>
  );
}

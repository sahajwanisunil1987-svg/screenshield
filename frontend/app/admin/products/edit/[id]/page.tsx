import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";

export default function AdminEditProductPage({ params }: { params: { id: string } }) {
  return (
    <AdminGuard>
      <AdminShell title="Edit Product">
        <ProductForm productId={params.id} />
      </AdminShell>
    </AdminGuard>
  );
}

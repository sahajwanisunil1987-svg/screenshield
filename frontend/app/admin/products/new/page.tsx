import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";

export default function AdminNewProductPage() {
  return (
    <AdminGuard>
      <AdminShell title="Create Product">
        <ProductForm />
      </AdminShell>
    </AdminGuard>
  );
}

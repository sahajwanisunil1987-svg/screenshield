import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { ResourceManager } from "@/components/admin/resource-manager";

export default function AdminCategoriesPage() {
  return (
    <AdminGuard>
      <AdminShell title="Categories">
        <ResourceManager
          title="Categories"
          getUrl="/categories"
          createUrl="/admin/categories"
          deleteBaseUrl="/admin/categories"
          fields={[
            { key: "name", placeholder: "Category name" },
            { key: "description", placeholder: "Description" }
          ]}
        />
      </AdminShell>
    </AdminGuard>
  );
}

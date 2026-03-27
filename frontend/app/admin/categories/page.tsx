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
          updateBaseUrl="/admin/categories"
          deleteBaseUrl="/admin/categories"
          fields={[
            { key: "name", placeholder: "Category name" },
            { key: "description", placeholder: "Description" },
            { key: "usesVariants", placeholder: "This category uses variants", type: "checkbox" },
            { key: "variantLabel", placeholder: "Variant label (e.g. Color)" }
          ]}
          subtitlePath="description"
        />
      </AdminShell>
    </AdminGuard>
  );
}

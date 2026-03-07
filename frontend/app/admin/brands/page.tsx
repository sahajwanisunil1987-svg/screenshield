import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { ResourceManager } from "@/components/admin/resource-manager";

export default function AdminBrandsPage() {
  return (
    <AdminGuard>
      <AdminShell title="Brands">
        <ResourceManager
          title="Brands"
          getUrl="/brands"
          createUrl="/admin/brands"
          updateBaseUrl="/admin/brands"
          deleteBaseUrl="/admin/brands"
          fields={[
            { key: "name", placeholder: "Brand name" },
            { key: "description", placeholder: "Description" }
          ]}
          subtitlePath="description"
        />
      </AdminShell>
    </AdminGuard>
  );
}

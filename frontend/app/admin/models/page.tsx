"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { ResourceManager } from "@/components/admin/resource-manager";
import { api, getApiErrorMessage } from "@/lib/api";
import { Brand } from "@/types";

export default function AdminModelsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    api
      .get("/brands")
      .then((response) => setBrands(response.data))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load brands"));
      });
  }, []);

  return (
    <AdminGuard>
      <AdminShell title="Models">
        <ResourceManager
          title="Models"
          getUrl="/models"
          createUrl="/admin/models"
          updateBaseUrl="/admin/models"
          deleteBaseUrl="/admin/models"
          fields={[
            { key: "name", placeholder: "Model name" },
            {
              key: "brandId",
              placeholder: "Select brand",
              type: "select",
              options: brands.map((brand) => ({ label: brand.name, value: brand.id }))
            }
          ]}
          subtitlePath="brand.name"
          subtitlePrefix="Mapped to "
        />
      </AdminShell>
    </AdminGuard>
  );
}

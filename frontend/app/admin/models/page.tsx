"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { ResourceManager } from "@/components/admin/resource-manager";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Brand } from "@/types";

export default function AdminModelsPage() {
  const token = useAuthStore((state) => state.token);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    if (!token) return;

    api
      .get("/brands", authHeaders(token))
      .then((response) => setBrands(response.data))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load brands"));
      });
  }, [token]);

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
            { key: "imageUrl", placeholder: "Model image URL" },
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

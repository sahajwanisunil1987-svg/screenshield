import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSponsorsPage } from "@/components/admin/admin-sponsors-page";

export default function AdminSponsorsRoute() {
  return (
    <AdminGuard>
      <AdminShell title="Sponsors">
        <AdminSponsorsPage />
      </AdminShell>
    </AdminGuard>
  );
}

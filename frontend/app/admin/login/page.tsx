import { AdminLoginForm } from "@/components/admin/admin-login-form";

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string; email?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const resolvedSearchParams = await searchParams;
  return <AdminLoginForm nextPath={resolvedSearchParams.next} initialEmail={resolvedSearchParams.email || ""} />;
}

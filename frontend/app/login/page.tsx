import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; email?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  return <LoginForm nextPath={resolvedSearchParams.next || "/"} initialEmail={resolvedSearchParams.email || ""} />;
}

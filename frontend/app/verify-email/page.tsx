import { VerifyEmailStatus } from "@/components/auth/verify-email-status";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const resolvedSearchParams = await searchParams;
  return <VerifyEmailStatus token={resolvedSearchParams.token || ""} />;
}

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

const schema = z.object({ password: z.string().min(8) });
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Reset Password</h1>
          <form
            onSubmit={handleSubmit(async (values) => {
              try {
                await api.post("/auth/reset-password", { token, password: values.password });
                toast.success("Password reset successful. Login with your new password.");
                router.push("/login");
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Unable to reset password"));
              }
            })}
            className="mt-8 space-y-4"
          >
            <Input type="password" placeholder="New password" autoComplete="new-password" {...register("password")} />
            {errors.password ? <p className="text-sm text-red-500">{errors.password.message}</p> : null}
            <Button disabled={isSubmitting || !token} className="w-full">{isSubmitting ? "Resetting..." : "Reset password"}</Button>
          </form>
          <p className="mt-6 text-sm text-slate">Back to <Link href="/login" className="font-semibold text-accent">Login</Link></p>
        </div>
      </div>
    </PageShell>
  );
}

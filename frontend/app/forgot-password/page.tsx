"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

const schema = z.object({ email: z.string().email() });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Forgot Password</h1>
          <form
            onSubmit={handleSubmit(async (values) => {
              try {
                await api.post("/auth/forgot-password", values);
                toast.success("If that email exists, a reset link has been sent.");
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Unable to request password reset"));
              }
            })}
            className="mt-8 space-y-4"
          >
            <Input placeholder="Email" autoComplete="email" {...register("email")} />
            {errors.email ? <p className="text-sm text-red-500">{errors.email.message}</p> : null}
            <Button disabled={isSubmitting} className="w-full">{isSubmitting ? "Sending..." : "Send reset link"}</Button>
          </form>
          <p className="mt-6 text-sm text-slate">Remembered it? <Link href="/login" className="font-semibold text-accent">Login</Link></p>
        </div>
      </div>
    </PageShell>
  );
}

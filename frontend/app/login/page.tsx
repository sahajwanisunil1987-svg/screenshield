"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const setAuth = useAuthStore((state) => state.setAuth);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const emailValue = watch("email");
    if (emailValue) {
      setResendEmail(emailValue);
    }
  }, [watch]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await api.post("/auth/login", values);
      setAuth(response.data.token, response.data.user);
      toast.success("Logged in");
      router.push(response.data.user.role === "ADMIN" ? "/admin/dashboard" : next);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to sign in"));
    }
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Login</h1>
          {!mounted ? (
            <div className="mt-8 space-y-4">
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-full bg-slate-100" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <Input placeholder="Email" autoComplete="email" {...register("email")} />
              {errors.email ? <p className="text-sm text-red-500">{errors.email.message}</p> : null}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="pr-20"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-accent"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password ? <p className="text-sm text-red-500">{errors.password.message}</p> : null}
              </div>
              <Button disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Signing in..." : "Login"}
              </Button>
            </form>
          )}
          <div className="mt-6 flex items-center justify-between gap-4 text-sm text-slate">
            <p>New customer? <Link href="/register" className="font-semibold text-accent">Create an account</Link></p>
            <Link href="/forgot-password" className="font-semibold text-accent">Forgot password?</Link>
          </div>
          <div className="mt-4 rounded-2xl bg-[#f5f8fb] p-4 text-sm text-slate">
            <p className="font-semibold text-ink">Need a new verification email?</p>
            <p className="mt-1">Enter your email above, then resend the verification link.</p>
            <button
              type="button"
              disabled={!resendEmail || resending}
              onClick={async () => {
                setResending(true);
                try {
                  await api.post("/auth/resend-verification", { email: resendEmail });
                  toast.success("If the account exists, a verification email has been sent.");
                } catch (error) {
                  toast.error(getApiErrorMessage(error, "Unable to resend verification email"));
                } finally {
                  setResending(false);
                }
              }}
              className="mt-3 font-semibold text-accent underline disabled:cursor-not-allowed disabled:text-slate"
            >
              {resending ? "Sending..." : "Resend verification email"}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

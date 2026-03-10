"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(10, "Enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password")
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const onSubmit = handleSubmit(async ({ confirmPassword: _confirmPassword, ...values }) => {
    try {
      await api.post("/auth/register", values);
      toast.success("Account created. Please verify your email from Gmail before logging in.");
      router.push("/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create account"));
    }
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Register</h1>
          <p className="mt-4 text-sm text-slate">A verification link will be sent to your Gmail before first login.</p>
          {!mounted ? (
            <div className="mt-8 space-y-4">
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-full bg-slate-100" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <Input placeholder="Full name" autoComplete="name" {...register("name")} />
              {errors.name ? <p className="text-sm text-red-500">{errors.name.message}</p> : null}

              <Input placeholder="Email" autoComplete="email" {...register("email")} />
              {errors.email ? <p className="text-sm text-red-500">{errors.email.message}</p> : null}

              <Input placeholder="Phone" autoComplete="tel" {...register("phone")} />
              {errors.phone ? <p className="text-sm text-red-500">{errors.phone.message}</p> : null}

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    autoComplete="new-password"
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

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    className="pr-20"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-accent"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.confirmPassword ? <p className="text-sm text-red-500">{errors.confirmPassword.message}</p> : null}
              </div>

              <Button disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Creating..." : "Create account"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-sm text-slate">
            Already registered? <Link href="/login" className="font-semibold text-accent">Login</Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}

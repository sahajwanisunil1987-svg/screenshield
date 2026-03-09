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
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(8)
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [mounted, setMounted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await api.post("/auth/register", values);
      setAuth(response.data.token, response.data.user);
      toast.success("Account created. Verify your email from your inbox before next login.");
      router.push("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create account"));
    }
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Register</h1>
          {!mounted ? (
            <div className="mt-8 space-y-4">
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-full bg-slate-100" />
            </div>
          ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input placeholder="Full name" autoComplete="name" {...register("name")} />
            <Input placeholder="Email" autoComplete="email" {...register("email")} />
            <Input placeholder="Phone" autoComplete="tel" {...register("phone")} />
            <Input type="password" placeholder="Password" autoComplete="new-password" {...register("password")} />
            {Object.values(errors)[0] ? (
              <p className="text-sm text-red-500">{Object.values(errors)[0]?.message as string}</p>
            ) : null}
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

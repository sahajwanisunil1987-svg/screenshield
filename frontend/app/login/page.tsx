"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const setAuth = useAuthStore((state) => state.setAuth);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await api.post("/auth/login", values);
      setAuth(response.data.token, response.data.user);
      toast.success("Logged in");
      router.push(response.data.user.role === "ADMIN" ? "/admin/dashboard" : "/");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to sign in"));
    }
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Login</h1>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input placeholder="Email" autoComplete="email" {...register("email")} />
            {errors.email ? <p className="text-sm text-red-500">{errors.email.message}</p> : null}
            <Input placeholder="Password" type="password" autoComplete="current-password" {...register("password")} />
            {errors.password ? <p className="text-sm text-red-500">{errors.password.message}</p> : null}
            <Button disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-slate">
            New customer? <Link href="/register" className="font-semibold text-accent">Create an account</Link>
          </p>
          <div className="mt-6 rounded-2xl bg-[#f5f8fb] p-4 text-sm text-slate">
            <p className="font-semibold text-ink">Demo customer</p>
            <p>user@sparekart.in / User@1234</p>
            <button
              type="button"
              onClick={() => {
                setValue("email", "user@sparekart.in");
                setValue("password", "User@1234");
              }}
              className="mt-3 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-ink"
            >
              Use Demo Credentials
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

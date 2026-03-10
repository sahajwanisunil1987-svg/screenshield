"use client";

import { Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminTheme } from "@/hooks/use-admin-theme";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { theme, isDark, toggleTheme } = useAdminTheme();
  const { register, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema)
  });

  return (
    <div
      data-admin-theme={theme}
      className={`flex min-h-screen items-center justify-center px-4 transition-colors duration-300 ${
        isDark
          ? "bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_18%),linear-gradient(180deg,#020617,#08111f)]"
          : "bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_18%),linear-gradient(180deg,#f9fbfd,#edf3f8)]"
      }`}
    >
      <div className="absolute inset-x-0 top-0 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.26em] ${isDark ? "text-cyan-200/80" : "text-accent/80"}`}>
            SpareKart Admin
          </p>
          <p className={`mt-2 text-sm ${isDark ? "text-white/55" : "text-slate"}`}>
            Control access for catalog, orders, stock, and pricing.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            isDark
              ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
              : "border-slate-200 bg-white text-ink shadow-[0_18px_35px_rgba(8,17,31,0.08)] hover:bg-slate-50"
          }`}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? "Light mode" : "Dark mode"}
        </button>
      </div>
      <form
        onSubmit={handleSubmit(async (values) => {
          try {
            const response = await api.post("/auth/login", values);
            setAuth(response.data.token, response.data.user);
            router.push("/admin/dashboard");
          } catch (error) {
            toast.error(getApiErrorMessage(error, "Unable to sign in"));
          }
        })}
        className={`w-full max-w-md rounded-[32px] border p-8 transition-colors duration-300 ${
          isDark
            ? "border-white/10 bg-white/5 text-white shadow-[0_28px_70px_rgba(2,6,23,0.42)]"
            : "border-white/70 bg-white/90 text-ink shadow-[0_28px_70px_rgba(8,17,31,0.12)] backdrop-blur"
        }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? "text-cyan-200/70" : "text-accent/70"}`}>
                Secure access
            </p>
            <h1 className="mt-3 font-display text-4xl">Admin login</h1>
            <p className={`mt-3 text-sm ${isDark ? "text-white/60" : "text-slate"}`}>
              Sign in to manage inventory, pricing, orders, coupons, and customer activity.
            </p>
            </div>
          </div>
        <div className="mt-8 space-y-4">
          <Input
            placeholder="Admin email"
            autoComplete="email"
            className={
              isDark
                ? "border-white/10 bg-white/10 text-white placeholder:text-white/35 focus:border-cyan-300 focus:ring-cyan-300/10"
                : "border-slate-200 bg-slate-50 text-ink placeholder:text-slate focus:border-accent focus:ring-accent/10"
            }
            {...register("email")}
          />
          <Input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            className={
              isDark
                ? "border-white/10 bg-white/10 text-white placeholder:text-white/35 focus:border-cyan-300 focus:ring-cyan-300/10"
                : "border-slate-200 bg-slate-50 text-ink placeholder:text-slate focus:border-accent focus:ring-accent/10"
            }
            {...register("password")}
          />
          <Button
            className={`w-full ${
              isDark
                ? "bg-accent text-white shadow-[0_18px_40px_rgba(15,118,110,0.26)] hover:bg-teal-700"
                : "bg-ink text-white shadow-[0_18px_40px_rgba(8,17,31,0.18)] hover:bg-slate-900"
            }`}
          >
            Sign in
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { KeyboardEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminTheme } from "@/hooks/use-admin-theme";
import { api, getApiErrorMessage } from "@/lib/api";
import { EMAIL_REGEX, sanitizeNextPath } from "@/lib/auth-redirect";
import { useAuthStore } from "@/store/auth-store";

export function AdminLoginForm({ nextPath = "/admin/dashboard", initialEmail = "" }: { nextPath?: string; initialEmail?: string }) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const { theme, isDark, toggleTheme } = useAdminTheme();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);

  const validate = () => {
    const nextErrors: { email?: string; password?: string } = {};

    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Enter a valid admin email";
    }

    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
        expectedRole: "ADMIN"
      });

      setShowResendVerification(false);
      setAuth(response.data.token, response.data.user);
      toast.success("Admin access granted");
      router.push(sanitizeNextPath(nextPath, { fallback: "/admin/dashboard", adminOnly: true }));
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to sign in");
      setShowResendVerification(message === "Please verify your email before logging in");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    const form = event.currentTarget.form;
    form?.requestSubmit();
  };

  useEffect(() => {
    if (!hasHydrated || !user) {
      return;
    }

    router.replace(
      user.role === "ADMIN"
        ? sanitizeNextPath(nextPath, { fallback: "/admin/dashboard", adminOnly: true })
        : "/"
    );
  }, [hasHydrated, nextPath, router, user]);

  if (hasHydrated && user) {
    return null;
  }

  return (
    <div
      data-admin-theme={theme}
      className={`admin-theme flex min-h-screen items-center justify-center px-4 transition-colors duration-300 ${
        isDark
          ? "bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_18%),linear-gradient(180deg,#020617,#08111f)]"
          : "bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_18%),linear-gradient(180deg,#f9fbfd,#edf3f8)]"
      }`}
    >
      <div className="absolute inset-x-0 top-0 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.26em] ${isDark ? "text-cyan-200/80" : "text-accent/80"}`}>
            PurjiX Admin
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
        onSubmit={handleSubmit}
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
          <div>
            <Input
              type="email"
              placeholder="Admin email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (showResendVerification) {
                  setShowResendVerification(false);
                }
                if (errors.email) {
                  setErrors((current) => ({ ...current, email: undefined }));
                }
              }}
              className={
                isDark
                  ? "border-white/10 bg-white/10 text-white placeholder:text-white/35 focus:border-cyan-300 focus:ring-cyan-300/10"
                  : "border-slate-200 bg-slate-50 text-ink placeholder:text-slate focus:border-accent focus:ring-accent/10"
              }
            />
            {errors.email ? <p className="mt-2 text-sm text-rose-400">{errors.email}</p> : null}
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password) {
                  setErrors((current) => ({ ...current, password: undefined }));
                }
              }}
              onKeyDown={onPasswordKeyDown}
              className={
                isDark
                  ? "border-white/10 bg-white/10 pr-20 text-white placeholder:text-white/35 focus:border-cyan-300 focus:ring-cyan-300/10"
                  : "border-slate-200 bg-slate-50 pr-20 text-ink placeholder:text-slate focus:border-accent focus:ring-accent/10"
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold ${
                isDark ? "text-cyan-200" : "text-accent"
              }`}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            {errors.password ? <p className="mt-2 text-sm text-rose-400">{errors.password}</p> : null}
          </div>
          <Button
            disabled={isSubmitting}
            className={`w-full ${
              isDark
                ? "bg-accent text-white shadow-[0_18px_40px_rgba(15,118,110,0.26)] hover:bg-teal-700"
                : "bg-ink text-white shadow-[0_18px_40px_rgba(8,17,31,0.18)] hover:bg-slate-900"
            }`}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
          <div className={`flex items-center justify-end text-sm ${isDark ? "text-white/60" : "text-slate"}`}>
            <Link
              href={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
              className={`font-semibold ${isDark ? "text-cyan-200" : "text-accent"}`}
            >
              Forgot password?
            </Link>
          </div>
        </div>
        {showResendVerification ? (
          <div
            className={`mt-6 rounded-3xl border p-4 text-sm ${
              isDark
                ? "border-white/10 bg-white/10 text-white/70"
                : "border-slate-200 bg-slate-50 text-slate"
            }`}
          >
            <p className={`font-semibold ${isDark ? "text-white" : "text-ink"}`}>Need a new verification email?</p>
            <p className="mt-1">This admin account is not verified yet. Resend the verification link for this email.</p>
            <button
              type="button"
              disabled={!email.trim() || resending}
              onClick={async () => {
                setResending(true);
                try {
                  await api.post("/auth/resend-verification", { email: email.trim() });
                  toast.success("If the account exists, a verification email has been sent.");
                } catch (error) {
                  toast.error(getApiErrorMessage(error, "Unable to resend verification email"));
                } finally {
                  setResending(false);
                }
              }}
              className={`mt-3 font-semibold underline disabled:cursor-not-allowed disabled:opacity-60 ${
                isDark ? "text-cyan-200" : "text-accent"
              }`}
            >
              {resending ? "Sending..." : "Resend verification email"}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}

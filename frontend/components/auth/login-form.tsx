"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";
import { EMAIL_REGEX, sanitizeNextPath } from "@/lib/auth-redirect";
import { useAuthStore } from "@/store/auth-store";

export function LoginForm({ nextPath = "/", initialEmail = "" }: { nextPath?: string; initialEmail?: string }) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [resending, setResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const nextErrors: { email?: string; password?: string } = {};

    if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Enter a valid email";
    }

    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitLogin = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/login", { email: email.trim(), password });
      setAuth(response.data.token, response.data.user);
      toast.success("Logged in");
      router.push(
        response.data.user.role === "ADMIN"
          ? sanitizeNextPath(nextPath, { fallback: "/admin/dashboard", adminOnly: true })
          : sanitizeNextPath(nextPath, { fallback: "/" })
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to sign in"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitLogin();
  };

  const onPasswordKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    void submitLogin();
  };

  useEffect(() => {
    if (!hasHydrated || !user) {
      return;
    }

    router.replace(
      user.role === "ADMIN"
        ? sanitizeNextPath(nextPath, { fallback: "/admin/dashboard", adminOnly: true })
        : sanitizeNextPath(nextPath, { fallback: "/" })
    );
  }, [hasHydrated, nextPath, router, user]);

  if (hasHydrated && user) {
    return null;
  }

  return (
    <AuthShell>
      <h1 className="font-display text-4xl text-ink">Login</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (errors.email) {
              setErrors((current) => ({ ...current, email: undefined }));
            }
          }}
        />
        {errors.email ? <p className="text-sm text-red-500">{errors.email}</p> : null}
        <div className="space-y-2">
          <div className="relative">
            <Input
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="pr-20"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password) {
                  setErrors((current) => ({ ...current, password: undefined }));
                }
              }}
              onKeyDown={onPasswordKeyDown}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer text-sm font-semibold text-accent"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password ? <p className="text-sm text-red-500">{errors.password}</p> : null}
        </div>
        <Button type="button" disabled={isSubmitting} className="w-full" onClick={() => void submitLogin()}>
          {isSubmitting ? "Signing in..." : "Login"}
        </Button>
      </form>
      <div className="mt-6 flex items-center justify-between gap-4 text-sm text-slate">
        <p>
          New customer?{" "}
          <Link href="/register" className="font-semibold text-accent">
            Create an account
          </Link>
        </p>
        <Link href="/forgot-password" className="font-semibold text-accent">
          Forgot password?
        </Link>
      </div>
      <div className="mt-4 rounded-2xl bg-[#f5f8fb] p-4 text-sm text-slate">
        <p className="font-semibold text-ink">Need a new verification email?</p>
        <p className="mt-1">Enter your email above, then resend the verification link.</p>
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
          className="mt-3 font-semibold text-accent underline disabled:cursor-not-allowed disabled:text-slate"
        >
          {resending ? "Sending..." : "Resend verification email"}
        </button>
      </div>
    </AuthShell>
  );
}

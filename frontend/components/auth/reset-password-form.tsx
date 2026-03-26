"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

export function ResetPasswordForm({ token = "" }: { token?: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validate = () => {
    const nextErrors: { password?: string; confirmPassword?: string } = {};
    if (password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    if (confirmPassword.length < 8) nextErrors.confirmPassword = "Confirm your password";
    else if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password reset successful. Login with your new password.");
      router.push("/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to reset password"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="font-display text-4xl text-ink">Reset Password</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              autoComplete="new-password"
              className="pr-20"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
              }}
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
        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="pr-20"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (errors.confirmPassword) setErrors((current) => ({ ...current, confirmPassword: undefined }));
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer text-sm font-semibold text-accent"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.confirmPassword ? <p className="text-sm text-red-500">{errors.confirmPassword}</p> : null}
        </div>
        <Button type="submit" disabled={isSubmitting || !token} className="w-full">
          {isSubmitting ? "Resetting..." : "Reset password"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate">
        Back to{" "}
        <Link href="/login" className="font-semibold text-accent">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}

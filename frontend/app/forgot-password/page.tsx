"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Enter a valid email");
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      toast.success("If that email exists, a reset link has been sent.");
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError, "Unable to request password reset"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Forgot Password</h1>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) {
                  setError(undefined);
                }
              }}
            />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button disabled={isSubmitting} className="w-full">{isSubmitting ? "Sending..." : "Send reset link"}</Button>
          </form>
          <p className="mt-6 text-sm text-slate">Remembered it? <Link href="/login" className="font-semibold text-accent">Login</Link></p>
        </div>
      </div>
    </PageShell>
  );
}

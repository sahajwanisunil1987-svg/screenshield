"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { api, getApiErrorMessage } from "@/lib/api";

type VerificationState = "idle" | "loading" | "success" | "error";

export function VerifyEmailStatus({ token = "" }: { token?: string }) {
  const [state, setState] = useState<VerificationState>(token ? "loading" : "error");

  useEffect(() => {
    if (!token) return;

    setState("loading");
    api
      .post("/auth/verify-email", { token })
      .then(() => {
        setState("success");
        toast.success("Email verified. You can now log in.");
      })
      .catch((error) => {
        setState("error");
        toast.error(getApiErrorMessage(error, "Unable to verify email"));
      });
  }, [token]);

  const message =
    state === "loading"
      ? "Verifying your email..."
      : state === "success"
        ? "Your email has been verified. You can now log in."
        : "This verification link is invalid or expired.";

  return (
    <AuthShell>
      <h1 className="font-display text-4xl text-ink">Verify Email</h1>
      <p className="mt-6 text-sm text-slate">{message}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/login">
          <Button type="button">Go to Login</Button>
        </Link>
        {state === "error" ? (
          <Link href="/login">
            <Button type="button" variant="secondary">
              Resend verification
            </Button>
          </Link>
        ) : null}
      </div>
    </AuthShell>
  );
}

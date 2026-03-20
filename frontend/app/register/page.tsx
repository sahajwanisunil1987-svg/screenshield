"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (form.name.trim().length < 2) {
      nextErrors.name = "Enter your full name";
    }
    if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email";
    }
    if (form.phone.trim().length < 10) {
      nextErrors.phone = "Enter a valid phone number";
    }
    if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }
    if (form.confirmPassword.length < 8) {
      nextErrors.confirmPassword = "Confirm your password";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password
      });
      toast.success("Account created. Please verify your email from Gmail before logging in.");
      router.push("/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create account"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Register</h1>
          <p className="mt-4 text-sm text-slate">A verification link will be sent to your Gmail before first login.</p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input placeholder="Full name" autoComplete="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            {errors.name ? <p className="text-sm text-red-500">{errors.name}</p> : null}

            <Input placeholder="Email" autoComplete="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
            {errors.email ? <p className="text-sm text-red-500">{errors.email}</p> : null}

            <Input placeholder="Phone" autoComplete="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
            {errors.phone ? <p className="text-sm text-red-500">{errors.phone}</p> : null}

            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="new-password"
                  className="pr-20"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-accent"
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
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="pr-20"
                  value={form.confirmPassword}
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-accent"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword ? <p className="text-sm text-red-500">{errors.confirmPassword}</p> : null}
            </div>

            <Button disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating..." : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-slate">
            Already registered? <Link href="/login" className="font-semibold text-accent">Login</Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}

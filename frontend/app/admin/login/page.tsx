"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { register, handleSubmit, setValue } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema)
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
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
        className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/5 p-8 text-white"
      >
        <h1 className="font-display text-4xl">Admin login</h1>
        <div className="mt-8 space-y-4">
          <Input placeholder="Admin email" autoComplete="email" {...register("email")} />
          <Input type="password" placeholder="Password" autoComplete="current-password" {...register("password")} />
          <Button className="w-full">Sign in</Button>
        </div>
        <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-white/75">
          <p className="font-semibold text-white">Demo admin</p>
          <p>admin@sparekart.in / Admin@123</p>
          <button
            type="button"
            onClick={() => {
              setValue("email", "admin@sparekart.in");
              setValue("password", "Admin@123");
            }}
            className="mt-3 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white"
          >
            Use Demo Credentials
          </button>
        </div>
      </form>
    </div>
  );
}

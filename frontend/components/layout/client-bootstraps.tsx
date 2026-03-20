"use client";

import dynamic from "next/dynamic";
import { AuthBootstrap } from "@/components/layout/auth-bootstrap";
import { PwaRegister } from "@/components/pwa/pwa-register";

const Toaster = dynamic(() => import("sonner").then((module) => module.Toaster), {
  ssr: false
});

export function ClientBootstraps() {
  return (
    <>
      <AuthBootstrap />
      <PwaRegister />
      <Toaster richColors position="top-right" />
    </>
  );
}

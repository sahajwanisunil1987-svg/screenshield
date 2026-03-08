"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">Storefront error</p>
      <h1 className="mt-4 font-display text-5xl text-ink">Something broke while loading this page</h1>
      <p className="mt-4 text-sm text-slate">
        {error.message || "The request could not be completed right now."}
      </p>
      <Button className="mt-8" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}

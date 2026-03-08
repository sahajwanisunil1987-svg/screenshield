import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">404</p>
      <h1 className="mt-4 font-display text-5xl text-ink">The requested page was not found</h1>
      <p className="mt-4 text-sm text-slate">
        Try browsing the catalog again from the homepage or jump directly into the product listing.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
        <Link href="/products">
          <Button variant="secondary">Browse Products</Button>
        </Link>
      </div>
    </div>
  );
}

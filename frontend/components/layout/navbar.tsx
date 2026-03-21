import Link from "next/link";
import { NavbarControls } from "./navbar-controls";
import { NavbarSearch } from "./navbar-search";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 shadow-[0_18px_40px_rgba(8,17,31,0.18)] backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4 text-white sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap lg:gap-4">
          <Link href="/" className="shrink-0 font-display text-2xl tracking-tight sm:text-[2rem]">
            SpareKart
          </Link>
          <div className="hidden min-w-0 flex-1 md:block md:min-w-[260px] lg:min-w-[320px] xl:min-w-[420px]">
            <NavbarSearch
              placeholder="Search by brand, model, part, or SKU"
              buttonLabel="Search"
              wrapperClassName="flex items-center gap-2.5"
              inputClassName="border-white/10 bg-white/5 text-white placeholder:text-white/45 focus:border-white/20 focus:ring-white/10"
              dropdownClassName="theme-surface"
              buttonClassName="rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
            />
          </div>
          <NavbarControls />
        </div>
      </div>
    </header>
  );
}

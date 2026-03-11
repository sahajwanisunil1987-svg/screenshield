import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_18%),linear-gradient(180deg,#07111f,#0b1b30)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">SpareKart support</p>
              <h3 className="mt-3 font-display text-3xl">Workshop-ready parts, cleaner discovery, faster replacement flow.</h3>
              <p className="mt-3 text-sm text-white/70">
                SpareKart brings together brand-first discovery, verified part matching, and secure order handling for both retail buyers and repair shops.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/90">
                Browse catalog
              </Link>
              <Link href="/track-order" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Track an order
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr]">
          <div>
            <h3 className="font-display text-2xl">SpareKart</h3>
            <p className="mt-4 text-sm text-white/70">
              Premium mobile spare parts with verified quality, fast dispatch, and India-ready support.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
              <span className="rounded-full border border-white/10 px-3 py-2">Warranty-backed parts</span>
              <span className="rounded-full border border-white/10 px-3 py-2">Secure checkout</span>
              <span className="rounded-full border border-white/10 px-3 py-2">India dispatch</span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-white/80">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Explore</p>
            <Link href="/brands" className="transition hover:text-white">Brands</Link>
            <Link href="/categories" className="transition hover:text-white">Categories</Link>
            <Link href="/products" className="transition hover:text-white">Products</Link>
          </div>

          <div className="space-y-3 text-sm text-white/80">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Account</p>
            <Link href="/track-order" className="transition hover:text-white">Track Order</Link>
            <Link href="/login" className="transition hover:text-white">Login</Link>
            <Link href="/register" className="transition hover:text-white">Register</Link>
          </div>

          <div className="space-y-3 text-sm text-white/80">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Support</p>
            <Link href="/support" className="transition hover:text-white">Support</Link>
            <Link href="/contact" className="transition hover:text-white">Contact Us</Link>
            <Link href="/returns" className="transition hover:text-white">Returns</Link>
            <Link href="/privacy-policy" className="transition hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
            <div className="pt-3 text-white/65">
              <p className="font-semibold text-white/80">Mister Mobile</p>
              <p className="mt-1 text-white/55">DC hospital near, triveni jaipur 302018</p>
              <p className="mt-2">
                Email:{" "}
                <a href="mailto:sahajwanisunil1987@gmail.com" className="transition hover:text-white">
                  sahajwanisunil1987@gmail.com
                </a>
              </p>
              <p className="mt-1">
                Phone:{" "}
                <a href="tel:+919001554862" className="transition hover:text-white">
                  +91 9001554862
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

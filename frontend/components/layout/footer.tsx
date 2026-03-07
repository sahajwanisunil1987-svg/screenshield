import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <h3 className="font-display text-2xl">SpareKart</h3>
          <p className="mt-4 text-sm text-white/70">
            Premium mobile spare parts with verified quality, fast dispatch, and India-ready support.
          </p>
        </div>
        <div className="space-y-3 text-sm text-white/80">
          <Link href="/brands">Brands</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/products">Products</Link>
        </div>
        <div className="space-y-3 text-sm text-white/80">
          <Link href="/track-order">Track Order</Link>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </div>
        <div className="space-y-3 text-sm text-white/80">
          <p>Support</p>
          <p>Returns</p>
          <p>Privacy Policy</p>
          <p>Terms</p>
        </div>
      </div>
    </footer>
  );
}

import { NextRequest, NextResponse } from "next/server";

const normalizeOrigin = (value?: string) => value?.replace(/\/+$/, "");

const siteOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) || "https://www.purjix.com";
const adminOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_ADMIN_URL) || "https://admin.purjix.in";

const getHost = (request: NextRequest) =>
  request.headers.get("x-forwarded-host") || request.headers.get("host") || "";

const getHostname = (request: NextRequest) => getHost(request).split(":")[0].toLowerCase();

const getOriginHostname = (origin: string) => {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return "";
  }
};

const adminHostname = getOriginHostname(adminOrigin);
const siteHostname = getOriginHostname(siteOrigin);

const isLocalhost = (hostname: string) => hostname === "localhost" || hostname === "127.0.0.1";
const isAdminPath = (pathname: string) => pathname === "/admin" || pathname.startsWith("/admin/");

export function middleware(request: NextRequest) {
  const hostname = getHostname(request);
  const { pathname, search } = request.nextUrl;

  if (!adminHostname || !siteHostname || isLocalhost(hostname)) {
    return NextResponse.next();
  }

  if (hostname === adminHostname) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/admin/dashboard", adminOrigin));
    }

    if (!isAdminPath(pathname)) {
      return NextResponse.redirect(new URL(`${pathname}${search}`, siteOrigin));
    }
  }

  if (hostname === siteHostname && isAdminPath(pathname)) {
    return NextResponse.redirect(new URL(`${pathname}${search}`, adminOrigin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|maskable-icon.png).*)"]
};

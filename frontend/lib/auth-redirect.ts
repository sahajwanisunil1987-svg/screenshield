export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SanitizeNextPathOptions = {
  fallback?: string;
  adminOnly?: boolean;
};

export const sanitizeNextPath = (nextPath?: string, options: SanitizeNextPathOptions = {}) => {
  const fallback = options.fallback ?? "/";

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  if (options.adminOnly && !nextPath.startsWith("/admin")) {
    return fallback;
  }

  return nextPath;
};

export const buildRedirectWithNext = (loginPath: "/login" | "/admin/login", pathname: string, search = "") => {
  const nextValue = `${pathname}${search}`;
  const query = new URLSearchParams({ next: nextValue });
  return `${loginPath}?${query.toString()}`;
};

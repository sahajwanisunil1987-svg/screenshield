import "server-only";

const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api").replace(/\/+$/, "");
const normalizePath = (path: string) => path.replace(/^\/+/, "");

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const nextOptions = init?.cache === "no-store" ? undefined : { revalidate: 60, ...(init?.next ?? {}) };

  const response = await fetch(`${baseUrl}/${normalizePath(path)}`, {
    ...init,
    ...(nextOptions ? { next: nextOptions } : {}),
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  return response.json();
}

export async function fetchApiOrFallback<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    return await fetchApi<T>(path, init);
  } catch (error) {
    console.warn(`[server-api] Falling back for ${path}`, error);
    return fallback;
  }
}

import axios from "axios";
import { useAuthStore } from "@/store/auth-store";

const normalizeBaseUrl = (value?: string) => value?.replace(/\/+$/, "");
const normalizeRelativeUrl = (value?: string) => {
  if (!value) {
    return value;
  }

  if (/^(https?:)?\/\//i.test(value)) {
    return value;
  }

  return value.replace(/^\/+/, "");
};

export const api = axios.create({
  baseURL: normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.request.use((config) => {
  config.baseURL = normalizeBaseUrl(config.baseURL);
  config.url = normalizeRelativeUrl(config.url);
  return config;
});

export const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = api
      .post("auth/refresh")
      .then((response) => {
        if (response.status === 204 || !response.data?.token) {
          useAuthStore.getState().clearAuth();
          return null;
        }

        useAuthStore.getState().setAuth(response.data.token, response.data.user);
        return response.data.token as string;
      })
      .catch(() => {
        useAuthStore.getState().clearAuth();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
      if (!originalRequest) {
        return Promise.reject(error);
      }

      const requestUrl = originalRequest?.url ?? "";
      const authHeader =
        (originalRequest?.headers as { Authorization?: string } | undefined)?.Authorization ??
        (originalRequest?.headers as { authorization?: string } | undefined)?.authorization;

      if (
        !originalRequest?._retry &&
        authHeader?.startsWith("Bearer ") &&
        !requestUrl.endsWith("/auth/refresh")
      ) {
        originalRequest._retry = true;
        const nextToken = await refreshAccessToken();

        if (nextToken) {
          originalRequest.headers = {
            ...(originalRequest.headers ?? {}),
            Authorization: `Bearer ${nextToken}`
          } as typeof originalRequest.headers;

          return api.request(originalRequest);
        }
      }

      if (authHeader?.startsWith("Bearer ") && typeof window !== "undefined") {
        useAuthStore.getState().clearAuth();

        const nextPath = window.location.pathname.startsWith("/admin") ? "/admin/login" : "/login";
        if (window.location.pathname !== nextPath) {
          window.location.assign(nextPath);
        }
      }
    }

    return Promise.reject(error);
  }
);

export const authHeaders = (token?: string | null) =>
  (token ?? useAuthStore.getState().token)
    ? {
        headers: {
          Authorization: `Bearer ${token ?? useAuthStore.getState().token}`
        }
      }
    : {};

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  if (axios.isAxiosError(error)) {
    const fieldErrors = error.response?.data?.errors?.fieldErrors as
      | Record<string, string[] | undefined>
      | undefined;
    const formErrors = error.response?.data?.errors?.formErrors as string[] | undefined;

    if (fieldErrors) {
      for (const messages of Object.values(fieldErrors)) {
        const firstMessage = messages?.find((message) => typeof message === "string" && message.trim());
        if (firstMessage) {
          return firstMessage;
        }
      }
    }

    const firstFormError = formErrors?.find((message) => typeof message === "string" && message.trim());
    if (firstFormError) {
      return firstFormError;
    }

    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

import axios from "axios";
import { useAuthStore } from "@/store/auth-store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const authHeader =
        (error.config?.headers as { Authorization?: string } | undefined)?.Authorization ??
        (error.config?.headers as { authorization?: string } | undefined)?.authorization;

      if (authHeader?.startsWith("Bearer ") && typeof window !== "undefined") {
        useAuthStore.getState().logout();

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
  token
    ? {
        headers: {
          Authorization: `Bearer ${token}`
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

import type { PublicAppSettings } from "@/types";
import { fetchApiOrFallback } from "@/lib/server-api";
import { DEFAULT_APP_SETTINGS } from "@/lib/app-settings";

export const getPublicAppSettings = async () => fetchApiOrFallback<PublicAppSettings>("/settings/app", DEFAULT_APP_SETTINGS);

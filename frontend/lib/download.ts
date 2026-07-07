/**
 * Check if the current device is iOS (iPhone, iPad, iPod) or iPadOS 13+.
 * iOS Safari does not support the `download` attribute on anchor elements
 * for blob URLs, so we need a different download approach.
 */
const isIOS = (): boolean => {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent;
  const iosRegex = /iPad|iPhone|iPod/i;

  // Standard iOS detection
  if (iosRegex.test(ua)) return true;

  // iPadOS 13+ identifies as MacIntel but has touch support
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
    return true;
  }

  return false;
};

/**
 * Get the API base URL for direct navigation (used for iOS download).
 */
const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  // Production: Same-origin API
  return "/api";
};

/**
 * Download a PDF invoice with cross-device compatibility.
 *
 * On desktop/Android: Fetches the PDF as a blob and triggers download via
 * a temporary anchor element with the `download` attribute.
 *
 * On iOS (Safari): Opens the PDF URL directly in a new tab so Safari can
 * display it natively. Users can then save via the share button.
 * The auth token is passed as a query parameter since iOS cannot set
 * custom headers on `window.open()`.
 *
 * @param apiPath - The API path (e.g. `/orders/${orderId}/invoice`)
 * @param filename - The desired filename (e.g. `invoice-PJX-0001.pdf`)
 * @param token - The auth access token
 */
export const downloadInvoicePdf = async (
  apiPath: string,
  filename: string,
  token: string,
): Promise<void> => {
  if (isIOS()) {
    // iOS: Open PDF directly in a new tab — Safari displays it natively,
    // and users can tap the share button to save to Files / Books.
    const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
    const path = apiPath.replace(/^\/+/, "");
    const pdfUrl = `${baseUrl}/${path}?token=${encodeURIComponent(token)}`;
    window.open(pdfUrl, "_blank");
    return;
  }

  // Desktop / Android: Fetch as blob and trigger download via anchor click
  const response = await fetch(
    `${getApiBaseUrl().replace(/\/+$/, "")}/${apiPath.replace(/^\/+/, "")}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to download invoice: ${response.statusText}`);
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(
    new Blob([blob], { type: "application/pdf" }),
  );

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

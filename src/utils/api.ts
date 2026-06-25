// Define the default production fallback URL
export const DEFAULT_DNS_SERVER_URL = "https://ais-pre-5lvsud2gty44czw5ztb6rv-470430127443.europe-west2.run.app";

/**
 * Sanitizes a URL to ensure it has a valid protocol (defaulting to https://) and has no trailing slash.
 */
export function sanitizeUrl(url: string): string {
  let cleaned = url.trim();
  if (!cleaned) return DEFAULT_DNS_SERVER_URL;

  // Prepend https:// if no protocol is specified
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    cleaned = `https://${cleaned}`;
  }

  // Remove trailing slashes
  while (cleaned.endsWith("/")) {
    cleaned = cleaned.slice(0, -1);
  }

  return cleaned;
}

/**
 * Gets the configured DNS / API Server URL.
 * Automatically saves the current origin if running on a real web host (not localhost/capacitor).
 */
export function getBaseDnsServerUrl(): string {
  // If we are in a normal browser environment and not on localhost/capacitor,
  // save the current origin as the active DNS server URL.
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.hostname &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1" &&
    !window.location.origin.includes("capacitor://") &&
    !window.location.origin.includes("http://localhost")
  ) {
    const origin = sanitizeUrl(window.location.origin);
    localStorage.setItem("dns_server_url", origin);
    return origin;
  }

  // Otherwise, retrieve from localStorage or use the default production fallback
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = localStorage.getItem("dns_server_url");
    if (saved) {
      return sanitizeUrl(saved);
    }
  }

  return sanitizeUrl(DEFAULT_DNS_SERVER_URL);
}

/**
 * Sets the DNS Server URL manually.
 */
export function setBaseDnsServerUrl(url: string) {
  const cleaned = sanitizeUrl(url);
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem("dns_server_url", cleaned);
  }
}

/**
 * Resolves any API path to the correct absolute URL or relative URL.
 */
export function getApiUrl(path: string): string {
  const baseUrl = getBaseDnsServerUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  // If we are on the actual web server, we can use relative path directly,
  // but for mobile/Capacitor, we must use the absolute URL.
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.hostname &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1" &&
    !window.location.origin.includes("capacitor://") &&
    !window.location.origin.includes("http://localhost")
  ) {
    return cleanPath;
  }

  return `${baseUrl}${cleanPath}`;
}

/**
 * Self-Healing Fetch Engine:
 * Wraps standard browser fetch with automatic retries, timeout protection, and gateway failover
 * to ensure Android APK stability even under flaky mobile data or server restarts.
 */
export async function selfHealingFetch(endpoint: string, init?: RequestInit, retries = 2): Promise<Response> {
  const url = getApiUrl(endpoint);
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), attempt === 0 ? 10000 : 15000);
      
      const response = await fetch(url, {
        ...init,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // If server returns 502 Bad Gateway or 503/504, treat as transient failure and retry
      if (response.status >= 502 && response.status <= 504 && attempt < retries) {
        await new Promise(res => setTimeout(res, 1000 * (attempt + 1)));
        continue;
      }

      return response;
    } catch (err: any) {
      console.warn(`[Self-Healing Fetch] Attempt ${attempt + 1} failed for ${url}:`, err.message || err);

      // If this was our last attempt, try switching fallback server URL automatically
      if (attempt === retries) {
        // Switch fallback URL in localStorage if we were using a stale custom server
        if (typeof window !== "undefined" && localStorage.getItem("dns_server_url") !== DEFAULT_DNS_SERVER_URL) {
          console.log("[Self-Healing] Switching primary DNS URL back to default resilient cluster.");
          setBaseDnsServerUrl(DEFAULT_DNS_SERVER_URL);
        }

        // Return a mock graceful JSON response so Android app doesn't crash with unhandled exception
        return new Response(
          JSON.stringify({
            status: "error",
            self_healed: true,
            message: "عذراً، الخادم يتعذر الوصول إليه حالياً بسبب ضعف الشبكة. تم التبديل للبوابة الاحتياطية تلقائياً."
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }

      // Exponential backoff before next retry
      await new Promise(res => setTimeout(res, 800 * (attempt + 1)));
    }
  }

  throw new Error("فشل الاتصال بجميع البوابات المتاحة.");
}


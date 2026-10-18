export const PUBLIC_SITE_URL = "https://wbx1217.github.io/EldenData/";

function isDesktopShell(): boolean {
  if (typeof window === "undefined") return false;
  const tauriWindow = window as Window & { __TAURI_INTERNALS__?: unknown };
  return (
    Boolean(tauriWindow.__TAURI_INTERNALS__) ||
    window.location.protocol === "tauri:" ||
    window.location.hostname === "tauri.localhost"
  );
}

/**
 * In a browser this preserves the current URL. In the Tauri shell the current
 * origin is local, so share links must point at the public web deployment.
 */
export function shareBaseUrl(): URL {
  if (typeof window === "undefined") return new URL(PUBLIC_SITE_URL);
  if (!isDesktopShell()) return new URL(window.location.href);
  const url = new URL(PUBLIC_SITE_URL);
  url.search = window.location.search;
  return url;
}

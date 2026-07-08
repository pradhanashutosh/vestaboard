import { useEffect } from "react";

/** Keeps the TV screen awake using the Screen Wake Lock API, re-acquiring
 * it whenever the tab regains visibility (the lock is released by the
 * browser when the tab is hidden). Silently no-ops if unsupported. */
export function useWakeLock() {
  useEffect(() => {
    let lock: any = null;
    let cancelled = false;

    async function acquire() {
      try {
        if ("wakeLock" in navigator) {
          lock = await (navigator as any).wakeLock.request("screen");
        }
      } catch {
        // Ignore: unsupported or denied — not fatal for the display page.
      }
    }

    function onVisibility() {
      if (!cancelled && document.visibilityState === "visible") acquire();
    }

    acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      lock?.release?.().catch(() => {});
    };
  }, []);
}

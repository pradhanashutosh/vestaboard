import { useEffect, useState } from "react";

/** Avoids CSS `aspect-ratio`/`min()`, which older TV webviews (e.g. LG
 * webOS on pre-2021 Chromium) don't support — board sizing is computed
 * in JS instead so it degrades gracefully everywhere. */
export function useViewportSize() {
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 720,
  });

  useEffect(() => {
    function onResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return size;
}

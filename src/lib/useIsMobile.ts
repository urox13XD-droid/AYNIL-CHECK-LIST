"use client";

import { useEffect, useState } from "react";

// a coarse pointer (finger) rather than a fine one (mouse/trackpad) is what
// actually distinguishes a phone/tablet from a laptop — checking viewport
// size instead breaks on any desktop browser window narrower than the
// threshold (unmaximized, small laptop screen), wrongly flipping it into
// mobile mode
const COARSE_POINTER_QUERY = "(pointer: coarse)";

/** true on touch-primary devices (phone/tablet); false everywhere else, including during SSR/first paint to avoid a hydration mismatch */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(COARSE_POINTER_QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
}

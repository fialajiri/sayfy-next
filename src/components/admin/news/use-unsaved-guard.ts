"use client";

import { useEffect } from "react";

// Warn before leaving with unsaved changes. Subscribing to a browser event is
// the legitimate use of an effect (synchronising with an external system).
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);
}

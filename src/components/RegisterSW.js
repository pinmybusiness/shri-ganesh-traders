"use client";

import { useEffect } from "react";

// Service worker register karta hai (PWA install + offline shell ke liye).
export default function RegisterSW() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

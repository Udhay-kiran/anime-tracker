"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ScrollToHash() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let attempts = 0;
    const hash = window.location.hash?.replace("#", "");
    if (!hash) return;

    const timer = setInterval(() => {
      attempts += 1;
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        clearInterval(timer);
      }
      if (attempts > 10) {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [pathname, searchParams]);

  return null;
}

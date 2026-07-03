"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import type { Language } from "@/lib/resource-helpers";
import { ui } from "@/lib/resource-helpers";

export function BackToTop({ language }: { language: Language }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 520);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:text-slate-950"
      aria-label={ui[language].backToTop}
    >
      <ArrowUp className="h-4 w-4" />
      <span className="hidden sm:inline">{ui[language].backToTop}</span>
    </button>
  );
}

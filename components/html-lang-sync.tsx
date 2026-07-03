"use client";

import { useEffect } from "react";
import type { Language } from "@/lib/resource-helpers";

export function HtmlLangSync({ language }: { language: Language }) {
  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
  }, [language]);

  return null;
}

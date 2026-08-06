"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitResourceConfig, type Language } from "@/lib/resource-helpers";

export function SubmitResourceEntry({ language }: { language: Language }) {
  const config = submitResourceConfig[language];

  return (
    <Button
      asChild
      size="lg"
      className="fixed bottom-5 right-5 z-40 rounded-full px-5 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
    >
      <a
        href={config.url}
        data-entry-point="floating"
        data-tally-open={config.formId}
        data-tally-emoji-text="👋"
        data-tally-emoji-animation="wave"
        data-tally-auto-close="1000"
      >
        <Plus className="h-4 w-4" />
        {config.label}
      </a>
    </Button>
  );
}

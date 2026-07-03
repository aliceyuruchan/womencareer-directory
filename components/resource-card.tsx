"use client";

import { ArrowUpRight } from "lucide-react";
import type { Language } from "@/lib/resource-helpers";
import { getResourceCopy, ui } from "@/lib/resource-helpers";
import type { Resource } from "@/data/resources";
import { ResourceFavicon } from "@/components/resource-favicon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ResourceCard({
  resource,
  language,
}: {
  resource: Resource;
  language: Language;
}) {
  const copy = ui[language];
  const content = getResourceCopy(resource, language);

  return (
    <Card className="overflow-hidden border-border/70 bg-white/94 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <CardContent className="p-0">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <ResourceFavicon
                officialUrl={resource.officialUrl}
                logoUrl={resource.logoUrl}
                alt={content.name}
              />
              <h3 className="text-lg font-semibold text-slate-950">{content.name}</h3>
              <Badge variant="outline" className="bg-white">
                {resource.status}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {content.shortDescription}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {content.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-slate-500 lg:min-w-80">
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <div className="text-xs uppercase tracking-wide">{copy.metadata.region}</div>
              <div className="mt-1 font-medium text-slate-900">{resource.region}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <div className="text-xs uppercase tracking-wide">{copy.metadata.type}</div>
              <div className="mt-1 font-medium text-slate-900">{content.type}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <div className="text-xs uppercase tracking-wide">{copy.metadata.cost}</div>
              <div className="mt-1 font-medium text-slate-900">{resource.cost}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <div className="text-xs uppercase tracking-wide">{copy.metadata.language}</div>
              <div className="mt-1 font-medium text-slate-900">
                {resource.language.join(", ")}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/50 px-5 py-4 sm:px-6">
          <span className="truncate text-sm text-slate-500">{resource.officialUrl}</span>
          <Button asChild variant="outline" size="sm">
            <a href={resource.officialUrl} target="_blank" rel="noreferrer">
              {copy.visit}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useMemo, useState } from "react";

function getFaviconCandidates(officialUrl: string, logoUrl?: string) {
  try {
    const origin = new URL(officialUrl).origin;

    return [
      ...(logoUrl ? [logoUrl] : []),
      `${origin}/favicon.ico`,
      `${origin}/favicon.png`,
      `${origin}/favicon-32x32.png`,
      `${origin}/apple-touch-icon.png`,
      "/default-resource-logo.svg",
    ];
  } catch {
    return logoUrl ? [logoUrl, "/default-resource-logo.svg"] : ["/default-resource-logo.svg"];
  }
}

export function ResourceFavicon({
  officialUrl,
  alt,
  logoUrl,
}: {
  officialUrl: string;
  alt: string;
  logoUrl?: string;
}) {
  const sources = useMemo(
    () => getFaviconCandidates(officialUrl, logoUrl),
    [logoUrl, officialUrl]
  );
  const [index, setIndex] = useState(0);

  return (
    <img
      src={sources[index] ?? "/default-resource-logo.svg"}
      alt={alt}
      className="h-5 w-5 rounded-[4px] border border-slate-200 bg-white object-cover"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        setIndex((current) => {
          if (current >= sources.length - 1) {
            return current;
          }

          return current + 1;
        });
      }}
    />
  );
}

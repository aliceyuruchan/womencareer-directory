import Link from "next/link";
import type { Language } from "@/lib/resource-helpers";

export function LanguageSwitcher({
  language,
  zhHref,
  enHref,
}: {
  language: Language;
  zhHref: string;
  enHref: string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
      {[
        { code: "zh" as const, label: "中文", href: zhHref },
        { code: "en" as const, label: "EN", href: enHref },
      ].map((item) => {
        const active = language === item.code;

        return (
          <Link
            key={item.code}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition ${
              active
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-500 hover:bg-white hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

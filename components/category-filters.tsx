"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { ResourceCard } from "@/components/resource-card";
import { type Resource } from "@/data/resources";
import { type Language, getResourceCopy, ui } from "@/lib/resource-helpers";

/* ── FilterDropdown ─────────────────────────────────────── */

interface FilterDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

function FilterDropdown({ label, options, selected, onToggle }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeCount = selected.length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (options.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          open || activeCount > 0
            ? "border-slate-300 bg-slate-50 text-slate-900"
            : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {label}
        {activeCount > 0 && (
          <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="flex flex-wrap gap-1.5">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(option);
                }}
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selected.includes(option)
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {option}
                {selected.includes(option) && <X className="ml-1 h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── CategoryFilters ────────────────────────────────────── */

interface CategoryFiltersProps {
  items: Resource[];
  language: Language;
}

export function CategoryFilters({ items, language }: CategoryFiltersProps) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCosts, setSelectedCosts] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const copy = ui[language];

  const regions = useMemo(
    () => [...new Set(items.map((r) => r.region))].sort(),
    [items],
  );
  const costs = useMemo(
    () => [...new Set(items.map((r) => r.cost))].sort(),
    [items],
  );
  const types = useMemo(
    () => [...new Set(items.map((r) => getResourceCopy(r, language).type))].sort(),
    [items, language],
  );
  const langOptions = useMemo(
    () => [...new Set(items.flatMap((r) => r.language))].sort(),
    [items],
  );
  const tagOptions = useMemo(
    () => [...new Set(items.flatMap((r) => getResourceCopy(r, language).tags))].sort(),
    [items, language],
  );

  const totalActive =
    selectedRegions.length +
    selectedCosts.length +
    selectedTypes.length +
    selectedLanguages.length +
    selectedTags.length;
  const hasFilters = totalActive > 0;

  const resetFilters = () => {
    setSelectedRegions([]);
    setSelectedCosts([]);
    setSelectedTypes([]);
    setSelectedLanguages([]);
    setSelectedTags([]);
  };

  const toggleFilter = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (selectedRegions.length > 0 && !selectedRegions.includes(item.region))
        return false;
      if (selectedCosts.length > 0 && !selectedCosts.includes(item.cost))
        return false;
      if (
        selectedTypes.length > 0 &&
        !selectedTypes.includes(getResourceCopy(item, language).type)
      )
        return false;
      if (
        selectedLanguages.length > 0 &&
        !item.language.some((l) => selectedLanguages.includes(l))
      )
        return false;
      if (selectedTags.length > 0) {
        const itemTags = getResourceCopy(item, language).tags;
        if (!itemTags.some((t) => selectedTags.includes(t))) return false;
      }
      return true;
    });
  }, [
    items,
    selectedRegions,
    selectedCosts,
    selectedTypes,
    selectedLanguages,
    selectedTags,
    language,
  ]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aNum = parseInt(a.id);
      const bNum = parseInt(b.id);
      return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [filtered, sortOrder]);

  return (
    <>
      {/* Filter Bar — compact single row */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {/* Sort Toggle */}
        <div className="flex overflow-hidden rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setSortOrder("asc")}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
              sortOrder === "asc"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {language === "zh" ? "最早收录" : "Oldest"}
          </button>
          <button
            type="button"
            onClick={() => setSortOrder("desc")}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
              sortOrder === "desc"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {language === "zh" ? "最新收录" : "Newest"}
          </button>
        </div>

        {/* Filter Dropdowns */}
        <FilterDropdown
          label={copy.metadata.region}
          options={regions}
          selected={selectedRegions}
          onToggle={(v) => toggleFilter(setSelectedRegions, v)}
        />
        <FilterDropdown
          label={copy.metadata.cost}
          options={costs}
          selected={selectedCosts}
          onToggle={(v) => toggleFilter(setSelectedCosts, v)}
        />
        <FilterDropdown
          label={copy.metadata.type}
          options={types}
          selected={selectedTypes}
          onToggle={(v) => toggleFilter(setSelectedTypes, v)}
        />
        <FilterDropdown
          label={copy.metadata.language}
          options={langOptions}
          selected={selectedLanguages}
          onToggle={(v) => toggleFilter(setSelectedLanguages, v)}
        />
        <FilterDropdown
          label={language === "zh" ? "标签" : "Tags"}
          options={tagOptions}
          selected={selectedTags}
          onToggle={(v) => toggleFilter(setSelectedTags, v)}
        />

        {/* Reset */}
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600"
          >
            <X className="h-3 w-3" />
            {language === "zh" ? "清除" : "Clear"}
          </button>
        )}
      </div>

      {/* Results Count */}
      <p className="mb-4 text-sm text-slate-500">
        {sorted.length} {copy.count}
        {hasFilters && ` (${language === "zh" ? "已筛选" : "filtered"})`}
      </p>

      {/* Results */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-600">{copy.noResults}</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          >
            {language === "zh" ? "清除所有筛选条件" : "Clear all filters"}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sorted.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              language={language}
            />
          ))}
        </div>
      )}
    </>
  );
}

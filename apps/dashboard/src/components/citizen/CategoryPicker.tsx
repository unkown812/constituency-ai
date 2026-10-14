"use client";

import React, { useRef } from "react";
import {
  Wrench,
  Droplet,
  Heart,
  GraduationCap,
  Zap,
  ShieldCheck,
  Bus,
  AlertCircle,
  LucideIcon,
} from "lucide-react";
import { cn } from "../ui";
import type { Category } from "../../types/citizen";

const ICON_MAP: Record<string, LucideIcon> = {
  Wrench,
  Droplet,
  Heart,
  GraduationCap,
  Zap,
  ShieldCheck,
  Bus,
  AlertCircle,
};

interface CategoryPickerProps {
  categories: Category[];
  selected: string;
  onSelect: (categoryId: string) => void;
  colorMap?: Record<string, string>;
  className?: string;
}

export function CategoryPicker({
  categories,
  selected,
  onSelect,
  colorMap = {},
  className,
}: CategoryPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none",
        "-mx-4 px-4",
        className
      )}
    >
      {categories.map((cat) => {
        const Icon = ICON_MAP[cat.icon] || AlertCircle;
        const accent = colorMap[cat.id] || "#6b7280";
        const isSelected = selected === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "flex flex-col items-center gap-2 shrink-0 snap-start",
              "w-[88px] pt-4 pb-3 px-2 rounded-lg border",
              "transition-all duration-150 cursor-pointer select-none",
              "hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
              isSelected
                ? "bg-surface border-border shadow-sm"
                : "bg-canvas border-transparent"
            )}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{
                backgroundColor: isSelected ? accent : "transparent",
                color: isSelected ? "#fff" : "var(--color-muted, #94a3b8)",
              }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className={cn(
                "text-caption text-center leading-tight transition-colors",
                isSelected ? "text-text" : "text-muted"
              )}
            >
              {cat.label_en}
            </span>
            <div
              className="w-6 h-[3px] rounded-full transition-opacity duration-150"
              style={{
                backgroundColor: accent,
                opacity: isSelected ? 1 : 0,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from "lucide-react";
import { cn } from "./ui";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  trendDirection?: "up" | "down" | "stable";
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel = "vs last month",
  trendDirection,
  className
}: StatCardProps) {
  const isUp = trendDirection ? trendDirection === "up" : trend && trend > 0;
  const isDown = trendDirection ? trendDirection === "down" : trend && trend < 0;
  const isStable = trendDirection ? trendDirection === "stable" : trend === 0;

  return (
    <div className={cn("bg-canvas border border-border px-5 py-6", className)}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 flex items-center justify-center text-muted shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-caption text-muted uppercase tracking-wider">
          {title}
        </span>
      </div>

      <div className="text-card-heading text-text tracking-tight">
        {value}
      </div>

      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          {isUp && (
            <span className="inline-flex items-center gap-1 text-caption text-success">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{trend}%
            </span>
          )}
          {isDown && (
            <span className="inline-flex items-center gap-1 text-caption text-error">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {trend}%
            </span>
          )}
          {isStable && (
            <span className="inline-flex items-center gap-1 text-caption text-muted">
              <Minus className="w-3.5 h-3.5" />
              Stable
            </span>
          )}
          <span className="text-caption text-muted">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

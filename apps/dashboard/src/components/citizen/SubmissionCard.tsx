"use client";

import React from "react";
import { Image, Clock } from "lucide-react";
import { cn, Badge } from "../ui";
import type { SubmissionSummary } from "../../types/citizen";
import type { BadgeProps } from "../ui";

interface SubmissionCardProps {
  submission: SubmissionSummary;
  onPress?: (id: string) => void;
  className?: string;
}

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: "New",
    ai_processing: "Processing",
    analyzed: "Analyzed",
    under_review: "Under Review",
    resolved: "Resolved",
    closed: "Closed",
  };
  return labels[status] || status;
}

function statusBadgeVariant(status: string): BadgeProps["variant"] {
  const map: Record<string, BadgeProps["variant"]> = {
    new: "info",
    ai_processing: "warning",
    analyzed: "brand",
    under_review: "warning",
    resolved: "success",
    closed: "default",
  };
  return map[status] || "default";
}

export function SubmissionCard({
  submission,
  onPress,
  className,
}: SubmissionCardProps) {
  return (
    <button
      onClick={() => onPress?.(submission.id)}
      className={cn(
        "w-full text-left bg-canvas border border-border rounded-xl overflow-hidden",
        "transition-all duration-150 hover:shadow-sm hover:border-border",
        "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
        className
      )}
    >
      <div className="flex gap-4 p-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface shrink-0 flex items-center justify-center">
          {submission.thumbnail_url ? (
            <img
              src={submission.thumbnail_url}
              alt={submission.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image className="w-6 h-6 text-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-heading-sm text-text truncate">{submission.title}</h4>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="brand" size="sm">
              {submission.category}
            </Badge>

            <Badge variant={statusBadgeVariant(submission.status)} size="sm">
              {statusLabel(submission.status)}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <Clock className="w-3.5 h-3.5 text-muted" />
            <span className="text-body text-secondary">
              {getRelativeTime(submission.created_at)}
            </span>
            {submission.image_count > 0 && (
              <span className="flex items-center gap-1 text-body text-secondary ml-2">
                <Image className="w-3.5 h-3.5" />
                {submission.image_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

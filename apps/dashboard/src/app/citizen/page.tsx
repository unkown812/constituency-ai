"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Plus, ListChecks, Wrench, Droplet, Heart, GraduationCap, Zap, ShieldCheck, Bus, AlertCircle, LucideIcon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import "../../i18n";
import { useSubmissionStats, useSubmissions } from "../../hooks/useCitizenApi";
import { SubmissionCard } from "../../components/citizen/SubmissionCard";
import { CATEGORIES, CATEGORY_COLORS } from "../../types/citizen";
import { Button, Skeleton } from "../../components/ui";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Wrench, Droplet, Heart, GraduationCap, Zap, ShieldCheck, Bus, AlertCircle,
};

function SkeletonCard() {
  return (
    <div className="bg-canvas border border-border rounded-xl p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-lg bg-surface-alt shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}

export default function CitizenHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useSubmissionStats();
  const { data: submissionsData, isLoading: subsLoading, isError: subsError, refetch: refetchSubs } = useSubmissions("all", 1, 3);

  const isLoading = statsLoading || subsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-canvas border border-border rounded-xl p-4 animate-pulse">
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map(i => <div key={i} className="w-[88px] h-24 bg-surface-alt rounded-xl shrink-0 animate-pulse" />)}
        </div>
        <Skeleton className="h-6 w-40" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (statsError || subsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-muted mb-4" />
        <p className="text-body text-muted mb-4">{t("common.error")}</p>
        <Button variant="primary" onClick={() => { refetchStats(); refetchSubs(); }}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  const hasRecentSubmissions = submissionsData && submissionsData.items.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-md text-text">
          {t("home.greeting", { name: user?.full_name?.split(" ")[0] || "there" })}
        </h1>
        <p className="text-body text-muted mt-1">{t("app.tagline")}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-canvas border border-border rounded-xl p-4 text-center">
          <p className="text-display-md text-text font-medium">{stats?.this_month || 0}</p>
          <p className="text-caption text-muted mt-1">{t("home.submissions_this_month", { count: stats?.this_month || 0 })}</p>
        </div>
        <div className="bg-canvas border border-border rounded-xl p-4 text-center">
          <p className="text-display-md text-success font-medium">{stats?.resolved_this_month || 0}</p>
          <p className="text-caption text-muted mt-1">{t("home.issues_resolved", { count: stats?.resolved_this_month || 0 })}</p>
        </div>
        <div className="bg-canvas border border-border rounded-xl p-4 text-center">
          <p className="text-display-md text-warning font-medium">{stats?.under_review || 0}</p>
          <p className="text-caption text-muted mt-1">{t("home.under_review", { count: stats?.under_review || 0 })}</p>
        </div>
      </div>

      <div>
        <h2 className="text-heading-md text-text mb-3">{t("home.quick_categories")}</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-none">
          {CATEGORIES.map(cat => {
            const Icon = CATEGORY_ICONS[cat.icon] || AlertCircle;
            const accent = CATEGORY_COLORS[cat.id] || "#6b7280";
            return (
              <button
                key={cat.id}
                onClick={() => router.push(`/citizen/submit?category=${cat.id}`)}
                className="flex flex-col items-center gap-2 shrink-0 snap-start w-[88px] pt-4 pb-3 px-2 rounded-xl border border-border bg-canvas hover:bg-surface-alt transition-colors cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${accent}14`, color: accent }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-caption text-muted text-center leading-tight">{cat.label_en}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-heading-md text-text">{t("home.recent_submissions")}</h2>
          <button
            onClick={() => router.push("/citizen/submissions")}
            className="text-body text-brand hover:underline cursor-pointer"
          >
            {t("home.view_all")}
          </button>
        </div>
        {hasRecentSubmissions ? (
          <div className="space-y-3">
            {submissionsData!.items.map(sub => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                onPress={(id) => router.push(`/citizen/submissions/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-canvas border border-border rounded-xl">
            <ListChecks className="w-10 h-10 text-muted mb-3" />
            <p className="text-body text-muted">{t("home.no_recent")}</p>
          </div>
        )}
      </div>

      <button
        onClick={() => router.push("/citizen/submit")}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-brand text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
        style={{ marginBottom: "var(--sab, 0px)" }}
        aria-label={t("home.new_submission")}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

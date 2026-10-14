"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, AlertCircle, Loader2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import { useSubmissions } from "../../../hooks/useCitizenApi";
import { SubmissionCard } from "../../../components/citizen/SubmissionCard";
import { SUBMISSION_STATUSES } from "../../../types/citizen";
import { Button, Skeleton, EmptyState } from "../../../components/ui";

const FILTER_TABS = [
  { key: "all", labelKey: "submissions.all" },
  ...SUBMISSION_STATUSES.map(s => ({ key: s, labelKey: `status.${s}` })),
];

function SkeletonGrid() {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 18rem), 1fr))" }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-canvas border border-border rounded-xl p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-lg bg-surface-alt shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SubmissionsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading, isError, refetch, isFetching } = useSubmissions(
    activeFilter === "all" ? undefined : activeFilter,
    page,
    LIMIT
  );

  const handleLoadMore = () => {
    if (data && page < data.total_pages) {
      setPage(prev => prev + 1);
    }
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-heading-lg text-text">{t("submissions.title")}</h1>
        <Button
          variant="icon"
          size="md"
          onClick={() => router.push("/citizen/submit")}
          aria-label={t("home.new_submission")}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory scrollbar-none mb-4">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`shrink-0 snap-start px-4 py-2 rounded-full text-body font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === tab.key
                ? "bg-brand text-white"
                : "bg-canvas border border-border text-muted hover:bg-surface-alt"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-muted mb-4" />
          <p className="text-body text-muted mb-4">{t("common.error")}</p>
          <Button variant="primary" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 18rem), 1fr))" }}>
            {data.items.map(sub => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                onPress={(id) => router.push(`/citizen/submissions/${id}`)}
              />
            ))}
          </div>

          {page < data.total_pages && (
            <div className="flex justify-center mt-6">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                disabled={isFetching}
                className="gap-2"
              >
                {isFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {isFetching ? t("common.loading") : "Load More"}
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<ListChecks className="w-8 h-8" />}
          title={t("submissions.empty_title")}
          description={t("submissions.empty_message")}
        />
      )}
    </div>
  );
}

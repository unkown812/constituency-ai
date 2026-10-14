"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, AlertCircle, MapPin, Clock, ThumbsUp, ThumbsDown,
  Sparkles, Send, Eye, CheckCircle, Image, X, Loader2, MessageSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../../../i18n";
import { useSubmissionDetail, useSubmitFeedback } from "../../../../hooks/useCitizenApi";
import { CATEGORY_COLORS, STATUS_COLORS, SubmissionStatus } from "../../../../types/citizen";
import { Badge, Button, Card, Skeleton } from "../../../../components/ui";

const TIMELINE_ICONS: Record<string, React.ReactNode> = {
  Send: <Send className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Eye: <Eye className="w-4 h-4" />,
  CheckCircle: <CheckCircle className="w-4 h-4" />,
};

function statusLabel(status: string, t: (key: string) => string): string {
  const key = `status.${status}`;
  const val = t(key);
  return val !== key ? val : status;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id ?? "") as string;
  const { t } = useTranslation();
  const { data: submission, isLoading, isError, refetch } = useSubmissionDetail(id);
  const feedbackMutation = useSubmitFeedback();
  const [feedbackGiven, setFeedbackGiven] = useState<number | null>(null);
  const [feedbackSending, setFeedbackSending] = useState(false);

  React.useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-48" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (isError || !submission) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-muted mb-4" />
        <p className="text-body text-muted mb-4">{t("common.error")}</p>
        <Button variant="primary" onClick={() => refetch()}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[submission.category] || "#6b7280";
  const statusColor = STATUS_COLORS[submission.status as SubmissionStatus] || "#41454d";

  const handleFeedback = async (rating: number) => {
    setFeedbackSending(true);
    setFeedbackGiven(rating);
    try {
      await feedbackMutation.mutateAsync({ id: submission.id, rating });
    } catch {
      setFeedbackGiven(null);
    } finally {
      setFeedbackSending(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-body text-muted hover:text-text mb-4 cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("common.back")}
      </button>

      <h1 className="text-heading-lg text-text mb-4">{submission.title}</h1>

      <Card variant="default">
        {submission.image_urls && submission.image_urls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto p-4 pb-3 border-b border-border scrollbar-none">
            {submission.image_urls.map((url, i) => (
              <div key={i} className="w-24 h-24 rounded-lg overflow-hidden border border-border bg-surface shrink-0">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-caption font-medium"
              style={{ backgroundColor: `${categoryColor}14`, color: categoryColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categoryColor }} />
              {submission.category}
            </span>
            <Badge
              variant={
                submission.status === "resolved" || submission.status === "closed"
                  ? "success"
                  : submission.status === "under_review"
                  ? "warning"
                  : "default"
              }
            >
              {statusLabel(submission.status, t)}
            </Badge>
          </div>

          <p className="text-body text-secondary leading-relaxed">{submission.description}</p>

          {submission.ai_summary && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-brand" />
                <span className="text-caption text-text">{t("detail.ai_summary")}</span>
              </div>
              <p className="text-body text-secondary leading-relaxed">{submission.ai_summary}</p>
            </div>
          )}

          {submission.location && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="w-4 h-4 text-muted" />
                <span className="text-caption text-muted">{t("submission.location")}</span>
              </div>
              <div className="h-40 rounded-xl overflow-hidden border border-border">
                <MapContainer
                  center={[submission.location.latitude, submission.location.longitude]}
                  zoom={14}
                  scrollWheelZoom={false}
                  dragging={false}
                  className="w-full h-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[submission.location.latitude, submission.location.longitude]} />
                </MapContainer>
              </div>
              {submission.address && (
                <p className="text-body text-muted mt-1">{submission.address}</p>
              )}
            </div>
          )}

          {submission.created_at && (
            <div className="flex items-center gap-1.5 text-body text-muted">
              <Clock className="w-4 h-4" />
              {formatDate(submission.created_at)}
            </div>
          )}
        </div>
      </Card>

      {submission.timeline && submission.timeline.length > 0 && (
        <Card variant="default" className="mt-4 p-4">
          <h2 className="text-heading-sm text-text mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t("detail.timeline")}
          </h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {submission.timeline.map((event, i) => (
                <div key={i} className="flex items-start gap-3 relative">
                  <div
                    className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 z-10"
                    style={{ backgroundColor: `${categoryColor}14` }}
                  >
                    {TIMELINE_ICONS[event.icon] || <Clock className="w-4 h-4 text-muted" />}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-body text-text font-medium">{event.label}</p>
                    <p className="text-body text-muted">{formatDate(event.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {(submission.status === "resolved" || submission.status === "closed") && (
        <Card variant="default" className="mt-4 p-4">
          <h2 className="text-heading-sm text-text mb-3">{t("detail.feedback")}</h2>
          {feedbackGiven !== null ? (
            <div className="flex items-center gap-2 text-body text-success">
              <ThumbsUp className="w-4 h-4" />
              {t("detail.thumbs_up")}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant="outline"
                onClick={() => handleFeedback(1)}
                disabled={feedbackSending}
                className="gap-2"
              >
                {feedbackSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                {t("detail.thumbs_up")}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleFeedback(0)}
                disabled={feedbackSending}
                className="gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                {t("detail.thumbs_down")}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

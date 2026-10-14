"use client";
import React, { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button, Textarea, Card } from "../../../components/ui";
import { CategoryPicker } from "../../../components/citizen/CategoryPicker";
import { VoiceRecorder } from "../../../components/citizen/VoiceRecorder";
import { MediaUploader } from "../../../components/citizen/MediaUploader";
import { LocationPicker } from "../../../components/citizen/LocationPicker";
import { useCreateSubmission } from "../../../hooks/useCitizenApi";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import { CATEGORIES, CATEGORY_COLORS, MediaItem } from "../../../types/citizen";

const TOTAL_STEPS = 4;

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const createSubmission = useCreateSubmission();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(searchParams?.get("category") ?? "");
  const [description, setDescription] = useState("");
  const [transcript, setTranscript] = useState("");
  const [images, setImages] = useState<MediaItem[]>([]);
  const [documents, setDocuments] = useState<MediaItem[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateStep = useCallback((s: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (s === 1 && !category) {
      newErrors.category = t("submission.category_required");
    }
    if (s === 2) {
      const desc = description.trim() || transcript.trim();
      if (!desc) {
        newErrors.description = t("submission.description_required");
      } else if (desc.length < 10) {
        newErrors.description = t("submission.description_min_length");
      }
    }
    if (s === 3 && !location) {
      newErrors.location = t("submission.location_required");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [category, description, transcript, location, t]);

  const handleNext = useCallback(() => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    }
  }, [step, validateStep]);

  const handleBack = useCallback(() => {
    setErrors({});
    setStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(4)) return;
    setSubmitting(true);
    try {
      const finalDescription = description.trim() || transcript.trim() || "";
      await createSubmission.mutateAsync({
        category,
        description: finalDescription,
        latitude: location?.latitude,
        longitude: location?.longitude,
        address: location?.address,
        image_urls: images.map(i => i.uri),
      });
      router.push("/citizen/submissions");
    } catch {
      setErrors({ submit: t("submission.error") });
    } finally {
      setSubmitting(false);
    }
  }, [category, description, transcript, location, images, createSubmission, router, t, validateStep]);

  const progressPercent = (step / TOTAL_STEPS) * 100;

  const categoryLabel = CATEGORIES.find(c => c.id === category)?.label_en || "";
  const categoryColor = CATEGORY_COLORS[category] || "#6b7280";

  return (
    <div>
      <button
        onClick={step > 1 ? handleBack : () => router.back()}
        className="flex items-center gap-1.5 text-body text-muted hover:text-text mb-4 cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("common.back")}
      </button>

      <h1 className="text-heading-lg text-text mb-2">{t("submission.new")}</h1>

      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-1.5 bg-surface-alt rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-caption text-muted shrink-0">
          {t("submission.steps", { current: step, total: TOTAL_STEPS })}
        </span>
      </div>

      <div className="flex justify-between mb-6">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-caption font-medium transition-colors ${
                s < step
                  ? "bg-brand text-white"
                  : s === step
                  ? "bg-brand text-white ring-2 ring-brand/20"
                  : "bg-surface-alt text-muted"
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
          </div>
        ))}
      </div>

      {errors.submit && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-error/10 border border-error/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-error shrink-0" />
          <span className="text-body text-error">{errors.submit}</span>
        </div>
      )}

      <Card variant="default" className="p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-heading-md text-text">{t("submission.category")}</h2>
            <CategoryPicker
              categories={CATEGORIES}
              selected={category}
              onSelect={setCategory}
              colorMap={CATEGORY_COLORS}
            />
            {errors.category && (
              <p className="text-body text-error flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                {errors.category}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-heading-md text-text mb-3">{t("submission.description")}</h2>
              <Textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: "" })); }}
                placeholder={t("submission.description_placeholder")}
                rows={5}
                error={!!errors.description}
              />
              {errors.description && (
                <p className="text-body text-error flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-caption text-muted mb-2">{t("submission.voice_input")}</h3>
              <VoiceRecorder
                onTranscriptionComplete={(text) => { setTranscript(text); setDescription(prev => prev || text); }}
              />
            </div>

            <div>
              <h3 className="text-caption text-muted mb-2">{t("submission.attachments")}</h3>
              <MediaUploader
                images={images}
                documents={documents}
                onImagesChange={setImages}
                onDocumentsChange={setDocuments}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-heading-md text-text">{t("submission.location")}</h2>
            <LocationPicker
              onLocationChange={(loc) => { setLocation(loc); setErrors(prev => ({ ...prev, location: "" })); }}
              defaultCenter={[22.6521, 71.8512]}
            />
            {errors.location && (
              <p className="text-body text-error flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                {errors.location}
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-heading-md text-text">{t("submission.review_submit")}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 px-4 bg-surface rounded-xl">
                <span className="text-body text-muted">{t("submission.category")}</span>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-caption font-medium"
                  style={{ backgroundColor: `${categoryColor}14`, color: categoryColor }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categoryColor }} />
                  {categoryLabel}
                </span>
              </div>

              <div className="py-3 px-4 bg-surface rounded-xl">
                <p className="text-body text-muted mb-1">{t("submission.description")}</p>
                <p className="text-body text-text">
                  {(description.trim() || transcript.trim() || "—")}
                </p>
              </div>

              {images.length > 0 && (
                <div className="py-3 px-4 bg-surface rounded-xl">
                  <p className="text-body text-muted mb-2">{t("submission.add_photos")} ({images.length})</p>
                  <div className="flex gap-2">
                    {images.map((img, i) => (
                      <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border border-border bg-canvas">
                        <img src={img.uri} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {location && (
                <div className="py-3 px-4 bg-surface rounded-xl">
                  <p className="text-body text-muted mb-1">{t("submission.location")}</p>
                  <p className="text-body text-text">{location.address || `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}</p>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full gap-2"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {submitting ? t("submission.submitting") : t("common.submit")}
            </Button>
          </div>
        )}
      </Card>

      {step < TOTAL_STEPS && (
        <div className="flex mt-4">
          <Button variant="primary" onClick={handleNext} className="gap-2 w-full sm:w-auto sm:ml-auto">
            {t("common.next")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

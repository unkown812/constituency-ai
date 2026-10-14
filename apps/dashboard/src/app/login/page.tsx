"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Phone, ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { Button, Input, Card } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import "../../i18n";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams?.get("role") ?? "citizen";
  const { login, sendOtp } = useAuth();
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    if (!phone.trim()) { setError(t("auth.phone_required")); return; }
    setError("");
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("otp");
    } catch (e: any) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) { setError(t("auth.otp_length")); return; }
    setLoading(true);
    setError("");
    try {
      await login(phone, otp);
      router.push(role === "mp" ? "/dashboard" : "/citizen");
    } catch (e: any) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface grid place-items-center p-4">
      <div className="w-full max-w-sm">
        <Card variant="default" className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push("/")}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-text hover:bg-surface-alt transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full transition-colors ${step === "phone" ? "bg-brand" : "bg-border"}`} />
              <span className={`w-2 h-2 rounded-full transition-colors ${step === "otp" ? "bg-brand" : "bg-border"}`} />
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
              {step === "phone" ? (
                <Phone className="w-5 h-5 text-brand" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-brand" />
              )}
            </div>
            <h1 className="text-heading-lg text-text mb-1.5">
              {step === "phone" ? t("auth.title") : t("auth.verify_title")}
            </h1>
            <p className="text-body text-secondary">
              {step === "phone" ? t("auth.subtitle") : t("auth.verify_subtitle", { phone })}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-error/10 border border-error/20 text-body-sm text-error text-center">
              {error}
            </div>
          )}

          {step === "phone" ? (
            <div className="space-y-5">
              <Input
                label={t("auth.phone_label")}
                type="tel"
                placeholder={t("auth.phone_placeholder")}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                error={!!error}
                className="text-center text-lg"
              />
              <Button onClick={handleSendOtp} disabled={loading} className="w-full gap-2" size="lg">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {loading ? t("common.loading") : t("auth.send_otp")}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <Input
                label={t("auth.otp_placeholder")}
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                error={!!error}
                className="text-center text-2xl tracking-[0.5em] font-mono"
              />
              <Button onClick={handleVerify} disabled={loading} className="w-full gap-2" size="lg">
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {t("auth.verify_otp")}
              </Button>
              <button
                onClick={() => { setStep("phone"); setError(""); }}
                className="w-full text-center text-body-sm text-brand hover:text-brand-active transition-colors cursor-pointer"
              >
                {t("auth.resend_otp")}
              </button>
            </div>
          )}
        </Card>

        <p className="text-center text-caption text-muted mt-6">
          {t("app.name")}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface grid place-items-center">
        <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

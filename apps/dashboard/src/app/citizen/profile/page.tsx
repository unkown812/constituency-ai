"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, LogOut, AlertCircle, Loader2, Check, ChevronDown } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import "../../../i18n";
import { useProfile, useUpdateProfile } from "../../../hooks/useCitizenApi";
import { LANGUAGES } from "../../../types/citizen";
import { Button, Card, Input, Skeleton } from "../../../components/ui";

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const updateProfile = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [language, setLanguage] = useState(i18n.language);
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setLanguage(profile.preferred_language || i18n.language);
      setNotifications(profile.notification_enabled);
    }
  }, [profile, i18n.language]);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        preferred_language: language,
        notification_enabled: notifications,
      });
      if (language !== i18n.language) {
        i18n.changeLanguage(language);
      }
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFullName(profile.full_name);
      setLanguage(profile.preferred_language || i18n.language);
      setNotifications(profile.notification_enabled);
    }
    setEditing(false);
    setError(null);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex flex-col items-center py-8">
          <div className="w-20 h-20 rounded-full bg-surface-alt mb-4" />
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !profile) {
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

  return (
    <div>
      <h1 className="text-heading-lg text-text mb-6">{t("profile.title")}</h1>

      <div className="flex flex-col items-center pb-6">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-brand text-white flex items-center justify-center text-display-md font-medium overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            ) : profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.full_name.charAt(0).toUpperCase()
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center border-2 border-canvas cursor-pointer hover:opacity-90 transition-opacity"
            aria-label={t("profile.edit_avatar")}
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        {editing ? (
          <input
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); setError(null); }}
            className="text-heading-md text-text text-center bg-transparent border-b-2 border-brand focus:outline-none pb-1 mb-1"
            placeholder="Full Name"
          />
        ) : (
          <h2 className="text-heading-md text-text">{profile.full_name}</h2>
        )}
        <p className="text-body text-muted">{profile.constituency_name}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-error/10 border border-error/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-error shrink-0" />
          <span className="text-body text-error">{error}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-success/10 border border-success/20 rounded-xl">
          <Check className="w-4 h-4 text-success shrink-0" />
          <span className="text-body text-success">Profile saved</span>
        </div>
      )}

      <Card variant="default">
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-body text-muted">{t("profile.phone")}</span>
            <span className="text-body text-text font-medium">{profile.phone}</span>
          </div>

          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-body text-muted">{t("profile.constituency")}</span>
            <span className="text-body text-text font-medium">{profile.constituency_name}</span>
          </div>

          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-body text-muted">{t("profile.language")}</span>
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-canvas text-body text-text hover:bg-surface-alt cursor-pointer transition-colors"
              >
                <span>{currentLang.name_native}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted" />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 top-10 bg-canvas border border-border rounded-xl shadow-lg z-50 min-w-[10rem] whitespace-nowrap py-1">
                    {LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-body hover:bg-surface-alt cursor-pointer flex items-center justify-between ${
                          language === l.code ? "text-brand font-medium" : "text-secondary"
                        }`}
                      >
                        <span>{l.name_native}</span>
                        {language === l.code && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-body text-muted">{t("profile.notifications")}</span>
            <button
              onClick={() => setNotifications(!notifications)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer"
              style={{ backgroundColor: notifications ? "var(--color-brand, #6366f1)" : "var(--color-border, #e2e8f0)" }}
              aria-label="Toggle notifications"
            >
              <span
                className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                style={{ transform: notifications ? "translateX(22px)" : "translateX(2px)" }}
              />
            </button>
          </div>
        </div>
      </Card>

      <div className="flex gap-3 mt-6">
        {editing ? (
          <>
            <Button
              variant="secondary"
              onClick={handleCancel}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t("common.save")}
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            onClick={() => setEditing(true)}
            className="flex-1"
          >
            {t("common.save")}
          </Button>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full gap-2"
        >
          <LogOut className="w-4 h-4" />
          {t("auth.logout")}
        </Button>
      </div>
    </div>
  );
}

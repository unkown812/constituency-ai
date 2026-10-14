"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, ListChecks, User, Globe, Bell, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import "../../i18n";
import { LANGUAGES } from "../../types/citizen";
import { Spinner } from "../../components/ui";

const bottomTabs = [
  { name: "home", href: "/citizen", icon: Home, label: "Home" },
  { name: "submissions", href: "/citizen/submissions", icon: ListChecks, label: "Submissions" },
  { name: "profile", href: "/citizen/profile", icon: User, label: "Profile" },
];

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={32} />
          <span className="text-body text-muted">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const closeAll = () => {
    setLangOpen(false);
    setProfileOpen(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-canvas">
      <header
        className="bg-canvas border-b border-border flex items-center justify-between shrink-0 z-50"
        style={{
          paddingTop: "var(--sat, 0px)",
          height: "calc(clamp(3rem, 7vh, 3.5rem) + var(--sat, 0px))",
          paddingInline: "clamp(0.75rem, 3vw, 1.5rem)",
        }}
      >
        <Link href="/citizen" className="text-feature-heading text-text font-400">
          {t("app.name")}
        </Link>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setLangOpen(!langOpen); setProfileOpen(false); }}
              className="w-9 h-9 flex items-center justify-center text-muted hover:text-text transition-colors cursor-pointer"
              aria-label={t("profile.language")}
            >
              <Globe className="w-5 h-5" />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeAll} />
                <div className="absolute right-0 top-10 bg-canvas border border-border z-50 py-1"
                  style={{ width: "clamp(10rem, 40vw, 14rem)" }}>
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-body hover:bg-surface cursor-pointer flex items-center justify-between ${
                        i18n.language === l.code ? "text-text font-medium" : "text-muted"
                      }`}
                    >
                      <span className="truncate">{l.name_native}</span>
                      {i18n.language === l.code && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-text" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            className="w-9 h-9 flex items-center justify-center text-muted hover:text-text relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-error" />
          </button>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); setLangOpen(false); }}
              className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-surface cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-caption font-medium shrink-0">
                {user?.full_name?.charAt(0) || "U"}
              </div>
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeAll} />
                <div className="absolute right-0 top-10 bg-canvas border border-border z-50 py-1"
                  style={{ width: "clamp(10rem, 40vw, 14rem)" }}>
                  <div className="px-4 py-2.5 border-b border-border">
                    <p className="text-body text-text truncate">{user?.full_name}</p>
                    <p className="text-caption text-muted truncate">{user?.constituency_name}</p>
                  </div>
                  <Link
                    href="/citizen/profile"
                    onClick={closeAll}
                    className="block px-4 py-2.5 text-body text-muted hover:bg-surface"
                  >
                    {t("profile.title")}
                  </Link>
                  <button
                    onClick={() => { logout(); closeAll(); }}
                    className="w-full text-left px-4 py-2.5 text-body text-error hover:bg-surface flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {t("auth.logout")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main
        className="flex-1 overflow-y-auto bg-surface/50"
        style={{ paddingBottom: "calc(clamp(3rem, 7vh, 3.5rem) + var(--sab, 0px))" }}
      >
        <div className="fluid-container py-4 md:py-6">
          {children}
        </div>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-canvas border-t border-border flex items-center justify-around z-40"
        style={{
          paddingBottom: "var(--sab, 0px)",
          height: "calc(clamp(3rem, 7vh, 3.5rem) + var(--sab, 0px))",
        }}
      >
        {bottomTabs.map(tab => {
          const isActive = pathname === tab.href || (tab.href !== "/citizen" && (pathname ?? "").startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 transition-colors"
              style={{ flex: "1 1 0px" }}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-text" : "text-muted"}`} />
              <span
                className="font-medium leading-tight truncate max-w-full"
                style={{
                  fontSize: "clamp(9px, 1.8vw, 11px)",
                  color: isActive ? "var(--color-text)" : "var(--color-muted)",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

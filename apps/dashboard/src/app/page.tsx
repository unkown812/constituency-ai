"use client";
import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { MessageSquareCode, BarChart3, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import "../i18n";

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    { icon: MessageSquareCode, title: "Citizen Portal", desc: "Submit issues, track progress, use voice & photo to report problems in your constituency." },
    { icon: BarChart3, title: "MP Dashboard", desc: "AI-powered analytics, GIS heatmaps, project prioritization, and automated reports." },
    { icon: Sparkles, title: "AI-Powered", desc: "Smart transcription, translation, image analysis, and recommendation engine." },
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-text/90 backdrop-blur-md border-b border-white/5 flex items-center">
        <div className="fluid-container flex items-center justify-between">
          <span className="text-heading-sm text-white font-semibold tracking-tight">{t("app.name")}</span>
          <Link
            href="/login"
            className="text-body-sm text-muted hover:text-white transition-colors font-medium"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen bg-text flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12)_0%,transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.06)_0%,transparent_50%)]" />
        <div className="fluid-container relative pt-24 pb-20 md:pb-32 md:pt-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-caption text-brand font-semibold mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Constituency Management
            </div>
            <h1 className="text-display-xl text-white mb-6 leading-[1.05] tracking-tight">
              {t("landing.title")}
            </h1>
            <p className="text-body-lg text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
              {t("landing.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login?role=citizen">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-[15px]">
                  {t("landing.citizen_cta")} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login?role=mp">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2 text-[15px]">
                  {t("landing.mp_cta")} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 md:py-32">
        <div className="fluid-container">
          <div className="text-center mb-16">
            <span className="text-overline text-brand font-semibold tracking-[0.12em]">Platform Features</span>
            <h2 className="text-display-md text-text mt-3 mb-4">
              Everything you need to serve your constituency
            </h2>
            <p className="text-body text-secondary max-w-xl mx-auto">
              From citizen reporting to AI-powered analytics — a unified platform for modern representation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative bg-canvas border border-border rounded-xl p-8 hover:shadow-lg hover:border-brand/20 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center text-brand mb-5 group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-heading-sm text-text mb-2">{f.title}</h3>
                <p className="text-body text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="fluid-container h-14 flex items-center justify-center">
          <p className="text-body-sm text-muted">
            &copy; 2026 {t("app.name")}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

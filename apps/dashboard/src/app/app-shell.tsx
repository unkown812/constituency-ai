"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  BarChart3,
  Map,
  ListChecks,
  TrendingUp,
  MessageSquareCode,
  FileText,
  Bell,
  Menu,
  X,
  User,
  LogOut,
} from "lucide-react";

const navigationItems = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "GIS Maps", href: "/dashboard/map", icon: Map },
  { name: "Priorities", href: "/dashboard/prioritization", icon: ListChecks },
  { name: "Gaps", href: "/dashboard/gaps", icon: TrendingUp },
  { name: "Assistant", href: "/dashboard/assistant", icon: MessageSquareCode },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
];

const bottomNavItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Priorities", href: "/dashboard/prioritization", icon: ListChecks },
  { name: "Assistant", href: "/dashboard/assistant", icon: MessageSquareCode },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
];

type LayoutMode = "sidebar" | "collapsed" | "bottom";

function useLayoutMode(ref: React.RefObject<HTMLElement | null>): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>("sidebar");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        if (w >= 900) setMode("sidebar");
        else if (w >= 640) setMode("collapsed");
        else setMode("bottom");
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return mode;
}

function Sidebar({
  collapsed,
  onToggleCollapse,
  onSignOut,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="bg-brand text-white flex flex-col justify-between shrink-0 overflow-hidden transition-all duration-300 ease-in-out border-r border-white/5"
      style={{ width: collapsed ? "clamp(3.5rem, 8vw, 4.5rem)" : "clamp(14rem, 20vw, 18rem)" }}
    >
      <div>
        <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10" style={{ paddingInline: collapsed ? "0.5rem" : "clamp(1rem, 2vw, 2rem)" }}>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-feature-heading text-white truncate">JanSahayak AI</h1>
              <span className="text-mono-label text-white/40 block truncate">MP Dashboard</span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="shrink-0 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d={collapsed ? "M10 4L6 8l4 4" : "M6 4l4 4-4 4"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="mx-3 mt-4 p-2.5 flex items-center gap-3 overflow-hidden bg-white/5 rounded-sm">
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80"
            alt="MP Avatar"
            className="shrink-0 w-9 h-9 rounded-full object-cover ring-1 ring-white/20"
          />
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <h4 className="text-body font-medium text-white truncate">Rajesh Vaghela</h4>
              <p className="text-caption text-white/50 truncate">Siyani, Gujarat</p>
            </div>
          )}
        </div>

        <nav className="mt-6 px-3 flex flex-col gap-0.5">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 text-caption transition-all duration-150 ${
                  isActive
                    ? "text-white font-medium"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
                title={collapsed ? item.name : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-full" />
                )}
                <item.icon className="shrink-0 w-4 h-4" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-white/10 flex items-center gap-2">
        {!collapsed && (
          <>
            <button className="flex items-center gap-2 px-2.5 py-2 text-caption text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer min-w-0 flex-1">
              <User className="shrink-0 w-4 h-4" />
              <span className="truncate">Profile</span>
            </button>
            <div className="shrink-0 w-px h-4 bg-white/10" />
          </>
        )}
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-2.5 py-2 text-caption text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="shrink-0 w-4 h-4" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

function ShellHeader() {
  return (
    <header className="border-b border-border bg-canvas flex items-center justify-between shrink-0"
      style={{ height: "clamp(3rem, 6vh, 3.5rem)", paddingInline: "clamp(0.75rem, 2vw, 2rem)" }}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-caption text-muted truncate">Constituency Development Planning Platform</span>
        <span className="shrink-0 w-1 h-1 rounded-full bg-muted hidden sm:block" />
        <span className="shrink-0 text-micro text-text bg-surface px-2.5 py-0.5 hidden sm:inline">Active Session</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button className="relative w-9 h-9 flex items-center justify-center text-muted hover:text-text transition-colors cursor-pointer" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-error" />
        </button>
        <div className="h-4 w-px bg-border" />
        <span className="text-caption text-text truncate hidden xs:inline">MP Administration</span>
      </div>
    </header>
  );
}

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-canvas border-t border-border flex items-stretch justify-around shrink-0 z-40"
      style={{ height: "clamp(3.25rem, 7vh, 3.75rem)" }}>
      {bottomNavItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`relative flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-2 transition-colors ${
              isActive ? "text-text" : "text-muted"
            }`}
            style={{ flex: "1 1 0px" }}
          >
            {isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-px bg-text" />
            )}
            <item.icon className={`w-5 h-5`} />
            <span className={`text-micro leading-tight truncate max-w-full`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function FullscreenMenu({ open, onClose, onSignOut }: { open: boolean; onClose: () => void; onSignOut: () => void }) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-brand text-white flex flex-col animate-slide-up">
      <div className="flex items-center justify-between shrink-0 border-b border-white/10"
        style={{ height: "clamp(3rem, 6vh, 3.5rem)", paddingInline: "clamp(0.75rem, 3vw, 1.5rem)" }}>
        <span className="text-feature-heading text-white">Menu</span>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        <div className="flex items-center gap-3 p-3 bg-white/5 mb-5">
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80"
            alt="MP Avatar"
            className="w-10 h-10 rounded-full object-cover ring-1 ring-white/20"
          />
          <div className="min-w-0">
            <h4 className="text-body font-medium text-white truncate">Rajesh Vaghela</h4>
            <p className="text-caption text-white/50 truncate">Siyani, Gujarat (MP)</p>
          </div>
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`group relative flex items-center gap-4 px-4 py-3.5 text-caption transition-all duration-150 ${
                isActive ? "text-white font-medium bg-white/5" : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-full" />
              )}
              <item.icon className="w-5 h-5" />
              {item.name}
              <svg className="w-4 h-4 ml-auto text-white/30" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          );
        })}
        <div className="pt-5 mt-5 border-t border-white/10 flex flex-col gap-1">
          <button className="flex items-center gap-3 text-caption text-white/50 w-full text-left px-4 py-3 cursor-pointer hover:text-white hover:bg-white/5 transition-colors">
            <User className="w-5 h-5" />
            Profile
          </button>
          <button
            onClick={() => { onClose(); onSignOut(); }}
            className="flex items-center gap-3 text-caption text-white/50 w-full text-left px-4 py-3 cursor-pointer hover:text-white/80 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const mode = useLayoutMode(shellRef);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  const showSidebar = mode === "sidebar" || mode === "collapsed";
  const sidebarCollapsed = mode === "collapsed" ? true : !sidebarOpen;

  return (
    <div ref={shellRef} className="flex h-[100dvh] overflow-hidden bg-canvas">
      {showSidebar && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
          onSignOut={handleSignOut}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ShellHeader />

        {mode === "bottom" && (
          <header className="bg-canvas border-b border-border flex items-center shrink-0"
            style={{ height: "clamp(3rem, 6vh, 3.5rem)", paddingInline: "clamp(0.75rem, 3vw, 1rem)" }}>
            <button
              onClick={() => setMenuOpen(true)}
              className="shrink-0 w-9 h-9 flex items-center justify-center text-text hover:bg-surface transition-colors cursor-pointer -ml-1"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-feature-heading text-text ml-2">JanSahayak AI</span>
            <div className="flex-1" />
            <button className="relative w-9 h-9 flex items-center justify-center text-muted hover:text-text transition-colors cursor-pointer" aria-label="Notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-error" />
            </button>
          </header>
        )}

        <main className="flex-1 overflow-y-auto bg-surface/50">
          <div className="fluid-container py-4 md:py-6 lg:py-8">
            {children}
          </div>
        </main>

        {mode === "bottom" && <BottomNav />}
      </div>

      <FullscreenMenu open={menuOpen} onClose={() => setMenuOpen(false)} onSignOut={handleSignOut} />
    </div>
  );
}

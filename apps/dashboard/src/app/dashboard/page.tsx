"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchOverview, fetchAnalytics } from "../../lib/api";
import StatCard from "../../components/StatCard";
import { Card, Badge, Skeleton } from "../../components/ui";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { MessageSquareCode, Activity, AlertTriangle, CheckCircle2, ArrowUpRight, BarChart3, MapPin, FileText } from "lucide-react";

export default function DashboardOverview() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: fetchOverview,
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-3 md:gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 14rem), 1fr))" }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 md:gap-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
        <div className="min-w-0">
          <h1 className="text-section-heading text-text truncate">Welcome back, {overview?.mpName ?? "MP"}</h1>
          <p className="text-body text-muted mt-1 truncate">{overview?.constituencyName}</p>
        </div>
        <span className="text-caption text-muted shrink-0">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
      </div>

      <div className="grid gap-px bg-border" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 14rem), 1fr))" }}>
        <StatCard title="Total Complaints" value={overview?.totalComplaintsThisMonth ?? 0} icon={MessageSquareCode} trend={overview?.totalComplaintsChange} />
        <StatCard title="Active Projects" value={overview?.activeProjects ?? 0} icon={Activity} trend={overview?.activeProjectsChange} />
        <StatCard title="Budget Utilised" value={`₹${overview?.budgetUtilised ?? 0}Cr`} icon={AlertTriangle} trend={overview?.budgetUtilisedPercent} />
        <StatCard title="Top Issue" value={overview?.topIssues?.[0]?.category ?? "N/A"} icon={CheckCircle2} trend={overview?.topIssues?.[0]?.count ?? 0} />
      </div>

      <div className="grid gap-px bg-border" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 24rem), 1fr))" }}>
        <Card variant="default" className="p-6 md:p-8">
          <h2 className="text-feature-heading text-text mb-1">Monthly Trends</h2>
          <p className="text-caption text-muted mb-6">Complaint volume over the last 6 months</p>
          <div style={{ height: "clamp(12rem, 40vh, 18rem)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.trends ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#93939f" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#93939f" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 0, border: "1px solid #d9d9dd", fontSize: 13 }} />
                <Bar dataKey="count" fill="#17171c" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card variant="default" className="p-6 md:p-8">
          <h2 className="text-feature-heading text-text mb-1">Top Issues</h2>
          <p className="text-caption text-muted mb-6">Most reported categories this month</p>
          <div className="flex flex-col gap-px bg-border">
            {overview?.topIssues?.map((issue) => (
              <div key={issue.category} className="flex items-center justify-between py-3 px-3 bg-canvas gap-2">
                <div className="min-w-0">
                  <h4 className="text-body text-text truncate">{issue.category}</h4>
                  <p className="text-caption text-muted">{issue.count} reports</p>
                </div>
                <Badge
                  variant={
                    issue.trend === "up" ? "error" :
                    issue.trend === "down" ? "success" :
                    "default"
                  }
                  size="sm"
                >
                  {issue.trend === "up" ? "\u25B2 Inc" : issue.trend === "down" ? "\u25BC Dec" : "\u25C6 Stb"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card variant="default" className="p-6 md:p-8">
        <h2 className="text-feature-heading text-text mb-1">Quick Actions</h2>
        <p className="text-caption text-muted mb-4">Common tasks to manage your constituency</p>
        <div className="grid gap-px bg-border" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 12rem), 1fr))" }}>
          {[
            { label: "View Analytics", href: "/dashboard/analytics", icon: BarChart3, desc: "Deep-dive into demands" },
            { label: "GIS Maps", href: "/dashboard/map", icon: MapPin, desc: "Visualise demand clusters" },
            { label: "AI Assistant", href: "/dashboard/assistant", icon: BarChart3, desc: "Ask any question" },
            { label: "Generate Report", href: "/dashboard/reports", icon: FileText, desc: "Monthly/Annual reports" },
          ].map(a => (
            <Link key={a.label} href={a.href} className="flex items-center justify-between p-4 bg-canvas hover:bg-surface transition-colors duration-200 group gap-2">
              <div className="min-w-0">
                <h3 className="text-body text-text group-hover:text-blue transition-colors truncate">{a.label}</h3>
                <p className="text-caption text-muted truncate">{a.desc}</p>
              </div>
              <ArrowUpRight className="shrink-0 w-4 h-4 text-muted group-hover:text-blue transition-colors" />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

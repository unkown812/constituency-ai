"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchGaps } from "../../../lib/api";
import { Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../components/ui";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { TrendingUp, AlertOctagon, MapPin } from "lucide-react";

export default function GapsPage() {
  const { data: gapData, isLoading } = useQuery({
    queryKey: ["gaps"],
    queryFn: fetchGaps
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-6 bg-surface-alt w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border">
          <div className="h-80 bg-surface-alt" />
          <div className="h-80 bg-surface-alt" />
        </div>
      </div>
    );
  }

  const radarData = gapData?.gaps.map(g => ({
    facility: g.facilityType,
    Existing: g.currentCount,
    Required: g.requiredCount
  })) || [];

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <div>
        <h1 className="text-section-heading text-text">Infrastructure Gap Analysis</h1>
        <p className="text-body text-muted mt-2">
          Quantifying the deficit between existing facilities and government mandates across administrative wards.
        </p>
      </div>

      <div className="grid gap-px bg-border" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 28rem), 1fr))" }}>
        <Card variant="default" className="p-6 md:p-8">
          <h2 className="text-feature-heading text-text mb-1">Facility Gaps Radar</h2>
          <p className="text-caption text-muted mb-6">Comparing required vs existing installations</p>
          <div style={{ height: "clamp(14rem, 45vh, 20rem)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#d9d9dd" />
                <PolarAngleAxis dataKey="facility" tick={{ fontSize: 10, fill: "#93939f" }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 9 }} />
                <Radar name="Existing" dataKey="Existing" stroke="#ff7759" fill="#ff7759" fillOpacity={0.15} />
                <Radar name="Required" dataKey="Required" stroke="#17171c" fill="#17171c" fillOpacity={0.08} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card variant="default" className="p-6 md:p-8">
          <h2 className="text-feature-heading text-text mb-1">Infrastructure Deficit Chart</h2>
          <p className="text-caption text-muted mb-6">Direct numerical comparison of installation deficits</p>
          <div style={{ height: "clamp(14rem, 45vh, 20rem)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="facility" tick={{ fontSize: 9 }} stroke="#93939f" tickLine={false} />
                <YAxis stroke="#93939f" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Existing" fill="#93939f" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Required" fill="#17171c" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card variant="default">
        <div className="px-6 pt-6 md:px-8 md:pt-8 pb-3">
          <h2 className="text-feature-heading text-text">Underserved Regions Heat-list</h2>
          <p className="text-caption text-muted mt-1">Wards sorted by Deficit Score (0 = Fully Served, 10 = Critical)</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead className="text-center">Deficit Index</TableHead>
              <TableHead>Missing Infrastructures</TableHead>
              <TableHead className="text-center">Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gapData?.underserved.map((u) => (
              <TableRow key={u.villageName}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted shrink-0" />
                    <div>
                      <h4 className="text-body text-text">{u.villageName}</h4>
                      <span className="text-caption text-muted">{u.wardName}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center text-body text-error">
                  {u.deficitScore} / 10
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {u.missingFacilities.map(f => (
                      <Badge key={f} variant="coral" size="sm">{f}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={u.severity === "Critical" ? "error" : u.severity === "High" ? "warning" : "default"}
                    size="sm"
                    className="gap-1"
                  >
                    {u.severity === "Critical" && <AlertOctagon className="w-3 h-3" />}
                    {u.severity}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

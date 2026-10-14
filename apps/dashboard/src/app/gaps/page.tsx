"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchGaps } from "../../lib/api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui";
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
import { motion } from "framer-motion";

export default function GapsPage() {
  const { data: gapData, isLoading } = useQuery({
    queryKey: ["gaps"],
    queryFn: fetchGaps
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 bg-zinc-200 rounded w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-zinc-200 rounded-lg" />
          <div className="h-80 bg-zinc-200 rounded-lg" />
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
      {/* Header */}
      <div>
        <h1 className="text-display-md text-ink">Infrastructure Gap Analysis</h1>
        <p className="text-body-md text-muted mt-2">
          Quantifying the deficit between existing facilities and government mandates across administrative wards.
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-canvas border border-hairline rounded-lg p-6 md:p-8">
          <h2 className="text-title-md text-ink mb-1">Facility Gaps Radar</h2>
          <p className="text-body-md text-muted mb-6">Comparing required vs existing installations</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(0,0,0,0.08)" />
                <PolarAngleAxis dataKey="facility" tick={{ fontSize: 10, fill: "#41454d" }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 9 }} />
                <Radar name="Existing" dataKey="Existing" stroke="#fcab79" fill="#fcab79" fillOpacity={0.25} />
                <Radar name="Required" dataKey="Required" stroke="#181d26" fill="#181d26" fillOpacity={0.1} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 md:p-8">
          <h2 className="text-title-md text-ink mb-1">Infrastructure Deficit Chart</h2>
          <p className="text-body-md text-muted mb-6">Direct numerical comparison of installation deficits</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="facility" tick={{ fontSize: 9 }} stroke="#9297a0" tickLine={false} />
                <YAxis stroke="#9297a0" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Existing" fill="#9297a0" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Required" fill="#181d26" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 md:p-8 flex flex-col gap-4">
        <div>
          <h2 className="text-title-md text-ink">Underserved Regions Heat-list</h2>
          <p className="text-body-md text-muted mt-1">Wards sorted by Deficit Score (0 = Fully Served, 10 = Critical)</p>
        </div>

        <div className="overflow-x-auto -mx-6 md:-mx-8">
          <div className="inline-block min-w-full align-middle px-6 md:px-8">
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
                          <h4 className="text-label-md text-ink">{u.villageName}</h4>
                          <span className="text-body-md text-muted">{u.wardName}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-label-md text-critical">
                      {u.deficitScore} / 10
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {u.missingFacilities.map(f => (
                          <span key={f} className="text-body-md bg-signature-peach/20 text-signature-coral border border-signature-peach/30 font-medium px-2.5 py-0.5 rounded-sm">
                            {f}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center gap-1 text-caption uppercase font-medium px-3 py-1 rounded-sm text-on-primary ${
                        u.severity === "Critical" ? "bg-critical" :
                        u.severity === "High" ? "bg-attention" : "bg-border-strong"
                      }`}>
                        {u.severity === "Critical" && <AlertOctagon className="w-3 h-3" />}
                        {u.severity}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

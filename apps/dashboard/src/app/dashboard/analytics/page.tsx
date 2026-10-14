"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics, fetchGeoJSON } from "../../../lib/api";
import DateRangeFilter from "../../../components/DateRangeFilter";
import ExportButton from "../../../components/ExportButton";
import { Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button, Badge } from "../../../components/ui";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { ArrowUpDown, AlertTriangle } from "lucide-react";

export default function AnalyticsPage() {
  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics
  });

  const { data: geoData } = useQuery({
    queryKey: ["geo"],
    queryFn: fetchGeoJSON
  });

  const [dateRange, setDateRange] = useState("30days");
  const [ward, setWard] = useState("all");
  const [category, setCategory] = useState("all");
  const [sortField, setSortField] = useState<string>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSort = (field: string) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const rawTableData = useMemo(() => {
    if (!geoData?.features) return [];
    return geoData.features.map(f => ({
      id: f.properties.id,
      category: f.properties.category,
      severity: f.properties.severity,
      description: f.properties.description,
      ward: f.properties.ward,
      village: f.properties.village,
      date: f.properties.date
    }));
  }, [geoData]);

  const filteredData = useMemo(() => {
    return rawTableData.filter(item => {
      const matchWard = ward === "all" || item.ward === ward;
      let matchCat = category === "all";
      if (!matchCat) {
        const catMap: Record<string, string> = { "Water": "Water", "Roads": "Roads", "Health": "Health", "Education": "Education", "Sanitation": "Sanitation", "Power": "Power" };
        matchCat = item.category === catMap[category];
      }
      return matchWard && matchCat;
    });
  }, [rawTableData, ward, category]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a: any, b: any) => {
      const valA = a[sortField], valB = b[sortField];
      if (typeof valA === "number" && typeof valB === "number") return sortAsc ? valA - valB : valB - valA;
      return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortField, sortAsc]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const COLORS = ["#17171c", "#ff7759", "#1863dc", "#93939f", "#d9d9dd", "#003c33"];

  return (
    <div className="flex flex-col gap-8 md:gap-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-section-heading text-text">Citizen Demand Analytics</h1>
          <p className="text-body text-muted mt-2">Deep-dive into development requests, category trends, and regional statistics.</p>
        </div>
        <ExportButton label="Download Dataset" filename="citizen_demands" data={filteredData} format="csv" />
      </div>

      <DateRangeFilter
        selectedDateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedWard={ward}
        onWardChange={setWard}
        selectedCategory={category}
        onCategoryChange={setCategory}
      />

      <div className="grid gap-px bg-border" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 28rem), 1fr))" }}>
        <Card variant="default" className="p-6 md:p-8">
          <h2 className="text-feature-heading text-text mb-1">Issue Category Share</h2>
          <p className="text-caption text-muted mb-6">Percentage breakdown of reports by department</p>
          <div className="flex items-center justify-center" style={{ height: "clamp(12rem, 40vh, 18rem)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.categories}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={3}
                  dataKey="count" nameKey="category"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {analytics?.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Demands`, "Volume"]} contentStyle={{ borderRadius: 0, border: "1px solid #d9d9dd", fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card variant="default" className="p-6 md:p-8">
          <h2 className="text-feature-heading text-text mb-1">Monthly Complaint Volume</h2>
          <p className="text-caption text-muted mb-6">Historical growth comparison of received complaints</p>
          <div style={{ height: "clamp(12rem, 40vh, 18rem)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#93939f" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#93939f" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 0, border: "1px solid #d9d9dd", fontSize: 13 }} />
                <Bar dataKey="count" fill="#17171c" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card variant="default" className="p-6 md:p-8 flex flex-col gap-4">
        <div>
          <h2 className="text-feature-heading text-text">Detailed Submissions Register</h2>
          <p className="text-caption text-muted mt-1">Individual complaints matching your current filters ({filteredData.length} records)</p>
        </div>

        <div className="overflow-x-auto -mx-6 md:-mx-8">
          <div className="inline-block min-w-full align-middle px-6 md:px-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort("date")} className="cursor-pointer">
                    <span className="flex items-center gap-1.5">Date <ArrowUpDown className="w-3.5 h-3.5 text-muted" /></span>
                  </TableHead>
                  <TableHead onClick={() => handleSort("category")} className="cursor-pointer">
                    <span className="flex items-center gap-1.5">Category <ArrowUpDown className="w-3.5 h-3.5 text-muted" /></span>
                  </TableHead>
                  <TableHead onClick={() => handleSort("severity")} className="cursor-pointer">
                    <span className="flex items-center gap-1.5">Severity <ArrowUpDown className="w-3.5 h-3.5 text-muted" /></span>
                  </TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-[35%]">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-body text-muted">{item.date}</TableCell>
                      <TableCell>
                        <Badge variant="coral" size="sm">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-caption font-medium ${
                          item.severity === "High" ? "text-error" :
                          item.severity === "Medium" ? "text-warning" : "text-muted"
                        }`}>
                          {item.severity === "High" && <AlertTriangle className="w-3 h-3" />}
                          {item.severity}
                        </span>
                      </TableCell>
                      <TableCell className="text-body text-muted">
                        {item.village} ({item.ward})
                      </TableCell>
                      <TableCell className="text-body text-secondary italic">
                        &ldquo;{item.description}&rdquo;
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted">
                      No demands found matching the active filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <span className="text-caption text-muted">
            Page <strong className="text-text">{currentPage}</strong> of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button variant="ghost" size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

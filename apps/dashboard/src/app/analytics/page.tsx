"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics, fetchGeoJSON } from "../../lib/api";
import DateRangeFilter from "../../components/DateRangeFilter";
import ExportButton from "../../components/ExportButton";
import { Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button } from "../../components/ui";
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
  CartesianGrid,
  Legend
} from "recharts";
import { ArrowUpDown, AlertTriangle, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

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
  const COLORS = ["#181d26", "#fcab79", "#a8d8c4", "#f4d35e", "#d9a441", "#41454d"];

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-display-md text-ink">Citizen Demand Analytics</h1>
          <p className="text-body-md text-muted mt-2">Deep-dive into development requests, category trends, and regional statistics.</p>
        </div>
        <ExportButton label="Download Dataset" filename="citizen_demands" data={filteredData} format="csv" />
      </div>

      {/* Filters */}
      <DateRangeFilter
        selectedDateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedWard={ward}
        onWardChange={setWard}
        selectedCategory={category}
        onCategoryChange={setCategory}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-canvas border border-hairline rounded-lg p-6 md:p-8">
          <h2 className="text-title-md text-ink mb-1">Issue Category Share</h2>
          <p className="text-body-md text-muted mb-6">Percentage breakdown of reports by department</p>
          <div className="h-64 flex items-center justify-center">
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
                <Tooltip formatter={(value) => [`${value} Demands`, "Volume"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 md:p-8">
          <h2 className="text-title-md text-ink mb-1">Monthly Complaint Volume</h2>
          <p className="text-body-md text-muted mb-6">Historical growth comparison of received complaints</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="date" stroke="#9297a0" fontSize={11} tickLine={false} />
                <YAxis stroke="#9297a0" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#181d26" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 md:p-8 flex flex-col gap-4">
        <div>
          <h2 className="text-title-md text-ink">Detailed Submissions Register</h2>
          <p className="text-body-md text-muted mt-1">Individual complaints matching your current filters ({filteredData.length} records)</p>
        </div>

        <div className="overflow-x-auto -mx-6 md:-mx-8">
          <div className="inline-block min-w-full align-middle px-6 md:px-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort("date")} className="cursor-pointer hover:bg-zinc-100">
                    <span className="flex items-center gap-1.5">Date <ArrowUpDown className="w-3.5 h-3.5" /></span>
                  </TableHead>
                  <TableHead onClick={() => handleSort("category")} className="cursor-pointer hover:bg-zinc-100">
                    <span className="flex items-center gap-1.5">Category <ArrowUpDown className="w-3.5 h-3.5" /></span>
                  </TableHead>
                  <TableHead onClick={() => handleSort("severity")} className="cursor-pointer hover:bg-zinc-100">
                    <span className="flex items-center gap-1.5">Severity <ArrowUpDown className="w-3.5 h-3.5" /></span>
                  </TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-[35%]">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-body-md">{item.date}</TableCell>
                      <TableCell>
                        <span className="inline-block px-2.5 py-0.5 rounded-sm text-caption text-on-primary bg-primary">
                          {item.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-caption font-medium ${
                          item.severity === "High" ? "text-critical" :
                          item.severity === "Medium" ? "text-attention" : "text-muted"
                        }`}>
                          {item.severity === "High" && <AlertTriangle className="w-3 h-3" />}
                          {item.severity}
                        </span>
                      </TableCell>
                      <TableCell className="text-body-md text-muted">
                        {item.village} ({item.ward})
                      </TableCell>
                      <TableCell className="text-body-md text-body italic">
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

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-body-md text-muted">
            Page <strong>{currentPage}</strong> of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" className="py-2 px-4 text-body-md"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button variant="secondary" className="py-2 px-4 text-body-md"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

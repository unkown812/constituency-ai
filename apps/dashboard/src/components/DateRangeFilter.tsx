import React from "react";
import { Select, Badge } from "./ui";
import { SlidersHorizontal } from "lucide-react";

interface DateRangeFilterProps {
  selectedDateRange: string;
  onDateRangeChange: (val: string) => void;
  selectedWard: string;
  onWardChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
}

export default function DateRangeFilter({
  selectedDateRange,
  onDateRangeChange,
  selectedWard,
  onWardChange,
  selectedCategory,
  onCategoryChange
}: DateRangeFilterProps) {
  return (
    <div className="border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="w-4 h-4 text-muted" />
        <span className="text-mono-label text-muted">Filters</span>
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[160px]">
          <Select
            label="Time Range"
            value={selectedDateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="w-full"
          >
            <option value="30days">Last 30 Days</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </Select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <Select
            label="Ward / Village"
            value={selectedWard}
            onChange={(e) => onWardChange(e.target.value)}
            className="w-full"
          >
            <option value="all">All Wards & Villages</option>
            <option value="Ward 1">Ward 1 - Bhalgam</option>
            <option value="Ward 2">Ward 2 - Ranpur</option>
            <option value="Ward 3">Ward 3 - Siyani</option>
            <option value="Ward 4">Ward 4 - Muli</option>
          </Select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <Select
            label="Category"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full"
          >
            <option value="all">All Categories</option>
            <option value="Water">Water Supply</option>
            <option value="Roads">Road Repairs</option>
            <option value="Health">Healthcare Services</option>
            <option value="Education">Education</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Power">Electricity</option>
          </Select>
        </div>
        <div className="hidden md:flex items-end pb-2.5 ml-auto">
          <span className="text-caption text-muted">Filters update in real-time</span>
        </div>
      </div>
    </div>
  );
}

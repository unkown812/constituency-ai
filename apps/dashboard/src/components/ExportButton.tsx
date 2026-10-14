"use client";
import React, { useState } from "react";
import { Button, Spinner } from "./ui";
import { Download, Check } from "lucide-react";

interface ExportButtonProps {
  label?: string;
  filename?: string;
  data?: any;
  format?: "csv" | "pdf";
}

export default function ExportButton({
  label = "Export",
  filename = "constituency_data",
  data,
  format = "csv"
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setSuccess(true);

      const fileData = data ? JSON.stringify(data, null, 2) : "Dummy constituency export file content.";
      const blob = new Blob([fileData], { type: format === "csv" ? "text/csv" : "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setTimeout(() => setSuccess(false), 2000);
    }, 1200);
  };

  return (
    <Button
      variant="primary"
      onClick={handleExport}
      loading={exporting}
      className="gap-2 shrink-0"
    >
      {exporting ? (
        <span className="flex items-center gap-1.5">
          <Spinner size={16} className="text-white" />
          Exporting...
        </span>
      ) : success ? (
        <span className="flex items-center gap-1.5 text-white/70">
          <Check className="w-4 h-4" />
          Ready
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <Download className="w-4 h-4" />
          {label}
        </span>
      )}
    </Button>
  );
}

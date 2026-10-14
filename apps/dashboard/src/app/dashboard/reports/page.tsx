"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOverview, fetchProjects, fetchGaps } from "../../../lib/api";
import { Card, Button, Badge } from "../../../components/ui";
import ExportButton from "../../../components/ExportButton";
import { FileText, Sparkles, AlertCircle, FileCheck, CheckCircle2 } from "lucide-react";

export default function ReportsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState("monthly");

  const { data: overview } = useQuery({ queryKey: ["overview"], queryFn: fetchOverview });
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const { data: gaps } = useQuery({ queryKey: ["gaps"], queryFn: fetchGaps });

  const reportNarrative = selectedTemplate === "monthly" ? {
    title: `Monthly Constituency Development Report - July 2026`,
    subtitle: `Prepared for MP ${overview?.mpName} | Constituency: ${overview?.constituencyName}`,
    executiveSummary: `This monthly report outlines the development priorities, citizen demands, and budget status of ${overview?.constituencyName} for July 2026. A total of ${overview?.totalComplaintsThisMonth} complaints were received, marking a 14.2% increase compared to last month. Active projects under execution stand at ${overview?.activeProjects}.`,
    budgetBreakdown: `Of the ₹5.00 Crore annual MPLADS fund allocation, ₹${overview?.budgetUtilised} Crore (85.0%) has been effectively utilised to date. The remaining ₹0.75 Crore is reserved for upcoming high-impact priority projects.`,
    priorityProjects: projects?.slice(0, 3).map((p, i) => ({
      name: p.projectName,
      score: p.priorityScore,
      cost: p.estimatedCost,
      justification: p.explainableAI
    })) || [],
    infrastructureSummary: `Infrastructure gap analysis indicates critical deficits in rural wards, particularly Ward 3 (Siyani) and Ward 1 (Bhalgam), with highest water availability deficits. It is highly recommended to allocate immediate funds to resolve the Siyani water pipeline gap.`
  } : {
    title: `Annual Development Review & Fund Audit - 2026`,
    subtitle: `Prepared for MP ${overview?.mpName} | Constituency: ${overview?.constituencyName}`,
    executiveSummary: `This annual review presents a comprehensive evaluation of development achievements, citizen satisfaction levels, and overall fund allocation efficiency across ${overview?.constituencyName}. Over the past 12 months, our intake platform logged over 14,000 public submissions, resolving 82% of key infrastructure issues.`,
    budgetBreakdown: `The annual MPLADS budget of ₹5.00 Crores was deployed across 34 active projects, resulting in an outstanding utilisation rate of 85.0%. Direct beneficiary counts are estimated at over 43,000 residents across 4 wards.`,
    priorityProjects: projects?.map((p) => ({
      name: p.projectName,
      score: p.priorityScore,
      cost: p.estimatedCost,
      justification: p.explainableAI
    })) || [],
    infrastructureSummary: `Over the year, primary facility deficits were successfully reduced by 18% in road networks and 24% in school toilet upgrades. Deficit scores in Ward 4 (Muli) decreased from 8.2 to 7.2. Water purification stations remain the primary target for the next planning cycle.`
  };

  return (
    <div className="flex flex-col gap-8 md:gap-10 max-w-5xl">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-section-heading text-text">Development Reports</h1>
          <p className="text-body text-muted mt-2">
            Generate printable, AI-compiled summary reviews for MPLADS funding reviews.
          </p>
        </div>
        <ExportButton
          label="Download PDF Report"
          filename={selectedTemplate === "monthly" ? "monthly_constituency_report" : "annual_development_review"}
          data={reportNarrative}
          format="pdf"
        />
      </div>

      <div className="grid gap-px bg-border" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 16rem), 1fr))" }}>
        <div>
          <Card variant="default" className="p-5 flex flex-col gap-4">
            <span className="text-mono-label text-muted block">
              Report Templates
            </span>
            <div className="flex flex-col gap-2">
              <Button
                variant={selectedTemplate === "monthly" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setSelectedTemplate("monthly")}
                className="w-full justify-start"
              >
                Monthly Development
              </Button>
              <Button
                variant={selectedTemplate === "annual" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setSelectedTemplate("annual")}
                className="w-full justify-start"
              >
                Annual Review & Audit
              </Button>
            </div>
          </Card>
        </div>

        <div style={{ minWidth: "min(100%, 30rem)" }}>
          <Card variant="default" className="p-8 md:p-10 min-h-[600px] flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b border-border pb-6">
                <div className="flex justify-between items-start">
                  <Badge variant="blue" size="sm">
                    AI-Generated Narrative
                  </Badge>
                  <span className="text-caption text-muted">{new Date().toLocaleDateString()}</span>
                </div>
                <h1 className="text-card-heading text-text mt-3">{reportNarrative.title}</h1>
                <p className="text-body text-muted mt-1">{reportNarrative.subtitle}</p>
              </div>

              <div className="space-y-5 text-body text-text leading-relaxed">
                <div>
                  <h3 className="text-body text-text mb-1.5 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-blue" />
                    1. Executive Summary
                  </h3>
                  <p className="italic bg-surface p-3 border border-border text-body">
                    {reportNarrative.executiveSummary}
                  </p>
                </div>

                <div>
                  <h3 className="text-body text-text mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue" />
                    2. Budget Utilization Status
                  </h3>
                  <p className="text-body">{reportNarrative.budgetBreakdown}</p>
                </div>

                <div>
                  <h3 className="text-body text-text mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue" />
                    3. Key AI Recommended Interventions
                  </h3>
                  <div className="space-y-3">
                    {reportNarrative.priorityProjects.map((p, pIdx) => (
                      <div key={p.name} className="p-3.5 bg-surface border border-border space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-body text-text">#{pIdx + 1} - {p.name}</span>
                          <span className="text-body font-medium text-blue">{p.cost}</span>
                        </div>
                        <p className="text-body text-muted italic">&ldquo;{p.justification}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-body text-text mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-blue" />
                    4. Regional Infrastructure Gaps Conclusion
                  </h3>
                  <p className="text-body">{reportNarrative.infrastructureSummary}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6 mt-8 flex justify-between items-center text-caption text-muted">
              <span>JanSahayak AI Development Support Engine</span>
              <span>Page 1 of 1</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

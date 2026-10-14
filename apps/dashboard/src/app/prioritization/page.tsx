"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProjects } from "../../lib/api";
import { Card, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog, Select, Input } from "../../components/ui";
import ExportButton from "../../components/ExportButton";
import { ListChecks, AlertCircle, Eye, SlidersHorizontal, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function PrioritizationPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects
  });

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [maxCost, setMaxCost] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState("all");
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => {
      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchUrgency = selectedUrgency === "all" || p.urgency === selectedUrgency;
      let matchCost = true;
      if (maxCost) {
        const parsedCost = parseInt(p.estimatedCost.replace(/[^0-9]/g, ""), 10);
        const filterVal = parseFloat(maxCost) * 100000;
        matchCost = parsedCost <= filterVal;
      }
      return matchCat && matchUrgency && matchCost;
    });
  }, [projects, selectedCategory, maxCost, selectedUrgency]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 bg-zinc-200 rounded w-1/3" />
        <div className="h-20 bg-zinc-200 rounded-lg" />
        <div className="h-96 bg-zinc-200 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-display-md text-ink">AI Project Prioritisation</h1>
          <p className="text-body-md text-muted mt-2">
            Ranked development recommendations calculated via Demographics, Service Deficits, and Public Feedback.
          </p>
        </div>
        <ExportButton label="Export Plan" filename="prioritised_development_plan" data={filteredProjects} format="pdf" />
      </div>

      {/* Filters */}
      <div className="bg-canvas border border-hairline rounded-md p-4 md:p-6 flex flex-col gap-4">
        <h3 className="text-caption text-muted uppercase tracking-wider flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4" />
          Filter Proposals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-body-md text-ink">Category</label>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Road Repairs">Road Repairs</option>
              <option value="Healthcare Services">Healthcare Services</option>
              <option value="Education">Education</option>
              <option value="Sanitation">Sanitation</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-body-md text-ink">Max Budget (in Lakhs ₹)</label>
            <Input type="number" placeholder="e.g. 50" value={maxCost}
              onChange={(e) => setMaxCost(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-body-md text-ink">Urgency Class</label>
            <Select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
            >
              <option value="all">All Urgency</option>
              <option value="Immediate">Immediate Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Long-term">Long-term Priority</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-canvas border border-hairline rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">Rank</TableHead>
                <TableHead className="w-16 text-center">Score</TableHead>
                <TableHead>Project Proposal</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead className="w-28 text-center">Explain</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((p, idx) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-center text-title-md text-muted">#{idx + 1}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-2.5 py-1 rounded-sm font-medium text-caption text-on-primary bg-primary">
                        {p.priorityScore}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <h4 className="text-label-md text-ink hover:underline cursor-pointer"
                          onClick={() => setSelectedProject(p)}>
                          {p.projectName}
                        </h4>
                        <div className="flex gap-2 items-center mt-1.5">
                          <span className="bg-surface-soft px-2 py-0.5 rounded-sm text-body-md text-muted">
                            {p.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-sm text-caption text-on-primary ${
                            p.urgency === "Immediate" ? "bg-critical" :
                            p.urgency === "Medium" ? "bg-attention" : "bg-border-strong"
                          }`}>
                            {p.urgency}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-label-md text-ink">{p.estimatedCost}</TableCell>
                    <TableCell className="text-body-md text-muted">
                      {p.affectedPopulation.toLocaleString()} citizens
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="secondary" onClick={() => setSelectedProject(p)}
                        className="px-3 py-1.5 text-body-md inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Explain
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted">
                    No projects matching the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* AI Explanation Dialog */}
      <Dialog
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title="Explainable AI: Justification Analysis"
      >
        {selectedProject && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-title-md text-ink">{selectedProject.projectName}</h3>
                <span className="inline-block mt-1.5 bg-primary/10 text-primary text-caption font-medium px-2 py-0.5 rounded-sm">
                  Priority Score: {selectedProject.priorityScore} / 100
                </span>
              </div>
              <div className="text-right">
                <span className="block text-label-md text-ink">{selectedProject.estimatedCost}</span>
                <span className="text-body-md text-muted">Estimated Cost</span>
              </div>
            </div>

            <div className="h-px bg-hairline" />

            <div className="bg-surface-soft border border-hairline rounded-md p-4 flex gap-3 items-start">
              <Sparkles className="w-5 h-5 text-link shrink-0 mt-0.5" />
              <div>
                <h4 className="text-caption text-link uppercase tracking-wider mb-1">
                  AI Justification
                </h4>
                <p className="text-body-md text-body leading-relaxed italic">
                  &ldquo;{selectedProject.explainableAI}&rdquo;
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-3 bg-surface-soft rounded-md">
                <span className="text-body-md text-muted uppercase block">Deficit Score</span>
                <span className="text-label-md text-ink">{selectedProject.infrastructureDeficitScore} / 10</span>
              </div>
              <div className="p-3 bg-surface-soft rounded-md">
                <span className="text-body-md text-muted uppercase block">Beneficiaries</span>
                <span className="text-label-md text-ink">{selectedProject.affectedPopulation.toLocaleString()} residents</span>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProjects } from "../../../lib/api";
import { Card, Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog, Select, Input } from "../../../components/ui";
import ExportButton from "../../../components/ExportButton";
import { Eye, SlidersHorizontal, Sparkles } from "lucide-react";

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
        <div className="h-6 bg-surface-alt w-1/3" />
        <div className="h-16 bg-surface-alt" />
        <div className="h-80 bg-surface-alt" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-section-heading text-text">AI Project Prioritisation</h1>
          <p className="text-body text-muted mt-2">
            Ranked development recommendations calculated via Demographics, Service Deficits, and Public Feedback.
          </p>
        </div>
        <ExportButton label="Export Plan" filename="prioritised_development_plan" data={filteredProjects} format="pdf" />
      </div>

      <Card variant="default" className="p-6 flex flex-col gap-4">
        <h3 className="text-mono-label text-muted flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4" />
          Filter Proposals
        </h3>
        <div className="grid gap-3 md:gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 14rem), 1fr))" }}>
          <Select
            label="Category"
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
          <Input
            label="Max Budget (in Lakhs ₹)"
            type="number"
            placeholder="e.g. 50"
            value={maxCost}
            onChange={(e) => setMaxCost(e.target.value)}
          />
          <Select
            label="Urgency Class"
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
          >
            <option value="all">All Urgency</option>
            <option value="Immediate">Immediate Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Long-term">Long-term Priority</option>
          </Select>
        </div>
      </Card>

      <Card variant="default">
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
                  <TableCell className="text-center text-feature-heading text-muted">#{idx + 1}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="brand" size="sm">{p.priorityScore}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <h4 className="text-body text-text hover:text-blue cursor-pointer"
                        onClick={() => setSelectedProject(p)}>
                        {p.projectName}
                      </h4>
                      <div className="flex gap-2 items-center mt-1.5">
                        <Badge variant="default" size="sm">{p.category}</Badge>
                        <Badge
                          variant={p.urgency === "Immediate" ? "error" : p.urgency === "Medium" ? "warning" : "default"}
                          size="sm"
                        >
                          {p.urgency}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-body text-text">{p.estimatedCost}</TableCell>
                  <TableCell className="text-body text-muted">
                    {p.affectedPopulation.toLocaleString()} citizens
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedProject(p)}>
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
      </Card>

      <Dialog
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title="Explainable AI: Justification Analysis"
      >
        {selectedProject && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-feature-heading text-text">{selectedProject.projectName}</h3>
                <Badge variant="coral" size="sm" className="mt-1.5">
                  Priority Score: {selectedProject.priorityScore} / 100
                </Badge>
              </div>
              <div className="text-right">
                <span className="block text-body text-text">{selectedProject.estimatedCost}</span>
                <span className="text-caption text-muted">Estimated Cost</span>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="bg-surface border border-border p-4 flex gap-3 items-start">
              <Sparkles className="w-5 h-5 text-blue shrink-0 mt-0.5" />
              <div>
                <h4 className="text-mono-label text-blue mb-1">
                  AI Justification
                </h4>
                <p className="text-body text-text leading-relaxed italic">
                  &ldquo;{selectedProject.explainableAI}&rdquo;
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-3 bg-surface">
                <span className="text-caption text-muted uppercase block">Deficit Score</span>
                <span className="text-body text-text">{selectedProject.infrastructureDeficitScore} / 10</span>
              </div>
              <div className="p-3 bg-surface">
                <span className="text-caption text-muted uppercase block">Beneficiaries</span>
                <span className="text-body text-text">{selectedProject.affectedPopulation.toLocaleString()} residents</span>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

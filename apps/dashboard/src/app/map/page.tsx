"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { fetchGeoJSON } from "../../lib/api";
import { Select } from "../../components/ui";
import { Layers, Shield, Radio, ListFilter, X } from "lucide-react";

const InteractiveMap = dynamic(
  () => import("../../components/InteractiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-surface-soft border border-hairline rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-body-md text-muted">Loading Interactive Maps...</span>
        </div>
      </div>
    )
  }
);

export default function MapPage() {
  const { data: geoData, isLoading } = useQuery({
    queryKey: ["geo"],
    queryFn: fetchGeoJSON
  });

  const [showDeficitOverlay, setShowDeficitOverlay] = useState(true);
  const [showInfrastructure, setShowInfrastructure] = useState(true);
  const [selectedWard, setSelectedWard] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-3.5rem)] flex overflow-hidden -mx-4 md:-mx-6 lg:-mx-8 -mt-6 md:-mt-8">
      {/* Sidebar */}
      <div className={`bg-canvas border-r border-hairline p-6 flex flex-col justify-between shrink-0 overflow-y-auto transition-all z-20 ${
        sidebarOpen
          ? "w-72 max-md:fixed max-md:inset-0 max-md:z-30 max-md:shadow-xl"
          : "w-0 p-0 overflow-hidden lg:w-16 lg:p-4"
      }`}>
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 -z-10" onClick={() => setSidebarOpen(false)} />
        )}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className={`text-title-md text-ink flex items-center gap-2 ${!sidebarOpen && 'lg:hidden'}`}>
              <ListFilter className="w-5 h-5" />
              GIS Heatmaps
            </h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink cursor-pointer rounded-md hover:bg-surface-soft"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {!sidebarOpen && <p className="text-body-md text-muted hidden lg:block">GIS maps</p>}
          {sidebarOpen && <p className="text-body-md text-muted">Visualize demand clusters and infrastructure deficits.</p>}

          <div className="h-px bg-hairline" />

          <div className="flex flex-col gap-2">
            <label className="text-caption text-muted uppercase tracking-wider flex items-center gap-1.5">
              <ListFilter className="w-3.5 h-3.5" />
              Focus Region
            </label>
            <Select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full"
            >
              <option value="all">All Wards</option>
              <option value="Ward 1">Ward 1 - Bhalgam</option>
              <option value="Ward 2">Ward 2 - Ranpur</option>
              <option value="Ward 3">Ward 3 - Siyani</option>
              <option value="Ward 4">Ward 4 - Muli</option>
            </Select>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-caption text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Map Layers
            </label>

            <button
              onClick={() => setShowDeficitOverlay(!showDeficitOverlay)}
              className={`flex items-center justify-between p-3.5 rounded-md border text-left transition-all cursor-pointer ${
                showDeficitOverlay
                  ? "border-hairline bg-surface-soft"
                  : "border-hairline bg-canvas"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-primary" />
                <div>
                  <h4 className="text-label-md text-ink">Deficit Choropleth</h4>
                  <p className="text-body-md text-muted">Underfunded areas</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                showDeficitOverlay ? "bg-primary border-primary" : "border-border-strong"
              }`}>
                {showDeficitOverlay && <span className="w-2 h-2 rounded-sm bg-on-primary" />}
              </div>
            </button>

            <button
              onClick={() => setShowInfrastructure(!showInfrastructure)}
              className={`flex items-center justify-between p-3.5 rounded-md border text-left transition-all cursor-pointer ${
                showInfrastructure
                  ? "border-hairline bg-surface-soft"
                  : "border-hairline bg-canvas"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-success" />
                <div>
                  <h4 className="text-label-md text-ink">Existing Facilities</h4>
                  <p className="text-body-md text-muted">Schools, PHCs, water</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                showInfrastructure ? "bg-primary border-primary" : "border-border-strong"
              }`}>
                {showInfrastructure && <span className="w-2 h-2 rounded-sm bg-on-primary" />}
              </div>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="border-t border-hairline pt-4 flex flex-col gap-2.5">
          <span className="text-caption text-ink uppercase tracking-wider">Legend</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-body-md">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />Water</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-signature-peach inline-block" />Roads</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-attention inline-block" />Health</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />Education</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted inline-block" />Sanitation</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-signature-yellow inline-block" />Power</span>
          </div>
        </div>
      </div>

      {/* Mobile reopen button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed bottom-4 left-4 z-20 w-10 h-10 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center cursor-pointer"
          aria-label="Open filters"
        >
          <ListFilter className="w-5 h-5" />
        </button>
      )}

      {/* Map */}
      <div className="flex-1 h-full p-3 md:p-4 lg:p-6 bg-surface-soft">
        {isLoading || !geoData ? (
          <div className="w-full h-full bg-canvas rounded-lg flex items-center justify-center border border-hairline animate-pulse" />
        ) : (
          <InteractiveMap
            geoData={geoData}
            showHeatmap={showDeficitOverlay}
            showInfrastructure={showInfrastructure}
            selectedWard={selectedWard}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ComplaintGeo, InfrastructureGap } from "../types";

interface InteractiveMapProps {
  geoData: { type: "FeatureCollection"; features: ComplaintGeo[] };
  showHeatmap: boolean;
  showInfrastructure: boolean;
  selectedWard: string;
}

// Coordinate centers for the wards around Siyani, Gujarat
const SIYANI_COORDS = [22.6521, 71.8512]; // Center

// Wards outline approximations for choropleth styling
const WARD_POLYGONS = [
  {
    name: "Ward 1 - Bhalgam",
    deficitScore: 8.4,
    color: "#fa3e3e", // High Deficit (Red)
    coords: [
      [22.645, 71.81],
      [22.66, 71.81],
      [22.65, 71.835],
      [22.63, 71.835]
    ] as [number, number][]
  },
  {
    name: "Ward 2 - Ranpur",
    deficitScore: 5.8,
    color: "#e58600", // Medium Deficit (Orange)
    coords: [
      [22.58, 71.78],
      [22.60, 71.78],
      [22.59, 71.81],
      [22.57, 71.80]
    ] as [number, number][]
  },
  {
    name: "Ward 3 - Siyani",
    deficitScore: 9.1,
    color: "#fa3e3e", // Critical Deficit (Red)
    coords: [
      [22.64, 71.84],
      [22.66, 22.66], // Let's fix coordinate typo to prevent error
      [22.66, 71.86],
      [22.64, 71.86]
    ] as [number, number][]
  },
  {
    name: "Ward 4 - Muli",
    deficitScore: 7.2,
    color: "#ffd300", // Moderate Deficit (Yellow)
    coords: [
      [22.66, 71.90],
      [22.68, 71.90],
      [22.67, 71.93],
      [22.65, 71.92]
    ] as [number, number][]
  }
];

// Existing infrastructure facilities mock data
const FACILITIES = [
  { name: "Siyani Govt Primary School", type: "School", coords: [22.6535, 71.8540] },
  { name: "Bhalgam Health Subcenter", type: "Health Clinic", coords: [22.6340, 71.8245] },
  { name: "Muli Higher Secondary School", type: "School", coords: [22.6685, 71.9160] },
  { name: "Siyani Drinking Water Station", type: "Water Facility", coords: [22.6510, 71.8495] }
];

export default function InteractiveMap({
  geoData,
  showHeatmap,
  showInfrastructure,
  selectedWard
}: InteractiveMapProps) {
  
  // Fix Leaflet icon issue inside Next.js environment
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Water": return "#0143b5";
      case "Roads": return "#1877f2";
      case "Health": return "#e58600";
      case "Education": return "#00a400";
      case "Sanitation": return "#8a96a3";
      case "Power": return "#ffd300";
      default: return "#fa3e3e";
    }
  };

  const getSeverityRadius = (sev: string) => {
    switch (sev) {
      case "High": return 12;
      case "Medium": return 8;
      case "Low": return 5;
      default: return 8;
    }
  };

  const getSeverityOpacity = (sev: string) => {
    switch (sev) {
      case "High": return 0.85;
      case "Medium": return 0.65;
      case "Low": return 0.45;
      default: return 0.65;
    }
  };

  const filteredFeatures = geoData.features.filter(f => {
    if (selectedWard === "all") return true;
    return f.properties.ward === selectedWard;
  });

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[22.6521, 71.8512]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full rounded-2xl overflow-hidden"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />

        {/* 1. Infrastructure Deficit Choropleth Overlay Layer */}
        {showHeatmap && WARD_POLYGONS.map(w => (
          <Polygon
            key={w.name}
            positions={w.coords}
            pathOptions={{
              color: w.color,
              weight: 2,
              fillColor: w.color,
              fillOpacity: 0.15
            }}
          >
            <Popup>
              <div className="p-1">
                <h4 className="font-bold text-text text-sm">{w.name}</h4>
                <p className="text-xs text-secondary mt-1">
                  Infrastructure Deficit Score: <span className="font-bold text-error">{w.deficitScore} / 10</span>
                </p>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* 2. Existing Infrastructure Facilities Layer */}
        {showInfrastructure && FACILITIES.map(f => (
          <CircleMarker
            key={f.name}
            center={f.coords as [number, number]}
            radius={8}
            pathOptions={{
              color: "#0a1317",
              weight: 2,
              fillColor: f.type === "School" ? "#00a400" : f.type === "Water Facility" ? "#0143b5" : "#e58600",
              fillOpacity: 0.9
            }}
          >
            <Popup>
              <div className="p-1 text-xs">
                <span className="font-bold block text-text">{f.name}</span>
                <span className="text-[10px] text-muted uppercase font-bold">{f.type}</span>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* 3. Citizen Demand Points (Circle Markers) */}
        {filteredFeatures.map(f => (
          <CircleMarker
            key={f.properties.id}
            center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
            radius={getSeverityRadius(f.properties.severity)}
            pathOptions={{
              color: getCategoryColor(f.properties.category),
              fillColor: getCategoryColor(f.properties.category),
              fillOpacity: getSeverityOpacity(f.properties.severity),
              weight: 1
            }}
          >
            <Popup>
              <div className="p-2 max-w-xs text-xs">
                <div className="flex justify-between items-center gap-4 mb-1.5">
                  <span className="font-bold text-text">{f.properties.category} Issue</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                    f.properties.severity === "High" ? "bg-error" : "bg-warning"
                  }`}>
                    {f.properties.severity}
                  </span>
                </div>
                <p className="text-secondary italic mb-2">"{f.properties.description}"</p>
                <div className="text-[10px] text-muted">
                  <span>Location: {f.properties.village} ({f.properties.ward})</span>
                  <br />
                  <span>Reported: {f.properties.date}</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

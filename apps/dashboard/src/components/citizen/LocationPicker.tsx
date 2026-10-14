"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { cn, Button } from "../ui";

interface LocationPickerProps {
  onLocationChange: (loc: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  defaultCenter?: [number, number];
  className?: string;
}

function DraggableMarker({
  position,
  onMove,
}: {
  position: L.LatLng;
  onMove: (latlng: L.LatLng) => void;
}) {
  const markerRef = React.useRef<L.Marker>(null);

  useMapEvents({
    click(e) {
      onMove(e.latlng);
    },
  });

  return (
    <Marker
      ref={markerRef}
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: () => {
          const marker = markerRef.current;
          if (marker) onMove(marker.getLatLng());
        },
      }}
    />
  );
}

function MapCenterUpdater({ center }: { center: L.LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

const DEFAULT_CENTER = L.latLng(22.6521, 71.8512);

export function LocationPicker({
  onLocationChange,
  defaultCenter,
  className,
}: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng>(
    defaultCenter ? L.latLng(defaultCenter[0], defaultCenter[1]) : DEFAULT_CENTER
  );
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);

  const handleMove = useCallback(
    async (latlng: L.LatLng) => {
      setPosition(latlng);
      setLoading(true);
      setError(null);
      const addr = await reverseGeocode(latlng.lat, latlng.lng);
      setAddress(addr);
      setLoading(false);
      onLocationChange({
        latitude: latlng.lat,
        longitude: latlng.lng,
        address: addr,
      });
    },
    [onLocationChange]
  );

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
        setPosition(latlng);
        const addr = await reverseGeocode(latlng.lat, latlng.lng);
        setAddress(addr);
        setLocating(false);
        onLocationChange({
          latitude: latlng.lat,
          longitude: latlng.lng,
          address: addr,
        });
      },
      () => {
        setLocating(false);
        setError("Could not get your location. Please drag the marker instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationChange]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="h-48 md:h-56 rounded-xl overflow-hidden border border-border">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker position={position} onMove={handleMove} />
          <MapCenterUpdater center={position} />
        </MapContainer>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted shrink-0" />
            {loading ? (
              <span className="text-body text-secondary italic">
                Looking up address...
              </span>
            ) : address ? (
              <span className="text-body text-text truncate">{address}</span>
            ) : (
              <span className="text-body text-secondary italic">
                Drag the marker or tap the map to select location
              </span>
            )}
          </div>
          <p className="text-caption text-secondary mt-0.5">
            {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="shrink-0 gap-1.5 !px-4 !py-2"
        >
          {locating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          <span className="text-body">
            {locating ? "Locating..." : "Current"}
          </span>
        </Button>
      </div>

      {error && (
        <p className="text-body text-error flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

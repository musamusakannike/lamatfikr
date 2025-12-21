"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { Modal, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface PickedLocation {
  lat: number;
  lng: number;
  label?: string;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
  initialLocation?: PickedLocation;
  title?: string;
  className?: string;
}

function ClickToPick({ onPick }: { onPick: (pos: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function LocationPickerBody({
  onClose,
  onConfirm,
  initialLocation,
  className,
}: {
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
  initialLocation?: PickedLocation;
  className?: string;
}) {
  const [picked, setPicked] = useState<PickedLocation | null>(initialLocation || null);
  const [label, setLabel] = useState(initialLocation?.label || "");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    // Fix Leaflet default marker icons for bundlers
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x.src,
      iconUrl: markerIcon.src,
      shadowUrl: markerShadow.src,
    });
  }, []);

  const center = useMemo<[number, number]>(() => {
    if (picked) return [picked.lat, picked.lng];
    // Default: Riyadh-ish as a reasonable fallback for MENA audience
    return [24.7136, 46.6753];
  }, [picked]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPicked({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: label || undefined });
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.message || "Failed to get current location");
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const handleConfirm = () => {
    if (!picked) return;
    onConfirm({ ...picked, label: label.trim() || undefined });
    onClose();
  };

  return (
    <div className={cn("p-4 space-y-3", className)}>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex-1">
          <label className="block text-sm font-medium text-(--text) mb-1">Label (optional)</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-lg text-sm",
              "bg-(--bg) border border-(--border)",
              "outline-none focus:ring-2 focus:ring-primary-500"
            )}
            placeholder="e.g. Home, Office"
          />
        </div>
        <div className="flex gap-2 sm:self-end">
          <Button variant="outline" onClick={handleUseCurrentLocation} disabled={geoLoading}>
            {geoLoading ? "Locating..." : "Use current"}
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!picked}>
            Send
          </Button>
        </div>
      </div>

      {geoError && (
        <div className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">{geoError}</p>
        </div>
      )}

      <div className="h-[380px] rounded-xl overflow-hidden border border-(--border)">
        <MapContainer center={center} zoom={picked ? 15 : 6} scrollWheelZoom={true} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPick onPick={({ lat, lng }) => setPicked({ lat, lng, label: label.trim() || undefined })} />
          {picked && <Marker position={[picked.lat, picked.lng]} />}
        </MapContainer>
      </div>

      {picked && (
        <p className="text-xs text-(--text-muted)">
          Selected: {picked.lat.toFixed(6)}, {picked.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}

export function LocationPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialLocation,
  title = "Pick location",
  className,
}: LocationPickerModalProps) {
  const [instanceKey, setInstanceKey] = useState(0);

  const handleClose = () => {
    setInstanceKey((k) => k + 1);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      <LocationPickerBody
        key={instanceKey}
        onClose={handleClose}
        onConfirm={onConfirm}
        initialLocation={initialLocation}
        className={className}
      />
    </Modal>
  );
}

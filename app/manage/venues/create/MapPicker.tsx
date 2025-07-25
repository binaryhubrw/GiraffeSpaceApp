"use client"

import { useCallback, useEffect, useState } from "react";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationSelect = () => {},
}: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    latitude !== undefined && longitude !== undefined
      ? { lat: latitude, lng: longitude }
      : { lat: -1.9441, lng: 30.0619 }
  );
  const [center, setCenter] = useState<{ lat: number; lng: number }>(
    latitude !== undefined && longitude !== undefined
      ? { lat: latitude, lng: longitude }
      : { lat: -1.9441, lng: 30.0619 }
  );

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      setCenter({ lat: latitude, lng: longitude });
      setMarker({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarker({ lat, lng });
        setCenter({ lat, lng });
        onLocationSelect({ lat, lng });
      }
    },
    [onLocationSelect]
  );

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        setMarker({ lat, lng });
        setCenter({ lat, lng });
        onLocationSelect({ lat, lng });
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center w-full h-[400px] bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <div style={{ width: "100%", height: 400 }} className="relative rounded-lg overflow-hidden border border-gray-300">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={13}
          onClick={handleMapClick}
        >
          {marker && (
            <Marker
              position={marker}
              draggable={true}
              onDragEnd={handleMapClick}
            />
          )}
        </GoogleMap>
      </div>
      {marker && (
        <div className="mt-2 text-sm text-gray-700">
          <span className="font-medium">Selected Coordinates:</span> {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
          <a
            href={`https://maps.google.com/?q=${marker.lat},${marker.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 text-blue-600 hover:underline"
          >
            View on Google Maps
          </a>
        </div>
      )}
    </div>
  );
}

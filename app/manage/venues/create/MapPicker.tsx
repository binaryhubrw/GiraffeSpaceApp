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
  onLocationSelect?: (location: { lat: number; lng: number; address?: string }) => void;
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationSelect = () => {},
}: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: -1.9441, lng: 30.0619 });
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      const newLocation = { lat: latitude, lng: longitude };
      setCenter(newLocation);
      setMarker(newLocation);
      fetchAddress(newLocation.lat, newLocation.lng);
    } else {
      // Clear marker when no coordinates are provided
      setMarker(null);
      setAddress("");
    }
  }, [latitude, longitude]);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        const formattedAddress = data.results[0].formatted_address;
        setAddress(formattedAddress);
        onLocationSelect({ lat, lng, address: formattedAddress });
      } else {
        setAddress("");
        onLocationSelect({ lat, lng });
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setAddress("");
      onLocationSelect({ lat, lng });
    }
  };

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  // Debug logging
  useEffect(() => {
    console.log("MapPicker props:", { latitude, longitude });
    console.log("MapPicker state:", { marker, center });
  }, [latitude, longitude, marker, center]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center w-full h-[400px] bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading Google Maps</p>
          <p className="text-sm text-red-500 mt-1">Please check your API key configuration</p>
        </div>
      </div>
    );
  }

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const newLocation = { lat, lng };
        setMarker(newLocation);
        setCenter(newLocation);
        fetchAddress(lat, lng);
        onLocationSelect(newLocation);
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
        const newLocation = { lat, lng };
        const formattedAddress = data.results[0].formatted_address;
        setMarker(newLocation);
        setCenter(newLocation);
        setAddress(formattedAddress);
        onLocationSelect({ ...newLocation, address: formattedAddress });
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
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
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
          <div className="font-medium mb-1">Selected Location:</div>
          {address ? (
            <div className="text-gray-800">{address}</div>
          ) : (
            <div className="text-gray-600">Loading address...</div>
          )}
          <div className="mt-1 text-xs text-gray-500">
            Coordinates: {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
          </div>
          <a
            href={`https://maps.google.com/?q=${marker.lat},${marker.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-blue-600 hover:underline text-xs"
          >
            View on Google Maps
          </a>
        </div>
      )}
      {!marker && (
        <div className="mt-2 text-sm text-gray-500">
          Click on the map or search for a location to select coordinates
        </div>
      )}
    </div>
  );
}

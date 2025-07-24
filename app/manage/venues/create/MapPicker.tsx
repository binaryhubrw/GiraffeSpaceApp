import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPinIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Create custom marker icon
const createCustomIcon = (): L.DivIcon => {
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>`,
    className: 'custom-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

interface LocationSelectorProps {
  onSelect: (latlng: { lat: number; lng: number }) => void;
}

// Location selector based on map click
function LocationSelector({ onSelect }: LocationSelectorProps) {
  useMapEvents({
    click(e: { latlng: { lat: number; lng: number; }; }) {
      onSelect(e.latlng);
    },
  });
  return null;
}

interface MapPickerProps {
  value?: { lat: number; lng: number };
  onChange: (coords: { 
    lat: number; 
    lng: number; 
    address: string;
    district: string;
    googleMapsLink: string;
  }) => void;
  height?: string;
  width?: string;
}

interface LocationInfo {
  address: string;
  district: string;
}

interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

export const MapPicker: React.FC<MapPickerProps> = ({ 
  value, 
  onChange, 
  height = '400px', 
  width = '100%' 
}) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(value || null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const customIcon = createCustomIcon();

  const getLocationInfo = async (lat: number, lng: number): Promise<LocationInfo> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      
      // Extract district information with fallbacks
      let district = 'Unknown District';
      if (data.address) {
        district = data.address.state_district || 
                  data.address.county ||
                  data.address.city_district || 
                  data.address.district || 
                  data.address.suburb || 
                  data.address.city ||
                  data.address.state ||
                  'Unknown District';
      }
      
      const address = data.display_name || `${lat}, ${lng}`;
      
      return { district, address };
    } catch (error) {
      console.error('Error fetching location info:', error);
      return { 
        district: 'Unknown District', 
        address: `${lat}, ${lng}` 
      };
    }
  };

  const updateLocation = async (lat: number, lng: number): Promise<void> => {
    const { district, address } = await getLocationInfo(lat, lng);
    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    
    setPosition({ lat, lng });
    setLocationInfo({ address, district });
    
    onChange({ 
      lat, 
      lng, 
      address,
      district,
      googleMapsLink
    });
  };

  // Try to center on user's current location if no initial value
  useEffect(() => {
    if (!value && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          await updateLocation(lat, lng);
          mapRef.current?.setView([lat, lng], 13);
        },
        () => console.warn('Location permission denied or failed')
      );
    }
  }, [value]);

  const handleUseMyLocation = (): void => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          await updateLocation(lat, lng);
          mapRef.current?.setView([lat, lng], 13);
        },
        () => alert('Could not fetch your location')
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const handleMapClick = async (latlng: { lat: number; lng: number }): Promise<void> => {
    await updateLocation(latlng.lat, latlng.lng);
  };

  const defaultCenter = value || { lat: -1.9577, lng: 30.1127 }; // Rwanda center if no value

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleUseMyLocation}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <MapPinIcon className="w-4 h-4 text-red-500" /> My Location
      </button>

      <div style={{ height, width }} className="relative rounded-lg overflow-hidden border border-gray-300">
        <MapContainer
          center={[defaultCenter.lat, defaultCenter.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenReady={() => {
            if (mapRef.current === null) {
              // The map instance will be available via the ref after ready
              mapRef.current = (document.querySelector('.leaflet-container') as any)?._leaflet_map || null;
            }
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <LocationSelector onSelect={handleMapClick} />
          {position && (
            <Marker 
              position={[position.lat, position.lng]} 
              icon={customIcon}
            />
          )}
        </MapContainer>
      </div>

      {position && locationInfo && (
        <div className="text-sm space-y-1">
          <p className="text-gray-700">
            <span className="font-medium">District:</span> {locationInfo.district}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Address:</span> {locationInfo.address}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Coordinates:</span> {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </p>
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${position.lat},${position.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
          >
            <MapPinIcon className="w-4 h-4" /> View on Google Maps
          </a>
        </div>
      )}
    </div>
  );
}; 

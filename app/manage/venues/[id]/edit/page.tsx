"use client"

import type React from "react"

import { Header } from "@/components/header"
import Footer from "@/components/footer"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Upload, AlertCircle } from "lucide-react"
import Link from "next/link"
import MapPicker from "../../create/MapPicker";
import ApiService from "@/api/apiConfig";

import { toast } from 'sonner';



interface VenueFormData {
  venueName: string;
  capacity: string;
  location: string;
  description: string;
  latitude: string;
  longitude: string;
  googleMapsLink: string;
}

export default function EditVenuePage() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<VenueFormData>({
    venueName: "",
    capacity: "",
    location: "",
    description: "",
    latitude: "",
    longitude: "",
    googleMapsLink: "",
      });

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  // Fetch venue data
  useEffect(() => {
    const fetchVenue = async () => {
      if (!id || typeof id !== 'string') {
        toast.error("Invalid venue ID.");
        return;
      }

      setLoading(true);
      try {
        const response = await ApiService.getVenueById(id);
        console.log("Venue API response:", response); // Debug log
        if (response.success && response.data) {
          const v = response.data;
          const newFormData = {
            venueName: v.venueName || "",
            capacity: v.capacity?.toString() || "",
            location: v.venueLocation || v.location || "",
            description: v.description || "",
            latitude: v.latitude?.toString() || "",
            longitude: v.longitude?.toString() || "",
            googleMapsLink: v.googleMapsLink || "",
          };
          console.log("Setting form data:", newFormData); // Debug log
          setFormData(newFormData);
        }
      } catch (err) {
        console.error("Error fetching venue:", err);
        toast.error("Failed to fetch venue data.");
      } finally {
        setLoading(false);
      }
    };
    fetchVenue();
  }, [id, user?.userId]);

  // Handler for form inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`Updating ${name} to:`, value); // Debug log
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Map picker handler
  const handleMapChange = ({ lat, lng, address }: { lat: number; lng: number; address?: string }) => {
    console.log("Map change:", { lat, lng, address }); // Debug log
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
      location: address || `${lat}, ${lng}`,
      googleMapsLink: `https://maps.google.com/?q=${lat},${lng}`
    }));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.venueName.trim() || !formData.location.trim() || !formData.capacity.trim()) {
      toast.error("Please fill in all required fields (Venue Name, Location, and Capacity)");
      return;
    }

    setSaving(true);
    try {
      // Prepare venue data object matching the API requirements
      const venueData = {
        venueName: formData.venueName.trim(),
        venueLocation: formData.location.trim(),
        capacity: parseInt(formData.capacity),
        description: formData.description.trim() || "",
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        googleMapsLink: formData.googleMapsLink.trim() || "",
        venueDocuments: {} // Empty object as we're not handling documents in this form
      };

      if (!id || typeof id !== 'string') {
        throw new Error("Invalid venue ID");
      }

      console.log("Updating venue with data:", venueData);
      const response = await ApiService.updateVenueGeneralField(id, venueData);
      console.log("Update response:", response); // Debug log 
      
      if (response.success) {
        toast.success(`Venue "${formData.venueName}" updated successfully!`);
        router.push(`/manage/venues/${id}`);
      } else {
        throw new Error(response.message || 'Failed to update venue');
      }
    } catch (err: any) {
      console.error("Error updating venue:", err);
      const errorMessage = err.response?.data?.message || err.message || "There was a problem updating your venue. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 bg-white">
          <div className="container mx-auto px-4 md:px-16 max-w-7xl py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </main>
      
      </div>
    )
  }

  // Only show "Venue Not Found" if we're not loading and the venue data is completely missing
  if (!loading && !formData.venueName && !formData.location && !formData.capacity) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 bg-white">
          <div className="container mx-auto px-4 md:px-16 max-w-7xl py-8">
            <Link href="/manage/venues/myvenues" className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Venues
            </Link>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Venue Not Found</h1>
              <p className="text-gray-600 mb-6">The venue you're trying to edit doesn't exist or has been removed.</p>
              <Link href="/manage/venues/myvenues" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Return to Venues
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-white m-5">
        <div className="container mx-auto px-4 md:px-16 max-w-7xl py-8">
          <div className="flex items-center mb-6">
            <Link href={`/manage/venues/${id}`} className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-8">Edit Venue</h1>
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Left Column - Venue Details */}
              <div>
                <h2 className="text-xl font-semibold mb-6">Venue Details</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="venueName" className="block text-sm font-medium text-gray-700 mb-1">
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      id="venueName"
                      name="venueName"
                      value={formData.venueName}
                      onChange={handleInputChange}
                      placeholder="Enter venue name"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      id="capacity"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      placeholder="Max number of people"
                      min="1"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter venue description"
                      rows={4}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

                             {/* Right Column - Location Details */}
               <div>
                 <h2 className="text-xl font-semibold mb-6">Location Details</h2>
                 <div className="space-y-4">
                   <div>
                     <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                       Latitude *
                     </label>
                     <input
                       type="number"
                       id="latitude"
                       name="latitude"
                       value={formData.latitude}
                       onChange={handleInputChange}
                       placeholder="Enter latitude"
                       step="any"
                       className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       required
                       readOnly
                     />
                   </div>
                   <div>
                     <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                       Longitude *
                     </label>
                     <input
                       type="number"
                       id="longitude"
                       name="longitude"
                       value={formData.longitude}
                       onChange={handleInputChange}
                       placeholder="Enter longitude"
                       step="any"
                       className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       required
                       readOnly
                     />
                   </div>
                   <div>
                     <label htmlFor="googleMapsLink" className="block text-sm font-medium text-gray-700 mb-1">
                       Google Maps Link *
                     </label>
                     <input
                       type="url"
                       id="googleMapsLink"
                       name="googleMapsLink"
                       value={formData.googleMapsLink}
                       onChange={handleInputChange}
                       placeholder="Enter Google Maps link"
                       className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       required
                       readOnly
                     />
                   </div>
                 </div>
               </div>
                         </div>

             {/* Map Picker */}
             <div className="col-span-1 md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Venue Location *</label>
               <p className="text-xs text-gray-500 mb-3">Click on the map or search for a location to set your venue address</p>
               <MapPicker
                 latitude={formData.latitude ? parseFloat(formData.latitude) : undefined}
                 longitude={formData.longitude ? parseFloat(formData.longitude) : undefined}
                 onLocationSelect={handleMapChange}
               />
             </div>

             <div className="mt-8 flex justify-end gap-4">
              <Link
                href={`/manage/venues/${id}`}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
   
    </div>
  );
}

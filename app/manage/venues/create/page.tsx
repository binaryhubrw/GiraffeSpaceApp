"use client"

import type React from "react"
import MediaUpload from './uploadImage';

import { Footer } from "@/components/footer"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import ApiService from "@/api/apiConfig";
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { toast } from '@/hooks/use-toast';
import MapPicker from './MapPicker';

interface BookingCondition {
  condition: string;
  description: string;
  transitionTime: string;
}

interface VenueAmenity {
  resourceName: string;
  quantity: string; // was number
  amenitiesDescription: string;
  costPerUnit: string; // was number
}

interface VenueVariable {
  venueAmount: string;
  venueManagerId: string;
}

interface VenueFormData {
  venueName: string;
  capacity: string;
  location: string; // will be sent as venueLocation
  latitude: string;
  longitude: string;
  googleMapsLink: string;
  organizationId: string;
  mainPhoto: File | null;
  photoGallery: File[];
  virtualTour: File[];
  bookingConditions: BookingCondition[];
  venueVariable: VenueVariable;
  venueAmenities: VenueAmenity[];
  bookingType: string;
}

export default function CreateVenuePage() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<VenueFormData>({
    venueName: "",
    capacity: "",
    location: "",
    latitude: "",
    longitude: "",
    googleMapsLink: "",
    organizationId: "",
    mainPhoto: null,
    photoGallery: [],
    virtualTour: [],
    bookingConditions: [],
    venueVariable: {
      venueAmount: "",
      venueManagerId: user?.userId || "",
    },
    venueAmenities: [],
    bookingType: "",
  })
  const { organizations, loading: orgLoading, error: orgError } = useUserOrganizations(user?.userId);
  // 1. Remove resources from formData and all related logic/UI
  // 2. In handleSubmit, use FormData to send mainPhoto and photoGallery as files, and all other fields as needed
  const [resourceForm, setResourceForm] = useState({
    resourceName: "",
    description: "",
    costPerUnit: "",
    quantity: "",
  })
  const [resources, setResources] = useState<any[]>([])

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, organizationId: e.target.value }))
  }

  // Resource form handlers
  const handleResourceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setResourceForm((prev) => ({ ...prev, [name]: value }))
  }
  const handleAddResource = () => {
    if (!resourceForm.resourceName || !resourceForm.quantity) return
    setResources((prev) => [
      ...prev,
      {
        resource: {
          resourceName: resourceForm.resourceName,
          description: resourceForm.description,
          costPerUnit: parseFloat(resourceForm.costPerUnit) || 0,
        },
        quantity: parseInt(resourceForm.quantity, 10) || 1,
      },
    ])
    setResourceForm({ resourceName: "", description: "", costPerUnit: "", quantity: "" })
  }
  const handleRemoveResource = (idx: number) => {
    setResources((prev) => prev.filter((_, i) => i !== idx))
  }

  // Dynamic form handlers
  const handleMainPhotoChange = (files: FileList | null) => {
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, mainPhoto: files[0] }));
    }
  };
  const handlePhotoGalleryFilesChange = (files: FileList | null) => {
    if (files) {
      setFormData(prev => ({ ...prev, photoGallery: Array.from(files) }));
    }
  };
  const handleVirtualTourFilesChange = (files: FileList | null) => {
    if (files) {
      setFormData(prev => ({ ...prev, virtualTour: Array.from(files) }));
    }
  };

  const handleAddBookingCondition = () => {
    setFormData(prev => ({
      ...prev,
      bookingConditions: [
        ...prev.bookingConditions,
        { condition: '', description: '', transitionTime: '' }
      ]
    }));
  };
  const handleRemoveBookingCondition = (idx: number) => {
    setFormData((prev) => ({ ...prev, bookingConditions: prev.bookingConditions.filter((_, i) => i !== idx) }))
  }
  const handleBookingConditionChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      bookingConditions: prev.bookingConditions.map((cond, i) =>
        i === idx ? { ...cond, condition: value } : cond
      )
    }));
  }
  const handleBookingConditionDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      bookingConditions: prev.bookingConditions.map((cond, i) =>
        i === idx ? { ...cond, description: value } : cond
      )
    }));
  }
  const handleBookingConditionTransitionTimeChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      bookingConditions: prev.bookingConditions.map((cond, i) =>
        i === idx ? { ...cond, transitionTime: value } : cond
      )
    }));
  }

  const handleVenueVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, venueVariable: { ...prev.venueVariable, [name]: value } }))
  }

  const handleVenueAmenityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      venueAmenities: prev.venueAmenities.map((amenity, index) =>
        index === prev.venueAmenities.length - 1 ? { ...amenity, [name]: value } : amenity
      )
    }));
  };
  const handleVenueAmenityQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVenueAmenities = [...formData.venueAmenities];
    newVenueAmenities[newVenueAmenities.length - 1].quantity = e.target.value;
    setFormData((prev) => ({ ...prev, venueAmenities: newVenueAmenities }));
  }
  const handleVenueAmenityDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVenueAmenities = [...formData.venueAmenities];
    newVenueAmenities[newVenueAmenities.length - 1].amenitiesDescription = e.target.value;
    setFormData((prev) => ({ ...prev, venueAmenities: newVenueAmenities }));
  }
  const handleVenueAmenityCostPerUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVenueAmenities = [...formData.venueAmenities];
    newVenueAmenities[newVenueAmenities.length - 1].costPerUnit = e.target.value;
    setFormData((prev) => ({ ...prev, venueAmenities: newVenueAmenities }));
  }

  const handleAddVenueAmenity = () => {
    setFormData(prev => ({
      ...prev,
      venueAmenities: [
        ...prev.venueAmenities,
        { resourceName: '', quantity: '', amenitiesDescription: '', costPerUnit: '' }
      ]
    }));
  };
  const handleRemoveVenueAmenity = (idx: number) => {
    setFormData((prev) => ({ ...prev, venueAmenities: prev.venueAmenities.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.organizationId) {
      toast({
        title: "Organization Required",
        description: "Please select an organization for this venue.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true)
    try {
      const formDataToSend = new FormData();

      // Append all form fields to FormData
      formDataToSend.append("venueName", formData.venueName);
      formDataToSend.append("capacity", formData.capacity);
      formDataToSend.append("venueLocation", formData.location);
      formDataToSend.append("latitude", formData.latitude);
      formDataToSend.append("longitude", formData.longitude);
      formDataToSend.append("googleMapsLink", formData.googleMapsLink);
      formDataToSend.append("organizationId", formData.organizationId);
      formDataToSend.append("venueVariable", JSON.stringify({
        venueAmount: Number(formData.venueVariable.venueAmount),
        venueManagerId: formData.venueVariable.venueManagerId
      }));
      formDataToSend.append("bookingConditions", JSON.stringify(formData.bookingConditions));
      formDataToSend.append("venueAmenities", JSON.stringify(
        formData.venueAmenities.map(a => ({
          ...a,
          quantity: Number(a.quantity),
          costPerUnit: Number(a.costPerUnit)
        }))
      ));
      formDataToSend.append("bookingType", formData.bookingType);

      // Append mainPhoto if it exists
      if (formData.mainPhoto) {
        formDataToSend.append("mainPhoto", formData.mainPhoto);
      }

      // Append photoGallery if it exists
      if (formData.photoGallery.length > 0) {
        formData.photoGallery.forEach((file) => {
          formDataToSend.append('photoGallery', file);
        });
      }

      // Append virtualTour if it exists
      if (formData.virtualTour.length > 0) {
        formData.virtualTour.forEach((file) => {
          formDataToSend.append('virtualTour', file);
        });
      }

      if (user?.userId) {
        formDataToSend.append("managerId", user.userId);
      }

      const response = await ApiService.createVenue(formDataToSend);
      
      if (response.success) {
        toast({
          title: "Venue Created Successfully! 🎉",
          description: `${formData.venueName} has been added to your venues.`,
          variant: "default",
          className: "bg-green-500 text-white",
        });
        router.push("/manage/venues/myvenues");
      } else {
        throw new Error(response.message || 'Failed to create venue');
      }
    } catch (err: any) {
      toast({
        title: "Error Creating Venue",
        description: err.message || "There was a problem creating your venue. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className=" min-h-screen flex flex-col">
      <main className="flex-1 bg-white m-5">
        <div className="container mx-auto px-4 md:px-16 max-w-7xl py-8">
          <div className="flex items-center mb-6">
            <Link href="/manage/venues/myvenues" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back</span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-8">Add New Venue</h1>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Left Column - Venue Details */}
              <div>
                <h2 className="text-xl font-semibold mb-6">Venue Details</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="venueName" className="block text-sm font-medium text-gray-700 mb-1">
                      Venue Name
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
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Enter venue location or pick on map"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  {/* Remove manual latitude, longitude, googleMapsLink fields */}
                  <div>
                    <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                    {orgLoading ? (
                      <div className="text-gray-500 text-sm">Loading organizations...</div>
                    ) : orgError ? (
                      <div className="text-red-500 text-sm">{orgError}</div>
                    ) : (
                      <select
                        id="organizationId"
                        name="organizationId"
                        value={formData.organizationId}
                        onChange={handleOrgChange}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select organization</option>
                        {organizations.map((org) => (
                          <option key={org.organizationId} value={org.organizationId}>
                            {org.organizationName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                        Capacity
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
                      <label htmlFor="bookingType" className="block text-sm font-medium text-gray-700 mb-1">
                        Booking Type
                      </label>
                      <input
                        type="text"
                        id="bookingType"
                        name="bookingType"
                        value={formData.bookingType || ''}
                        onChange={e => setFormData(prev => ({ ...prev, bookingType: e.target.value }))}
                        placeholder="e.g. Daily"
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  {/* New: Booking Conditions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Booking Conditions</label>
                    {formData.bookingConditions.map((cond, idx) => (
                      <div key={idx} className="flex flex-col gap-2 mb-2 border p-2 rounded">
                        <input
                          type="text"
                          placeholder="Description Condition"
                          value={cond.condition}
                          onChange={e => handleBookingConditionChange(e, idx)}
                          className="px-3 py-2 border rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Nota Bene"
                          value={cond.description}
                          onChange={e => handleBookingConditionDescriptionChange(e, idx)}
                          className="px-3 py-2 border rounded text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Transition Time (minutes)"
                          value={cond.transitionTime}
                          onChange={e => handleBookingConditionTransitionTimeChange(e, idx)}
                          className="px-3 py-2 border rounded text-sm"
                        />
                        <button type="button" onClick={() => handleRemoveBookingCondition(idx)} className="text-red-500 text-xs">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={handleAddBookingCondition} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm mt-2 transition-colors">Add Condition</button>
                  </div>
                  {/* New: Venue Variable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue Amount</label>
                    <input
                      type="number"
                      name="venueAmount"
                      value={formData.venueVariable.venueAmount}
                      onChange={handleVenueVariableChange}
                      placeholder="Enter venue amount"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  {/* New: Venue Amenities */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue Amenities</label>
                    {formData.venueAmenities.map((amenity, index) => (
                      <div key={index} className="flex flex-col gap-2 mb-2 border p-2 rounded">
                        <input type="text" placeholder="Resource Name (e.g. Projector)" name="resourceName" value={amenity.resourceName} onChange={e => handleVenueAmenityChange(e)} className="px-3 py-2 border rounded text-sm" />
                        <input type="number" placeholder="Quantity (e.g. 2)" name="quantity" value={amenity.quantity} onChange={e => handleVenueAmenityQuantityChange(e)} className="px-3 py-2 border rounded text-sm" />
                        <input type="text" placeholder="Amenities Description (e.g. HD projectors available)" name="amenitiesDescription" value={amenity.amenitiesDescription} onChange={e => handleVenueAmenityDescriptionChange(e)} className="px-3 py-2 border rounded text-sm" />
                        <input type="number" placeholder="Cost Per Unit (e.g. 100)" name="costPerUnit" value={amenity.costPerUnit} onChange={e => handleVenueAmenityCostPerUnitChange(e)} className="px-3 py-2 border rounded text-sm" />
                        <button type="button" onClick={() => handleRemoveVenueAmenity(index)} className="text-red-500 text-xs">Remove Amenity</button>
                      </div>
                    ))}
                    <button type="button" onClick={handleAddVenueAmenity} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm mt-2 transition-colors">Add Amenity</button>
                  </div>
                </div>
              </div>

              {/* Right Column - Media & Amenities */}
              <div>
                <h2 className="text-xl font-semibold mb-6">Venue Media & Amenities</h2>
                {/* Main Photo */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Photo</label>
                  <MediaUpload accept="image/*" multiple={false} onChange={handleMainPhotoChange} />
                </div>
                {/* Photo Gallery */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo Gallery</label>
                  <MediaUpload accept="image/*" multiple={true} onChange={handlePhotoGalleryFilesChange} />
                </div>
                {/* Virtual Tour */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Virtual Tour (Videos)</label>
                  <MediaUpload accept="video/*" multiple={true} onChange={handleVirtualTourFilesChange} />
                </div>
              </div>
            </div>

            {/* Move Map Picker here, below all other fields */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pick Venue Location</label>
              <MapPicker
                latitude={formData.latitude ? parseFloat(formData.latitude) : undefined}
                longitude={formData.longitude ? parseFloat(formData.longitude) : undefined}
                onLocationSelect={({ lat, lng }: { lat: number; lng: number }) => {
                  setFormData(prev => ({
                    ...prev,
                    latitude: lat.toString(),
                    longitude: lng.toString(),
                    googleMapsLink: `https://maps.google.com/?q=${lat},${lng}`
                  }));
                }}
              />
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <Link
                href="/manage/venues"
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
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent "></div>
                )}
                {saving ? "Creating..." : "Create Venue"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
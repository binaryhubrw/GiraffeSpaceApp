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
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { toast } from 'sonner';

// Sample venue data
const venuesData = [
  {
    id: "grand-conference-hall",
    name: "Grand Conference Hall",
    address: "123 Main Street, City Center",
    capacity: 500,
    pricePerHour: 1000,
    bookings: 8,
    image: "/main.png",
    description: "A spacious venue perfect for large conferences and events.",
    amenities: ["Wi-Fi", "Projector", "Sound System", "Catering"],
  },
  {
    id: "riverside-meeting-room",
    name: "Riverside Meeting Room",
    address: "45 River Road, Waterfront",
    capacity: 50,
    pricePerHour: 200,
    bookings: 3,
    image: "/main.png",
    description: "A comfortable meeting room with a beautiful view of the river.",
    amenities: ["Wi-Fi", "Whiteboard", "Coffee Machine"],
  },
  {
    id: "downtown-studio",
    name: "Downtown Studio",
    address: "78 Urban Avenue, Downtown",
    capacity: 100,
    pricePerHour: 350,
    bookings: 1,
    image: "/main.png",
    description: "A modern studio space perfect for workshops and creative events.",
    amenities: ["Wi-Fi", "Sound System", "Projector", "Accessibility"],
  },
]

// All possible amenities
const allAmenities = [
  "Wi-Fi",
  "Sound System",
  "Whiteboard",
  "Parking",
  "Projector",
  "Catering",
  "Coffee Machine",
  "Accessibility",
]

export default function EditVenuePage() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    venueName: "",
    capacity: "",
    location: "",
    latitude: "",
    longitude: "",
    googleMapsLink: "",
    organizationId: "",
    bookingConditions: [],
    venueVariable: {
      venueAmount: "",
      venueManagerId: "",
      isFree: false,
    },
    venueAmenities: [],
    bookingType: "",
  });
  const { organizations, loading: orgLoading, error: orgError } = useUserOrganizations(user?.userId);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  // Fetch venue data
  useEffect(() => {
    const fetchVenue = async () => {
      setLoading(true);
      try {
        const response = await ApiService.getVenueById(id);
        if (response.success && response.data) {
          const v = response.data;
          setFormData({
            venueName: v.venueName || "",
            capacity: v.capacity?.toString() || "",
            location: v.location || "",
            latitude: v.latitude?.toString() || "",
            longitude: v.longitude?.toString() || "",
            googleMapsLink: v.googleMapsLink || "",
            organizationId: v.organization?.organizationId || v.organizationId || "",
            bookingConditions: v.bookingConditions?.map((c: any) => ({
              descriptionCondition: c.descriptionCondition || "",
              notaBene: c.notaBene || "",
              transitionTime: c.transitionTime?.toString() || "",
              depositRequiredPercent: c.depositRequiredPercent?.toString() || "",
              paymentComplementTimeBeforeEvent: c.paymentComplementTimeBeforeEvent?.toString() || ""
            })) || [],
            venueVariable: {
              venueAmount: v.venueVariables?.[0]?.venueAmount?.toString() || "",
              venueManagerId: v.venueVariables?.[0]?.manager?.userId || "",
              isFree: v.venueVariables?.[0]?.isFree || false,
            },
            venueAmenities: v.amenities?.map((a: any) => ({
              resourceName: a.resourceName || "",
              quantity: a.quantity?.toString() || "",
              amenitiesDescription: a.amenitiesDescription || "",
              costPerUnit: a.costPerUnit?.toString() || ""
            })) || [],
            bookingType: v.bookingType || "",
          });
        }
      } catch (err) {
        toast.error("Failed to fetch venue data.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchVenue();
  }, [id]);

  // Handlers (adapted from create page)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, organizationId: e.target.value }));
  };
  const handleAddBookingCondition = () => {
    setFormData(prev => ({
      ...prev,
      bookingConditions: [
        ...prev.bookingConditions,
        { descriptionCondition: '', notaBene: '', transitionTime: '', depositRequiredPercent: '', paymentComplementTimeBeforeEvent: '' }
      ]
    }));
  };
  const handleRemoveBookingCondition = (idx: number) => {
    setFormData((prev) => ({ ...prev, bookingConditions: prev.bookingConditions.filter((_, i) => i !== idx) }));
  };
  const handleBookingConditionChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      bookingConditions: prev.bookingConditions.map((cond, i) =>
        i === idx ? { ...cond, descriptionCondition: value } : cond
      )
    }));
  };
  const handleBookingConditionDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      bookingConditions: prev.bookingConditions.map((cond, i) =>
        i === idx ? { ...cond, notaBene: value } : cond
      )
    }));
  };
  const handleBookingConditionTransitionTimeChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      bookingConditions: prev.bookingConditions.map((cond, i) =>
        i === idx ? { ...cond, transitionTime: value } : cond
      )
    }));
  };
  const handleBookingConditionDepositChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      bookingConditions: prev.bookingConditions.map((cond, i) =>
        i === idx ? { ...cond, depositRequiredPercent: value } : cond
      )
    }));
  };
  const handleBookingConditionPaymentTimeChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      bookingConditions: prev.bookingConditions.map((cond, i) =>
        i === idx ? { ...cond, paymentComplementTimeBeforeEvent: value } : cond
      )
    }));
  };
  const handleVenueVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, venueVariable: { ...prev.venueVariable, [name]: value } }));
  };
  const handleVenueVariableIsFreeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      venueVariable: { 
        ...prev.venueVariable, 
        isFree: checked,
        // Clear venue amount if venue is free
        venueAmount: checked ? "" : prev.venueVariable.venueAmount
      } 
    }));
  };
  const handleVenueAmenityChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      venueAmenities: prev.venueAmenities.map((amenity, i) =>
        i === idx ? { ...amenity, [name]: value } : amenity
      )
    }));
  };
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

  // Map picker
  const handleMapChange = ({ lat, lng, address }: { lat: number; lng: number; address?: string }) => {
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
    
    if (!formData.latitude || !formData.longitude || !formData.location) {
      toast.error("Please select a venue location on the map.");
      return;
    }
    
    setSaving(true);
    try {
      const dataToSend = {
        venueName: formData.venueName,
        capacity: Number(formData.capacity),
        venueLocation: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        googleMapsLink: formData.googleMapsLink,
        organizationId: formData.organizationId,
        venueVariable: {
          venueAmount: Number(formData.venueVariable.venueAmount),
          venueManagerId: formData.venueVariable.venueManagerId,
          isFree: formData.venueVariable.isFree,
        },
        bookingConditions: formData.bookingConditions.map((c: any) => ({
          descriptionCondition: c.descriptionCondition,
          notaBene: c.notaBene,
          transitionTime: Number(c.transitionTime),
          depositRequiredPercent: Number(c.depositRequiredPercent),
          paymentComplementTimeBeforeEvent: Number(c.paymentComplementTimeBeforeEvent)
        })),
        venueAmenities: formData.venueAmenities.map((a: any) => ({
          resourceName: a.resourceName,
          quantity: Number(a.quantity),
          amenitiesDescription: a.amenitiesDescription,
          costPerUnit: Number(a.costPerUnit)
        })),
        bookingType: formData.bookingType,
      };
      const response = await ApiService.updateVenueDetailsById(id, dataToSend);
      if (response.success) {
        toast.success("Venue updated successfully.");
        router.push(`/manage/venues/${id}`);
      } else {
        throw new Error(response.message || 'Failed to update venue');
      }
    } catch (err: any) {
      toast.error(err.message || "There was a problem updating your venue. Please try again.");
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
        <Footer />
      </div>
    )
  }

  if (!formData.venueName) {
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
              <Link href="/manage/venues/myvenues" className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800">
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
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 md:px-16 max-w-7xl py-8">
          <div className="flex items-center mb-6">
            <Link href={`/manage/venues/${id}`} className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-6">Edit Venue</h1>
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
                  {/* Booking Conditions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Booking Conditions</label>
                    {formData.bookingConditions.map((cond, idx) => (
                      <div key={idx} className="flex flex-col gap-3 mb-4 border p-4 rounded-lg bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Description Condition</label>
                            <input
                              type="text"
                              placeholder="e.g. No outside food allowed"
                              value={cond.descriptionCondition}
                              onChange={e => handleBookingConditionChange(e, idx)}
                              className="w-full px-3 py-2 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Nota Bene</label>
                            <input
                              type="text"
                              placeholder="e.g. Please respect the property"
                              value={cond.notaBene}
                              onChange={e => handleBookingConditionDescriptionChange(e, idx)}
                              className="w-full px-3 py-2 border rounded text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Transition Time (days)</label>
                            <input
                              type="number"
                              placeholder="e.g. 2"
                              value={cond.transitionTime}
                              onChange={e => handleBookingConditionTransitionTimeChange(e, idx)}
                              className="w-full px-3 py-2 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Deposit Required (%)</label>
                            <input
                              type="number"
                              placeholder="e.g. 20"
                              value={cond.depositRequiredPercent}
                              onChange={e => handleBookingConditionDepositChange(e, idx)}
                              className="w-full px-3 py-2 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Time Before Event (days)</label>
                            <input
                              type="number"
                              placeholder="e.g. 3"
                              value={cond.paymentComplementTimeBeforeEvent}
                              onChange={e => handleBookingConditionPaymentTimeChange(e, idx)}
                              className="w-full px-3 py-2 border rounded text-sm"
                            />
                          </div>
                        </div>
                        <button type="button" onClick={() => handleRemoveBookingCondition(idx)} className="text-red-500 text-xs self-end hover:text-red-700">Remove Condition</button>
                      </div>
                    ))}
                    <button type="button" onClick={handleAddBookingCondition} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm mt-2 transition-colors">Add Booking Condition</button>
                  </div>
                  {/* Venue Variable */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isFree"
                        name="isFree"
                        checked={formData.venueVariable.isFree}
                        onChange={handleVenueVariableIsFreeChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isFree" className="ml-2 block text-sm font-medium text-gray-700">
                        Is Free Venue
                      </label>
                    </div>
                    
                    {!formData.venueVariable.isFree && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Venue Amount</label>
                        <input
                          type="number"
                          name="venueAmount"
                          value={formData.venueVariable.venueAmount}
                          onChange={handleVenueVariableChange}
                          placeholder="Enter venue amount"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={!formData.venueVariable.isFree}
                        />
                      </div>
                    )}
                  </div>
                  {/* Venue Amenities */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue Amenities</label>
                    {formData.venueAmenities.map((amenity, index) => (
                      <div key={index} className="flex flex-col gap-2 mb-2 border p-2 rounded">
                        <input type="text" placeholder="Resource Name (e.g. Projector)" name="resourceName" value={amenity.resourceName} onChange={e => handleVenueAmenityChange(e, index)} className="px-3 py-2 border rounded text-sm" />
                        <input type="number" placeholder="Quantity (e.g. 2)" name="quantity" value={amenity.quantity} onChange={e => handleVenueAmenityChange(e, index)} className="px-3 py-2 border rounded text-sm" />
                        <input type="text" placeholder="Amenities Description (e.g. HD projectors available)" name="amenitiesDescription" value={amenity.amenitiesDescription} onChange={e => handleVenueAmenityChange(e, index)} className="px-3 py-2 border rounded text-sm" />
                        <input type="number" placeholder="Cost Per Unit (e.g. 100)" name="costPerUnit" value={amenity.costPerUnit} onChange={e => handleVenueAmenityChange(e, index)} className="px-3 py-2 border rounded text-sm" />
                        <button type="button" onClick={() => handleRemoveVenueAmenity(index)} className="text-red-500 text-xs">Remove Amenity</button>
                      </div>
                    ))}
                    <button type="button" onClick={handleAddVenueAmenity} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm mt-2 transition-colors">Add Amenity</button>
                  </div>
                </div>
              </div>
              {/* Right Column - Map Picker */}
              <div>
                <h2 className="text-xl font-semibold mb-6">Venue Location</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Location *</label>
                  <p className="text-xs text-gray-500 mb-3">Click on the map or search for a location to set your venue address</p>
                  <MapPicker
                    latitude={formData.latitude ? parseFloat(formData.latitude) : undefined}
                    longitude={formData.longitude ? parseFloat(formData.longitude) : undefined}
                    onLocationSelect={handleMapChange}
                  />
                </div>
              </div>
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
      <Footer />
    </div>
  );
}

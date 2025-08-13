"use client"

import type React from "react"
import MediaUpload from './uploadImage';

import Footer from "@/components/footer"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Upload, ChevronLeft, ChevronRight, Check } from "lucide-react"
import Link from "next/link"
import ApiService from "@/api/apiConfig";
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { toast } from '@/hooks/use-toast';
import MapPicker from './MapPicker';

interface BookingCondition {
  descriptionCondition: string;
  notaBene: string;
  transitionTime: string;
  depositRequiredPercent: string;
  paymentComplementTimeBeforeEvent: string;
  bookingPaymentTimeoutMinutes: string;
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
  isFree: boolean;
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

const STEPS = [
  { id: 1, title: "Basic Info", description: "Venue name and organization" },
  { id: 2, title: "Venue Booking Details", description: "Capacity, pricing, and conditions" },
  { id: 3, title: "Media & Amenities", description: "Photos, videos, and amenities" },
  { id: 4, title: "Location", description: "Venue location on map" }
];

export default function CreateVenuePage() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

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
    bookingConditions: [{
      descriptionCondition: "",
      notaBene: "",
      transitionTime: "",
      depositRequiredPercent: "",
      paymentComplementTimeBeforeEvent: "",
      bookingPaymentTimeoutMinutes: ""
    }],
    venueVariable: {
      venueAmount: "",
      venueManagerId: user?.userId || "",
      isFree: false,
    },
    venueAmenities: [],
    bookingType: "DAILY",
  })
  const { organizations, loading: orgLoading, error: orgError } = useUserOrganizations();
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

  // Auto-set organization when organizations are loaded
  useEffect(() => {
    if (organizations.length > 0 && !formData.organizationId) {
      // Set the first available organization automatically
      setFormData(prev => ({
        ...prev,
        organizationId: organizations[0].organizationId
      }));
    }
  }, [organizations, formData.organizationId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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


  const handleBookingConditionChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      bookingConditions: prev.bookingConditions.map((cond, i) =>
        i === idx ? { ...cond, descriptionCondition: value } : cond
      )
    }));
  }
  const handleBookingConditionDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      bookingConditions: prev.bookingConditions.map((cond, i) =>
        i === idx ? { ...cond, notaBene: value } : cond
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

  const handleBookingConditionDepositChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      bookingConditions: prev.bookingConditions.map((cond, i) =>
        i === idx ? { ...cond, depositRequiredPercent: value } : cond
      )
    }));
  }

  const handleBookingConditionPaymentTimeChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      bookingConditions: prev.bookingConditions.map((cond, i) =>
        i === idx ? { ...cond, paymentComplementTimeBeforeEvent: value } : cond
      )
    }));
  }

  const handleBookingConditionPaymentTimeoutChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      bookingConditions: prev.bookingConditions.map((cond, i) =>
        i === idx ? { ...cond, bookingPaymentTimeoutMinutes: value } : cond
      )
    }));
  }

  const handleVenueVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, venueVariable: { ...prev.venueVariable, [name]: value } }))
  }

  const handleVenueVariableIsFreeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target
    setFormData((prev) => ({ 
      ...prev, 
      venueVariable: { 
        ...prev.venueVariable, 
        isFree: checked,
        // Clear venue amount if venue is free
        venueAmount: checked ? "" : prev.venueVariable.venueAmount
      } 
    }))
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

  // Step navigation
  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Validation for each step
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.venueName && formData.organizationId;
      case 2:
        return formData.capacity && formData.bookingType;
      case 3:
        return true; // Media and amenities are optional
      case 4:
        return formData.latitude && formData.longitude && formData.location;
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Comprehensive validation with toast notifications
    if (!formData.venueName.trim()) {
      toast({
        title: "Venue Name Required",
        description: "Please enter a venue name.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.organizationId) {
      toast({
        title: "Organization Required",
        description: "Please select an organization for this venue.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      toast({
        title: "Valid Capacity Required",
        description: "Please enter a valid capacity (greater than 0).",
        variant: "destructive"
      });
      return;
    }

    if (!formData.bookingType) {
      toast({
        title: "Booking Type Required",
        description: "Please select a booking type (Daily or Hourly).",
        variant: "destructive"
      });
      return;
    }

    if (!formData.venueVariable.isFree && (!formData.venueVariable.venueAmount || parseFloat(formData.venueVariable.venueAmount) <= 0)) {
      toast({
        title: "Venue Amount Required",
        description: "Please enter a valid venue amount for paid venues.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.latitude || !formData.longitude || !formData.location) {
      toast({
        title: "Venue Location Required",
        description: "Please select a venue location on the map.",
        variant: "destructive"
      });
      return;
    }

    // Validate transitionTime for each booking condition
    for (const condition of formData.bookingConditions) {
      const transitionTimeNum = Number(condition.transitionTime);
      if (![0, 1].includes(transitionTimeNum)) {
        toast({
          title: "Invalid Transition Time",
          description: "Transition Time must be 0 or 1 for all booking conditions.",
          variant: "destructive"
        });
        return;
      }
    }

    setSaving(true)
    
    // Show loading toast
    toast({
      title: "Creating Venue...",
      description: "Please wait while we create your venue.",
      variant: "default",
    });
    
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
        venueManagerId: formData.venueVariable.venueManagerId,
        isFree: formData.venueVariable.isFree,
      }));
      formDataToSend.append("bookingConditions", JSON.stringify(
        formData.bookingConditions.map(condition => ({
          ...condition,
          transitionTime: Number(condition.transitionTime),
          depositRequiredPercent: Number(condition.depositRequiredPercent),
          paymentComplementTimeBeforeEvent: Number(condition.paymentComplementTimeBeforeEvent),
          bookingPaymentTimeoutMinutes: Number(condition.bookingPaymentTimeoutMinutes)
        }))
      ));
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


      console.log("Submitting venue data:", formDataToSend);

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

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
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
              ) : organizations.length === 0 ? (
                <div className="text-red-500 text-sm">No organizations found. Please create an organization first.</div>
              ) : (
                <div className="space-y-2">
                  {organizations.length === 1 ? (
                    // If only one organization, show it as read-only
                    <div className="px-3 py-2 bg-gray-50 border rounded-md text-gray-700">
                      {organizations[0].organizationName}
                    </div>
                  ) : (
                    // If multiple organizations, allow selection
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
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
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
                <select
                  id="bookingType"
                  name="bookingType"
                  value={formData.bookingType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {/* <option value="">Select booking type</option> */}
                  <option value="DAILY">Daily</option>
                  <option value="HOURLY">Hourly</option>
                </select>
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Transition Time (hours/days)</label>
                      <input
                        type="number"
                        placeholder="e.g. 0 or 1"
                        value={cond.transitionTime}
                        onChange={e => {
                          const inputValue = e.target.value;
                          if (inputValue === '' || inputValue === '0' || inputValue === '1') {
                            handleBookingConditionTransitionTimeChange(e, idx);
                          } else {
                            toast({
                              title: "Invalid Input",
                              description: "Transition Time must be 0 or 1.",
                              variant: "destructive",
                              duration: 1000
                            });
                          }
                        }}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Minimum Deposit Required (%)</label>
                      <input
                        type="number"
                        placeholder="e.g. 20"
                        value={cond.depositRequiredPercent}
                        onChange={e => handleBookingConditionDepositChange(e, idx)}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Payment Time Before Event (hours/days)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3"
                        value={cond.paymentComplementTimeBeforeEvent}
                        onChange={e => handleBookingConditionPaymentTimeChange(e, idx)}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Payment Timeout (hours)</label>
                      <input
                        type="number"
                        placeholder="e.g. 24"
                        value={Number(cond.bookingPaymentTimeoutMinutes) / 60 || ''} // Display hours, convert minutes to hours
                        onChange={e => {
                          const hoursInput = e.target.value;
                          const minutesValue = hoursInput === '' ? '' : String(Number(hoursInput) * 60);
                          
                          if (hoursInput === '' || (Number(hoursInput) >= 1 && Number(hoursInput) % 1 === 0)) { // Allow empty or integer hours >= 1
                            handleBookingConditionPaymentTimeoutChange({
                              target: { value: minutesValue } 
                            } as React.ChangeEvent<HTMLInputElement>, idx);
                          } else {
                            toast({
                              title: "Invalid Input",
                              description: "Payment Timeout must be a whole number of hours, at least 1.",
                              variant: "destructive",
                              duration: 2000
                            });
                          }
                        }}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Media Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Media Upload</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Photo</label>
                  <MediaUpload accept="image/*" multiple={false} onChange={handleMainPhotoChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo Gallery</label>
                  <MediaUpload accept="image/*" multiple={true} onChange={handlePhotoGalleryFilesChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Virtual Tour (Videos)</label>
                  <MediaUpload accept="video/*" multiple={true} onChange={handleVirtualTourFilesChange} />
                </div>
              </div>
            </div>

            {/* Venue Amenities */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Venue Amenities</h3>
              <div className="space-y-4">
                {formData.venueAmenities.map((amenity, index) => (
                  <div key={index} className="flex flex-col gap-2 mb-2 border p-2 rounded">
                    <input type="text" placeholder="Resource Name (e.g. Projector)" name="resourceName" value={amenity.resourceName} onChange={e => handleVenueAmenityChange(e)} className="px-3 py-2 border rounded text-sm" />
                    <input type="number" placeholder="Quantity (e.g. 2)" name="quantity" value={amenity.quantity} onChange={e => handleVenueAmenityQuantityChange(e)} className="px-3 py-2 border rounded text-sm" />
                    <input type="text" placeholder="Amenities Description (e.g. HD projectors available)" name="amenitiesDescription" value={amenity.amenitiesDescription} onChange={e => handleVenueAmenityDescriptionChange(e)} className="px-3 py-2 border rounded text-sm" />
                    <input type="number" placeholder="Repair Cost per Unit (e.g. 100)" name="costPerUnit" value={amenity.costPerUnit} onChange={e => handleVenueAmenityCostPerUnitChange(e)} className="px-3 py-2 border rounded text-sm" />
                    <button type="button" onClick={() => handleRemoveVenueAmenity(index)} className="text-red-500 text-xs">Remove Amenity</button>
                  </div>
                ))}
                <button type="button" onClick={handleAddVenueAmenity} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm mt-2 transition-colors">Add Amenity</button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue Location *</label>
              <p className="text-xs text-gray-500 mb-3">Click on the map or search for a location to set your venue address</p>
              <MapPicker
                latitude={formData.latitude ? parseFloat(formData.latitude) : undefined}
                longitude={formData.longitude ? parseFloat(formData.longitude) : undefined}
                onLocationSelect={({ lat, lng, address }: { lat: number; lng: number; address?: string }) => {
                  setFormData(prev => ({
                    ...prev,
                    latitude: lat.toString(),
                    longitude: lng.toString(),
                    location: address || `${lat}, ${lng}`,
                    googleMapsLink: `https://maps.google.com/?q=${lat},${lng}`
                  }));
                }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-white m-5">
        <div className="container mx-auto px-4 md:px-16 max-w-7xl py-8">
          <div className="flex items-center mb-6">
            <Link href="/manage/venues/myvenues" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back</span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-8">Add New Venue</h1>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => goToStep(step.id)}
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      currentStep === step.id
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : currentStep > step.id
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </button>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step Content */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Step {currentStep}: {STEPS[currentStep - 1].title}
                </h2>
                <p className="text-gray-600">{STEPS[currentStep - 1].description}</p>
              </div>
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </button>

              <div className="flex gap-4">
                {currentStep < STEPS.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepValid(currentStep)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving || !isStepValid(currentStep)}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    )}
                    {saving ? "Creating..." : "Create Venue"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
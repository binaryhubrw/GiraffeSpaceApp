"use client"

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Mail, Phone, Users, Calendar as CalendarIcon, Clock, Info, Pencil, Trash2, CalendarPlus, ArrowLeft, Plus, X } from "lucide-react";
import ApiService from "@/api/apiConfig";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import type { AxiosProgressEvent } from "axios";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface AvailabilitySlot {
  date: string;
  timeSlots: TimeSlot[];
}

interface VenueDetails {
  venueId: string;
  venueName: string;
  description: string | null;
  capacity: number;
  amount: number;
  location: string;
  latitude: number;
  longitude: number;
  googleMapsLink: string;
  managerId: string;
  organizationId: string;
  amenities: Array<{
    id: string;
    resourceName: string;
    quantity: number;
    amenitiesDescription: string;
    costPerUnit: string;
  }>;
  contactEmail: string;
  contactPhone: string;
  status: string;
  mainPhotoUrl: string;
  subPhotoUrls: string[];
  organization: {
    organizationId: string;
    organizationName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    status: string;
  };
  bookingConditions: Array<{
    id: string;
    descriptionCondition: string;
    notaBene: string;
    transitionTime: number;
    depositRequiredPercent: number;
    paymentComplementTimeBeforeEvent: number;
  }>;
  availabilitySlots: AvailabilitySlot[];
  venueVariables: Array<{
    id: string;
    venueAmount: number;
    manager: {
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
    };
  }>;
  bookingType: string;
  virtualTourUrl: string | null;
  venueDocuments: string;
}

interface AmenityData {
  resourceName: string;
  quantity: number;
  amenitiesDescription: string;
  costPerUnit: string;
}

export default function VenueDetailsPage() {
  const params = useParams();
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDateSlots, setSelectedDateSlots] = useState<TimeSlot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Amenity modal states
  const [addAmenityModalOpen, setAddAmenityModalOpen] = useState(false);
  const [amenityFormData, setAmenityFormData] = useState<AmenityData>({
    resourceName: '',
    quantity: 1,
    amenitiesDescription: '',
    costPerUnit: ''
  });
  const [addingAmenity, setAddingAmenity] = useState(false);

  // Update amenity modal states
  const [updateAmenityModalOpen, setUpdateAmenityModalOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<{
    id: string;
    data: AmenityData;
  } | null>(null);
  const [updatingAmenity, setUpdatingAmenity] = useState(false);

  // Delete amenity states
  const [deleteAmenityDialogOpen, setDeleteAmenityDialogOpen] = useState(false);
  const [deletingAmenityId, setDeletingAmenityId] = useState<string | null>(null);
  const [deletingAmenity, setDeletingAmenity] = useState(false);

  // Booking condition update states
  const [updateBookingConditionModalOpen, setUpdateBookingConditionModalOpen] = useState(false);
  const [editingBookingCondition, setEditingBookingCondition] = useState<{
    id: string;
    data: {
      descriptionCondition: string;
      notaBene: string;
      transitionTime: number;
      depositRequiredPercent: number;
      depositRequiredTime: number;
      paymentComplementTimeBeforeEvent: number;
    };
  } | null>(null);
  const [updatingBookingCondition, setUpdatingBookingCondition] = useState(false);

  // Venue variable update states
  const [updateVenueVariableModalOpen, setUpdateVenueVariableModalOpen] = useState(false);
  const [editingVenueVariable, setEditingVenueVariable] = useState<{
    id: string;
    data: {
      amount: string;
      managerId: string;
    };
  } | null>(null);
  const [updatingVenueVariable, setUpdatingVenueVariable] = useState(false);

  // Video tour update states
  const [updateVideoTourModalOpen, setUpdateVideoTourModalOpen] = useState(false);
  const [updatingVideoTour, setUpdatingVideoTour] = useState(false);
  const [videoTourUploadProgress, setVideoTourUploadProgress] = useState(0);

  // File input refs
  const mainPhotoInputRef = useRef<HTMLInputElement>(null);
  const subPhotoInputRef = useRef<HTMLInputElement>(null);
  const videoTourInputRef = useRef<HTMLInputElement>(null);

  // Add handlers for image actions
  const handleEditMainPhoto = () => {
    mainPhotoInputRef.current?.click();
  };
  const handleMainPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && venue) {
      const formData = new FormData();
      formData.append("mainPhoto", file);
      try {
        setUploading(true);
        setUploadProgress(0);
        await ApiService.updateVenueMainPhoto(venue.venueId, formData, (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        });
        // Refresh venue details
        const response = await ApiService.getVenueById(venue.venueId);
        if (response.success) setVenue(response.data);
        toast.success("Main photo updated successfully.");
      } catch (err) {
        toast.error("Failed to update main photo.");
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };
  const handleAddSubPhoto = () => {
    subPhotoInputRef.current?.click();
  };
  const handleSubPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && venue) {
      const formData = new FormData();
      formData.append("photo", file);
      try {
        setUploading(true);
        setUploadProgress(0);
        await ApiService.addVenueGalleryImage(venue.venueId, formData, (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        });
        // Refresh venue details
        const response = await ApiService.getVenueById(venue.venueId);
       

        if (response.success) setVenue(response.data);
        toast.success("Sub image added successfully.");
      } catch (err) {
        toast.error("Failed to add sub image.");
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };
  const handleDeleteSubPhoto = (index: number) => {
    setDeleteIndex(index);
    setDeleteDialogOpen(true);
  };
  const confirmDeleteSubPhoto = async () => {
    if (venue && deleteIndex !== null && venue.subPhotoUrls[deleteIndex]) {
      setDeleting(true);
      try {
        await ApiService.removeVenueGalleryImage(venue.venueId, venue.subPhotoUrls[deleteIndex]);
        // Refresh venue details
        const response = await ApiService.getVenueById(venue.venueId);
        if (response.success) setVenue(response.data);
        setDeleteDialogOpen(false);
        setDeleteIndex(null);
        toast.success("Sub image deleted successfully.");
        window.location.reload(); // Reload the page to ensure the update is visible
      } catch (err) {
        toast.error("Failed to delete sub image.");
      } finally {
        setDeleting(false);
      }
    }
  };

  // Amenity form handlers
  const handleAmenityInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAmenityFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? (value === '' ? '' : parseInt(value) || 0) : value
    }));
  };

  const handleAddAmenity = async () => {
    if (!venue) return;

    // Validate form data
    if (!amenityFormData.resourceName.trim() || 
        !amenityFormData.amenitiesDescription.trim() || 
        !amenityFormData.costPerUnit.trim() ||
        !amenityFormData.quantity || 
        amenityFormData.quantity <= 0) {
      toast.error("Please fill in all required fields and ensure quantity is greater than 0.");
      return;
    }

    // Validate costPerUnit format (should be a valid number)
    const costPerUnit = parseFloat(amenityFormData.costPerUnit);
    if (isNaN(costPerUnit) || costPerUnit <= 0) {
      toast.error("Cost per unit must be a valid positive number.");
      return;
    }

    // Additional validation to ensure data format matches API expectations
    if (amenityFormData.resourceName.length < 2) {
      toast.error("Resource name must be at least 2 characters long.");
      return;
    }

    if (amenityFormData.amenitiesDescription.length < 5) {
      toast.error("Description must be at least 5 characters long.");
      return;
    }

    setAddingAmenity(true);
    try {
      // Ensure quantity is a number and costPerUnit is properly formatted
      const amenityData = {
        resourceName: amenityFormData.resourceName.trim(),
        quantity: parseInt(amenityFormData.quantity.toString()) || 1,
        amenitiesDescription: amenityFormData.amenitiesDescription.trim(),
        costPerUnit: costPerUnit.toFixed(2) // Format as string with 2 decimal places
      };

     
      
      const amenityPayload = [amenityData];
     
      
    
      
      const response = await ApiService.addVenueAmenities(venue.venueId, amenityPayload);
      
    
      
      if (response.success) {
        // Always refresh venue details on successful API response
        const venueResponse = await ApiService.getVenueById(venue.venueId);
        if (venueResponse.success) {
          setVenue(venueResponse.data);
        }

        // Reset form and close modal regardless of whether 'added' array is populated
        setAmenityFormData({
          resourceName: '',
          quantity: 1,
          amenitiesDescription: '',
          costPerUnit: ''
        });
        setAddAmenityModalOpen(false);

        if (response.added && response.added.length > 0) {
          toast.success("Amenity added successfully.");
        } else if (response.skipped && response.skipped.length > 0) {
          const skippedReason = response.skipped[0]?.reason || "Validation failed";
          toast.error(`Amenity was skipped: ${skippedReason}`);
        } else {
          // If success is true, but no added/skipped reported, assume success due to observed behavior.
          toast.success("Amenity was added successfully.");
        }
      } else {
        toast.error(response.message || "Failed to add amenity.");
      }
    } catch (err) {
      console.error("Error adding amenity:", err);
      toast.error("Failed to add amenity. Please try again.");
    } finally {
      setAddingAmenity(false);
    }
  };

  const resetAmenityForm = () => {
    setAmenityFormData({
      resourceName: '',
      quantity: 1,
      amenitiesDescription: '',
      costPerUnit: ''
    });
  };

  // Update amenity handlers
  const handleEditAmenity = (amenity: any) => {
    setEditingAmenity({
      id: amenity.id,
      data: {
        resourceName: amenity.resourceName,
        quantity: amenity.quantity,
        amenitiesDescription: amenity.amenitiesDescription,
        costPerUnit: amenity.costPerUnit
      }
    });
    setUpdateAmenityModalOpen(true);
  };

  const handleUpdateAmenityInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editingAmenity) {
      setEditingAmenity(prev => ({
        ...prev!,
        data: {
          ...prev!.data,
          [name]: name === 'quantity' ? (value === '' ? '' : parseInt(value) || 0) : value
        }
      }));
    }
  };

  const handleUpdateAmenity = async () => {
    if (!venue || !editingAmenity) return;

    // Validate form data
    if (!editingAmenity.data.resourceName.trim() || !editingAmenity.data.amenitiesDescription.trim() || !editingAmenity.data.costPerUnit.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setUpdatingAmenity(true);
    try {
      const response = await ApiService.updateVenueAmenities(venue.venueId, editingAmenity.id, editingAmenity.data);
      
      if (response.success) {
        // Refresh venue details
        const venueResponse = await ApiService.getVenueById(venue.venueId);
        if (venueResponse.success) setVenue(venueResponse.data);
        
        // Close modal and reset state
        setUpdateAmenityModalOpen(false);
        setEditingAmenity(null);
        toast.success("Amenity updated successfully.");
      } else {
        toast.error(response.message || "Failed to update amenity.");
      }
    } catch (err) {
      console.error("Error updating amenity:", err);
      toast.error("Failed to update amenity. Please try again.");
    } finally {
      setUpdatingAmenity(false);
    }
  };

  // Delete amenity handlers
  const handleDeleteAmenity = (amenityId: string) => {
    setDeletingAmenityId(amenityId);
    setDeleteAmenityDialogOpen(true);
  };

  const confirmDeleteAmenity = async () => {
    if (!venue || !deletingAmenityId) return;

    setDeletingAmenity(true);
    try {
      const response = await ApiService.removeVenueAmenity(venue.venueId, deletingAmenityId);
      
      if (response.success) {
        // Refresh venue details
        const venueResponse = await ApiService.getVenueById(venue.venueId);
        if (venueResponse.success) setVenue(venueResponse.data);
        
        // Close dialog and reset state
        setDeleteAmenityDialogOpen(false);
        setDeletingAmenityId(null);
        toast.success("Amenity deleted successfully.");
      } else {
        toast.error(response.message || "Failed to delete amenity.");
      }
    } catch (err) {
      console.error("Error deleting amenity:", err);
      toast.error("Failed to delete amenity. Please try again.");
    } finally {
      setDeletingAmenity(false);
    }
  };

  // Booking condition update handlers
  const handleEditBookingCondition = (condition: any) => {
    setEditingBookingCondition({
      id: condition.id,
      data: {
        descriptionCondition: condition.descriptionCondition,
        notaBene: condition.notaBene,
        transitionTime: condition.transitionTime,
        depositRequiredPercent: condition.depositRequiredPercent,
        depositRequiredTime: condition.depositRequiredTime || 5, // Default value if not present
        paymentComplementTimeBeforeEvent: condition.paymentComplementTimeBeforeEvent
      }
    });
    setUpdateBookingConditionModalOpen(true);
  };

  const handleUpdateBookingConditionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingBookingCondition) return;
    
    const { name, value } = e.target;
    setEditingBookingCondition(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          [name]: name === 'transitionTime' || name === 'depositRequiredPercent' || name === 'depositRequiredTime' || name === 'paymentComplementTimeBeforeEvent' 
            ? parseInt(value) || 0 
            : value
        }
      };
    });
  };

  const handleUpdateBookingCondition = async () => {
    if (!editingBookingCondition || !venue) return;

    setUpdatingBookingCondition(true);
    try {
      const response = await ApiService.updateBookingCondition(
        editingBookingCondition.id,
        venue.venueId,
        editingBookingCondition.data
      );

      if (response.success) {
        // Refresh venue details
        const venueResponse = await ApiService.getVenueById(venue.venueId);
        if (venueResponse.success) setVenue(venueResponse.data);
        
        // Reset form and close modal
        setEditingBookingCondition(null);
        setUpdateBookingConditionModalOpen(false);
        toast.success("Booking condition updated successfully.");
      } else {
        toast.error(response.message || "Failed to update booking condition.");
      }
    } catch (err) {
      console.error("Error updating booking condition:", err);
      toast.error("Failed to update booking condition. Please try again.");
    } finally {
      setUpdatingBookingCondition(false);
    }
  };

  // Venue variable update handlers
  const handleEditVenueVariable = (variable: any) => {
    setEditingVenueVariable({
      id: variable.id,
      data: {
        amount: variable.venueAmount.toString(),
        managerId: venue?.managerId || variable.manager?.userId || ""
      }
    });
    setUpdateVenueVariableModalOpen(true);
  };

  const handleUpdateVenueVariableInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingVenueVariable) return;
    
    const { name, value } = e.target;
    setEditingVenueVariable(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          [name]: value
        }
      };
    });
  };

  const handleUpdateVenueVariable = async () => {
    if (!editingVenueVariable || !venue) return;

    setUpdatingVenueVariable(true);
    try {
      const response = await ApiService.updateVenueVariable(
        venue.venueId,
        editingVenueVariable.id,
        editingVenueVariable.data
      );

      if (response.success) {
        // Refresh venue details
        const venueResponse = await ApiService.getVenueById(venue.venueId);
        if (venueResponse.success) setVenue(venueResponse.data);
        
        // Reset form and close modal
        setEditingVenueVariable(null);
        setUpdateVenueVariableModalOpen(false);
        toast.success("Venue variable updated successfully.");
      } else {
        toast.error(response.message || "Failed to update venue variable.");
      }
    } catch (err) {
      console.error("Error updating venue variable:", err);
      toast.error("Failed to update venue variable. Please try again.");
    } finally {
      setUpdatingVenueVariable(false);
    }
  };

  // Video tour update handlers
  const handleEditVideoTour = () => {
    videoTourInputRef.current?.click();
  };

  const handleVideoTourFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && venue) {
      const formData = new FormData();
      formData.append("virtualTour", file);
      try {
        setUpdatingVideoTour(true);
        setVideoTourUploadProgress(0);
        await ApiService.updateVenueVideoTour(
          venue.venueId, 
          formData, 
          (progressEvent) => {
            if (progressEvent.total) {
              setVideoTourUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
            }
          }
        );
        
        // Refresh venue details to update UI
        const venueResponse = await ApiService.getVenueById(venue.venueId);
        if (venueResponse.success) {
          setVenue(venueResponse.data);
          console.log("Venue details refreshed after video tour update");
        }
        
        // Reset file input
        if (videoTourInputRef.current) {
          videoTourInputRef.current.value = '';
        }
        
        toast.success("Video tour updated successfully.");
      } catch (err: any) {
        console.error("Error updating video tour:", err);
        
        // Extract the actual error message from the response
        let errorMessage = "Failed to update video tour. Please try again.";
        
        if (err.response?.data?.message) {
          errorMessage = `Video tour update failed: ${err.response.data.message}`;
        } else if (err.message) {
          errorMessage = `Video tour update failed: ${err.message}`;
        }
        
        toast.error(errorMessage);
      } finally {
        setUpdatingVideoTour(false);
        setVideoTourUploadProgress(0);
      }
    }
  };

  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchVenueDetails = async () => {
      try {
        const response = await ApiService.getVenueById(params.id as string);
         console.log("venue details response:", response);
        if (response.success) {
          setVenue(response.data);
          // Initialize time slots for the current date
          updateTimeSlots(response.data, new Date());
        }
      } catch (error) {
        console.error("Error fetching venue details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchVenueDetails();
    }
  }, [params.id]);

  const updateTimeSlots = (venueData: VenueDetails, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const slots = venueData.availabilitySlots.find(slot => slot.date === dateStr);
    setSelectedDateSlots(slots?.timeSlots || []);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && venue) {
      setSelectedDate(date);
      updateTimeSlots(venue, date);
    }
  };

  // Add a handler for Book Now button
  const handleBookNow = () => {
    if (!mounted) return;
    
    // Use timezone-safe date formatting to avoid UTC conversion issues
    const dateToUse = selectedDate || new Date();
    const formattedDate = dateToUse.getFullYear() + '-' + 
      String(dateToUse.getMonth() + 1).padStart(2, '0') + '-' + 
      String(dateToUse.getDate()).padStart(2, '0');
    
    if (isLoggedIn) {
      router.push(`/venues/book?venueId=${venue?.venueId}&date=${formattedDate}`);
    } else {
      router.push("/login");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!venue) {
    return (
      <div className="min-h-screen p-8">
        <Link href="/manage/venues/myvenues" className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Venues
        </Link>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Venue Not Found</h1>
          <p className="text-gray-600 mb-6">The venue you're looking for doesn't exist or has been removed.</p>
          <Link href="/manage/venues/myvenues" className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800">
            Return to Venues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Upload Progress Overlay */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
            <p className="mb-4 font-medium">Uploading image...</p>
            <Progress value={uploadProgress} className="w-64 mb-2" />
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
        </div>
      )}
      {/* Back Button */}
      <Link 
        href="/manage/venues/myvenues" 
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Venues
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{venue.venueName}</h1>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{venue.location}</span>
          <Badge variant={venue.status === 'APPROVED' ? 'default' : 'secondary'}>
            {venue.status}
          </Badge>
        </div>
      </div>

      {/* Book Now Button (auth-aware) */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push(`/manage/venues/${venue?.venueId}/availability`)}
          disabled={!mounted}
          className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold text-base hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:text-gray-500"
        >
          Availability
        </button>
                  </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Venue Details</span>
            <div className="flex gap-2">
              <Link href={`/manage/venues/${venue.venueId}/availability`}>
                <Button variant="default" className="flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4" />
                  Availability
                </Button>
              </Link>
              <Link href={`/manage/venues/${venue.venueId}/edit`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Main Image */}
            <div className="relative rounded-lg overflow-hidden h-[400px] group">
              <img 
                src={venue.mainPhotoUrl} 
                alt={venue.venueName}
                className="w-full h-full object-cover"
              />
              {/* Edit icon overlay */}
              <button
                onClick={handleEditMainPhoto}
                className="absolute top-4 right-4 bg-white bg-opacity-80 rounded-full p-2 shadow transition-opacity opacity-0 group-hover:opacity-100 hover:bg-opacity-100"
                title="Edit main photo"
              >
                <Pencil className="w-5 h-5 text-gray-700" />
              </button>
              {/* Hidden file input for main photo */}
              <input
                type="file"
                accept="image/*"
                ref={mainPhotoInputRef}
                onChange={handleMainPhotoFileChange}
                style={{ display: "none" }}
              />
            </div>

            {/* Sub Images Carousel */}
            <div className="w-full max-w-2xl mx-auto">
              <Carousel opts={{ align: "start" }}>
                <CarouselContent>
                  {/* Add icon for new sub image */}
                  <CarouselItem className="basis-1/3">
                    <button
                      onClick={handleAddSubPhoto}
                      className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg h-24 w-full bg-gray-50 hover:bg-gray-100 transition-colors"
                      title="Add sub image"
                    >
                      <Plus className="w-8 h-8 text-gray-400" />
                    </button>
                    {/* Hidden file input for sub photo */}
                    <input
                      type="file"
                      accept="image/*"
                      ref={subPhotoInputRef}
                      onChange={handleSubPhotoFileChange}
                      style={{ display: "none" }}
                    />
                  </CarouselItem>
                  {/* Sub images, always show at least 2 after add button */}
                  {Array.from({ length: Math.max(2, (venue.subPhotoUrls?.length || 0)) }).map((_, i) => {
                    const url = venue.subPhotoUrls?.[i];
                    return url ? (
                      <CarouselItem key={i} className="basis-1/3">
                        <div className="relative rounded-lg overflow-hidden h-24 group">
                    <img 
                      src={url} 
                            alt={`${venue.venueName} ${i + 1}`}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                          {/* Delete icon overlay */}
                          <AlertDialog open={deleteDialogOpen && deleteIndex === i} onOpenChange={setDeleteDialogOpen}>
                            <AlertDialogTrigger asChild>
                              <button
                                onClick={() => handleDeleteSubPhoto(i)}
                                className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1 shadow transition-opacity opacity-0 group-hover:opacity-100 hover:bg-opacity-100"
                                title="Delete sub image"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Sub Image</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this sub image? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDeleteSubPhoto} disabled={deleting} className="bg-destructive text-white">
                                  {deleting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CarouselItem>
                    ) : (
                      <CarouselItem key={`empty-${i}`} className="basis-1/3">
                        <div className="h-24 w-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
                          No Image
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
                  </div>

            {/* Basic Venue Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-800">{venue.description || 'No description available.'}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Capacity</h3>
                <p className="text-gray-800">{venue.capacity} people</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Booking Type</h3>
                <p className="text-gray-800">{venue.bookingType}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Location</h3>
                <p className="text-gray-800">{venue.location}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Contact Email</h3>
                <p className="text-gray-800">{venue.contactEmail}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Contact Phone</h3>
                <p className="text-gray-800">{venue.contactPhone}</p>
            </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Status</h3>
                <Badge variant={venue.status === 'APPROVED' ? 'default' : 'secondary'}>
                  {venue.status}
                </Badge>
              </div>
            <div>
                <h3 className="text-lg font-semibold mb-2">Google Maps Link</h3>
                {venue.googleMapsLink ? (
                  <a href={venue.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View on Google Maps
                  </a>
                ) : (
                  <p className="text-gray-500">No Google Maps link available</p>
                )}
              </div>
            </div>

            {/* Organization Section */}
            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Organization</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                  <h4 className="text-md font-medium mb-1">Organization Name</h4>
                  <p className="text-gray-800">{venue.organization?.organizationName || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-md font-medium mb-1">Organization Status</h4>
                  <Badge variant={venue.organization?.status === 'APPROVED' ? 'default' : 'secondary'}>
                    {venue.organization?.status || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-md font-medium mb-1">Organization Email</h4>
                  <p className="text-gray-800">{venue.organization?.contactEmail || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-md font-medium mb-1">Organization Phone</h4>
                  <p className="text-gray-800">{venue.organization?.contactPhone || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="text-md font-medium mb-1">Organization Address</h4>
                  <p className="text-gray-800">{venue.organization?.address || 'N/A'}</p>
                </div>
              </div>
            </div>

             {/* Amenities Section */}
             <div className="border-t pt-6">
               <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                   <h3 className="text-xl font-semibold text-gray-900">Amenities</h3>
                   <Badge variant="secondary" className="text-xs">
                     {venue.amenities?.length || 0} {venue.amenities?.length === 1 ? 'amenity' : 'amenities'}
                   </Badge>
                 </div>
                 <Dialog open={addAmenityModalOpen} onOpenChange={setAddAmenityModalOpen}>
                   <DialogTrigger asChild>
                     <button
                       className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                       title="Add New Amenity"
                     >
                       <Plus className="w-4 h-4" />
                       <span className="text-sm">Add New</span>
                     </button>
                   </DialogTrigger>
                   <DialogContent className="sm:max-w-[500px]">
                     <DialogHeader>
                       <DialogTitle className="flex items-center gap-2">
                         <Plus className="w-5 h-5" />
                         Add New Amenity
                       </DialogTitle>
                     </DialogHeader>
                     <div className="space-y-4 py-4">
                       <div className="space-y-2">
                         <Label htmlFor="resourceName">Resource Name *</Label>
                         <Input
                           id="resourceName"
                           name="resourceName"
                           value={amenityFormData.resourceName}
                           onChange={handleAmenityInputChange}
                           placeholder="e.g., Projector, Tables, Chairs"
                           required
                         />
                       </div>
                                               <div className="space-y-2">
                          <Label htmlFor="quantity">Quantity *</Label>
                          <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            min="1"
                            value={amenityFormData.quantity || ''}
                            onChange={handleAmenityInputChange}
                            placeholder="1"
                            required
                          />
                        </div>
                       <div className="space-y-2">
                         <Label htmlFor="amenitiesDescription">Description *</Label>
                         <Textarea
                           id="amenitiesDescription"
                           name="amenitiesDescription"
                           value={amenityFormData.amenitiesDescription}
                           onChange={handleAmenityInputChange}
                           placeholder="Describe the amenity and its features"
                           rows={3}
                           required
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="costPerUnit">Cost per Unit (RWF) *</Label>
                         <Input
                           id="costPerUnit"
                           name="costPerUnit"
                           value={amenityFormData.costPerUnit}
                           onChange={handleAmenityInputChange}
                           placeholder="e.g., 20000.00"
                           required
                         />
                       </div>
                     </div>
                     <div className="flex justify-end gap-2 pt-4">
                       <Button
                         variant="outline"
                         onClick={() => {
                           resetAmenityForm();
                           setAddAmenityModalOpen(false);
                         }}
                         disabled={addingAmenity}
                       >
                         Cancel
                       </Button>
                       <Button
                         onClick={handleAddAmenity}
                         disabled={addingAmenity}
                         className="bg-blue-600 hover:bg-blue-700"
                       >
                         {addingAmenity ? "Adding..." : "Add Amenity"}
                       </Button>
                     </div>
                   </DialogContent>
                 </Dialog>
               </div>
              {venue.amenities && venue.amenities.length > 0 ? (
                 <div className="w-full">
                   <Carousel opts={{ align: "start" }}>
                     <CarouselContent>
                  {venue.amenities.map(amenity => (
                         <CarouselItem key={amenity.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                           <div className="border rounded-lg p-4 bg-gray-50 relative group h-full">
                             {/* Action buttons overlay */}
                             <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button
                                 className="p-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-600 transition-colors"
                                 title="Update Amenity"
                                 onClick={() => handleEditAmenity(amenity)}
                               >
                                 <Pencil className="w-3 h-3" />
                               </button>
                               <button
                                 className="p-1 bg-red-100 hover:bg-red-200 rounded text-red-600 transition-colors"
                                 title="Delete Amenity"
                                 onClick={() => handleDeleteAmenity(amenity.id)}
                               >
                                 <Trash2 className="w-3 h-3" />
                               </button>
                             </div>
                             <h4 className="font-medium text-gray-900 mb-2 pr-16">{amenity.resourceName}</h4>
                             <div className="space-y-1 text-sm text-gray-700">
                               <p><span className="font-medium">Quantity:</span> {amenity.quantity}</p>
                               <p><span className="font-medium">Description:</span> {amenity.amenitiesDescription}</p>
                               <p><span className="font-medium">Cost per Unit:</span> ${amenity.costPerUnit}</p>
                             </div>
                           </div>
                         </CarouselItem>
                       ))}
                     </CarouselContent>
                     <CarouselPrevious />
                     <CarouselNext />
                   </Carousel>
                 </div>
              ) : (
                <p className="text-gray-500">No amenities available</p>
              )}

               {/* Update Amenity Modal */}
               <Dialog open={updateAmenityModalOpen} onOpenChange={setUpdateAmenityModalOpen}>
                 <DialogContent className="sm:max-w-[500px]">
                   <DialogHeader>
                     <DialogTitle className="flex items-center gap-2">
                       <Pencil className="w-5 h-5" />
                       Update Amenity
                     </DialogTitle>
                   </DialogHeader>
                   {editingAmenity && (
                     <div className="space-y-4 py-4">
                       <div className="space-y-2">
                         <Label htmlFor="update-resourceName">Resource Name *</Label>
                         <Input
                           id="update-resourceName"
                           name="resourceName"
                           value={editingAmenity.data.resourceName}
                           onChange={handleUpdateAmenityInputChange}
                           placeholder="e.g., Projector, Tables, Chairs"
                           required
                         />
            </div>
                                               <div className="space-y-2">
                          <Label htmlFor="update-quantity">Quantity *</Label>
                          <Input
                            id="update-quantity"
                            name="quantity"
                            type="number"
                            min="1"
                            value={editingAmenity.data.quantity || ''}
                            onChange={handleUpdateAmenityInputChange}
                            placeholder="1"
                            required
                          />
                        </div>
                       <div className="space-y-2">
                         <Label htmlFor="update-amenitiesDescription">Description *</Label>
                         <Textarea
                           id="update-amenitiesDescription"
                           name="amenitiesDescription"
                           value={editingAmenity.data.amenitiesDescription}
                           onChange={handleUpdateAmenityInputChange}
                           placeholder="Describe the amenity and its features"
                           rows={3}
                           required
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="update-costPerUnit">Cost per Unit (RWF) *</Label>
                         <Input
                           id="update-costPerUnit"
                           name="costPerUnit"
                           value={editingAmenity.data.costPerUnit}
                           onChange={handleUpdateAmenityInputChange}
                           placeholder="e.g., 20000.00"
                           required
                         />
                       </div>
                     </div>
                   )}
                   <div className="flex justify-end gap-2 pt-4">
                     <Button
                       variant="outline"
                       onClick={() => {
                         setUpdateAmenityModalOpen(false);
                         setEditingAmenity(null);
                       }}
                       disabled={updatingAmenity}
                     >
                       Cancel
                     </Button>
                     <Button
                       onClick={handleUpdateAmenity}
                       disabled={updatingAmenity}
                       className="bg-blue-600 hover:bg-blue-700"
                     >
                       {updatingAmenity ? "Updating..." : "Update Amenity"}
                     </Button>
                   </div>
                 </DialogContent>
               </Dialog>

               {/* Delete Amenity Confirmation Dialog */}
               <AlertDialog open={deleteAmenityDialogOpen} onOpenChange={setDeleteAmenityDialogOpen}>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>Delete Amenity</AlertDialogTitle>
                     <AlertDialogDescription>
                       Are you sure you want to delete this amenity? This action cannot be undone.
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel disabled={deletingAmenity}>Cancel</AlertDialogCancel>
                     <AlertDialogAction 
                       onClick={confirmDeleteAmenity} 
                       disabled={deletingAmenity}
                       className="bg-destructive text-white"
                     >
                       {deletingAmenity ? "Deleting..." : "Delete"}
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
             </div>

                         {/* Booking Conditions Section */}
             <div className="border-t pt-6">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-semibold text-gray-900">Booking Conditions</h3>
                 <button
                   className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                   title="Update Booking Conditions"
                   onClick={() => venue.bookingConditions && venue.bookingConditions.length > 0 && handleEditBookingCondition(venue.bookingConditions[0])}
                 >
                   <Pencil className="w-4 h-4" />
                   <span className="text-sm">Update</span>
                 </button>
               </div>
              {venue.bookingConditions && venue.bookingConditions.length > 0 ? (
                 <div className="space-y-4">
                  {venue.bookingConditions.map(condition => (
                     <div key={condition.id} className="border rounded-lg p-4 bg-gray-50">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                           <p className="text-gray-700">{condition.descriptionCondition}</p>
                         </div>
                         <div>
                           <h4 className="font-medium text-gray-900 mb-1">Nota Bene</h4>
                           <p className="text-gray-700">{condition.notaBene}</p>
                         </div>
                         <div>
                           <h4 className="font-medium text-gray-900 mb-1">Transition Time</h4>
                           <p className="text-gray-700">{condition.transitionTime} day(s)</p>
                         </div>
                         <div>
                           <h4 className="font-medium text-gray-900 mb-1">Deposit Required</h4>
                           <p className="text-gray-700">{condition.depositRequiredPercent}%</p>
                         </div>
                         <div>
                           <h4 className="font-medium text-gray-900 mb-1">Payment Complement Time</h4>
                           <p className="text-gray-700">{condition.paymentComplementTimeBeforeEvent} day(s) before event</p>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
              ) : (
                <p className="text-gray-500">No booking conditions available</p>
              )}
              </div>

                         {/* Venue Variables Section */}
             <div className="border-t pt-6">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-semibold text-gray-900">Venue Variables</h3>
                 <button
                   className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                   title="Update Venue Variables"
                   onClick={() => venue.venueVariables && venue.venueVariables.length > 0 && handleEditVenueVariable(venue.venueVariables[0])}
                 >
                   <Pencil className="w-4 h-4" />
                   <span className="text-sm">Update</span>
                 </button>
               </div>
               {venue.venueVariables && venue.venueVariables.length > 0 ? (
                 <div className="space-y-4">
                   {venue.venueVariables.map(variable => (
                     <div key={variable.id} className="border rounded-lg p-4 bg-gray-50">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <h4 className="font-medium text-gray-900 mb-1">Venue Amount</h4>
                           <p className="text-gray-700">${variable.venueAmount.toFixed(2)}</p>
                         </div>
                         <div>
                           <h4 className="font-medium text-gray-900 mb-1">Manager</h4>
                           <p className="text-gray-700">{variable.manager?.firstName} {variable.manager?.lastName}</p>
                         </div>
                         <div>
                           <h4 className="font-medium text-gray-900 mb-1">Manager Email</h4>
                           <p className="text-gray-700">{variable.manager?.email}</p>
                         </div>
                         <div>
                           <h4 className="font-medium text-gray-900 mb-1">Manager Phone</h4>
                           <p className="text-gray-700">{variable.manager?.phoneNumber}</p>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-gray-500">No venue variables available</p>
               )}
             </div>

            {/* Availability Slots */}
            {/* (Removed as per request) */}

            {/* Virtual Tour */}
            {venue.virtualTourUrl && venue.virtualTourUrl.trim() !== '' && (
               <div className="border-t pt-6">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-xl font-semibold text-gray-900">Virtual Tour</h3>
                                    <button
                   className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                   title="Update Virtual Tour"
                   onClick={handleEditVideoTour}
                   disabled={updatingVideoTour}
                 >
                   <Pencil className="w-4 h-4" />
                   <span className="text-sm">
                     {updatingVideoTour ? `Uploading... ${videoTourUploadProgress}%` : "Update"}
                   </span>
                 </button>
                 </div>
                 <div className="relative rounded-lg overflow-hidden bg-gray-100">
                   <video
                     controls
                     className="w-full h-auto max-h-96 object-contain"
                     preload="metadata"
                   >
                     <source src={venue.virtualTourUrl} type="video/mp4" />
                     <source src={venue.virtualTourUrl} type="video/webm" />
                     <source src={venue.virtualTourUrl} type="video/ogg" />
                     Your browser does not support the video tag.
                   </video>
                   <div className="absolute top-2 right-2">
                     <a 
                       href={venue.virtualTourUrl} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs hover:bg-opacity-90 transition-colors"
                       title="Open in new tab"
                     >
                       Open in new tab
                     </a>
                   </div>
                 </div>
              </div>
            )}

            {/* Documents */}
            {venue.venueDocuments && venue.venueDocuments.trim() !== '' && (
            <div>
                <h3 className="text-lg font-semibold mb-2">Documents</h3>
                <p className="text-gray-800">Documents available for this venue.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Update Booking Condition Modal */}
      <Dialog open={updateBookingConditionModalOpen} onOpenChange={setUpdateBookingConditionModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Booking Condition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="descriptionCondition">Description Condition</Label>
              <Textarea
                id="descriptionCondition"
                name="descriptionCondition"
                value={editingBookingCondition?.data.descriptionCondition || ''}
                onChange={handleUpdateBookingConditionInputChange}
                placeholder="Enter description condition"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notaBene">Nota Bene</Label>
              <Textarea
                id="notaBene"
                name="notaBene"
                value={editingBookingCondition?.data.notaBene || ''}
                onChange={handleUpdateBookingConditionInputChange}
                placeholder="Enter nota bene"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transitionTime">Transition Time (days)</Label>
                <Input
                  id="transitionTime"
                  name="transitionTime"
                  type="number"
                  value={editingBookingCondition?.data.transitionTime || 0}
                  onChange={handleUpdateBookingConditionInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="depositRequiredPercent">Deposit Required (%)</Label>
                <Input
                  id="depositRequiredPercent"
                  name="depositRequiredPercent"
                  type="number"
                  value={editingBookingCondition?.data.depositRequiredPercent || 0}
                  onChange={handleUpdateBookingConditionInputChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="depositRequiredTime">Deposit Required Time (days)</Label>
                <Input
                  id="depositRequiredTime"
                  name="depositRequiredTime"
                  type="number"
                  value={editingBookingCondition?.data.depositRequiredTime || 0}
                  onChange={handleUpdateBookingConditionInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="paymentComplementTimeBeforeEvent">Payment Complement Time (days before event)</Label>
                <Input
                  id="paymentComplementTimeBeforeEvent"
                  name="paymentComplementTimeBeforeEvent"
                  type="number"
                  value={editingBookingCondition?.data.paymentComplementTimeBeforeEvent || 0}
                  onChange={handleUpdateBookingConditionInputChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setUpdateBookingConditionModalOpen(false);
                  setEditingBookingCondition(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateBookingCondition}
                disabled={updatingBookingCondition}
              >
                {updatingBookingCondition ? "Updating..." : "Update Booking Condition"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Venue Variable Modal */}
      <Dialog open={updateVenueVariableModalOpen} onOpenChange={setUpdateVenueVariableModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Venue Variable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                value={editingVenueVariable?.data.amount || ''}
                onChange={handleUpdateVenueVariableInputChange}
                placeholder="Enter amount"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setUpdateVenueVariableModalOpen(false);
                  setEditingVenueVariable(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateVenueVariable}
                disabled={updatingVenueVariable}
              >
                {updatingVenueVariable ? "Updating..." : "Update Venue Variable"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for video tour */}
      <input
        type="file"
        ref={videoTourInputRef}
        onChange={handleVideoTourFileChange}
        accept="video/*"
        style={{ display: 'none' }}
      />
    </div>
  );
}
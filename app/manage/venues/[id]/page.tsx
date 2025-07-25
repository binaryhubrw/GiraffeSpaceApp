"use client"

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { MapPicker } from "../create/MapPicker";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Mail, Phone, Users, Calendar as CalendarIcon, Clock, Info, Pencil, Trash2, CalendarPlus, ArrowLeft, Plus } from "lucide-react";
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

  // File input refs
  const mainPhotoInputRef = useRef<HTMLInputElement>(null);
  const subPhotoInputRef = useRef<HTMLInputElement>(null);

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

  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchVenueDetails = async () => {
      try {
        const response = await ApiService.getVenueById(params.id as string);
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
    router.push(isLoggedIn ? "/venues/book" : "/login");
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
          onClick={handleBookNow}
          disabled={!mounted}
          className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold text-base hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:text-gray-500"
        >
          Book Now
        </button>
                  </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Venue Details</span>
            <div className="flex gap-2">
              <Link href={`/manage/venues/${venue.venueId}/book`}>
                <Button variant="default" className="flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4" />
                  Book Venue
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

            {/* Venue Details */}
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
                <h3 className="text-lg font-semibold mb-2">Amount</h3>
                <p className="text-gray-800">${venue.amount.toFixed(2)}</p>
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
                <a href={venue.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  View on Google Maps
                </a>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Amenities</h3>
              <ul className="list-disc list-inside text-gray-800">
                {venue.amenities.map(amenity => (
                  <li key={amenity.id}>
                    {amenity.resourceName} ({amenity.quantity}) - ${amenity.costPerUnit}/unit
                  </li>
                ))}
              </ul>
            </div>

            {/* Booking Conditions */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Booking Conditions</h3>
              <ul className="list-disc list-inside text-gray-800">
                {venue.bookingConditions.map(condition => (
                  <li key={condition.id}>
                    {condition.descriptionCondition}
                    <br />
                    Nota Bene: {condition.notaBene}
                    <br />
                    Transition Time: {condition.transitionTime} minutes
                    <br />
                    Deposit Required: {condition.depositRequiredPercent}%
                    <br />
                    Payment Complement Time: {condition.paymentComplementTimeBeforeEvent} minutes
                  </li>
                ))}
              </ul>
              </div>

            {/* Availability Slots */}
            {/* (Removed as per request) */}

            {/* Virtual Tour */}
            {venue.virtualTourUrl && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Virtual Tour</h3>
                <a href={venue.virtualTourUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  View Virtual Tour
                </a>
              </div>
            )}

            {/* Documents */}
            {venue.venueDocuments && (
            <div>
                <h3 className="text-lg font-semibold mb-2">Documents</h3>
                <p className="text-gray-800">Documents available for this venue.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
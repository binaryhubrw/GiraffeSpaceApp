"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MapPicker } from "../create/MapPicker";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Mail, Phone, Users, Calendar as CalendarIcon, Clock, Info, Pencil, Trash2, CalendarPlus, ArrowLeft } from "lucide-react";
import ApiService from "@/api/apiConfig";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

  useEffect(() => {
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
    <div className="container mx-auto px-4 py-8">
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

       {/* Stats Grid */}
                {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white border rounded-lg p-6 flex items-center gap-4 shadow-sm">
                    <DollarSign className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
      
                  <div className="bg-white border rounded-lg p-6 flex items-center gap-4 shadow-sm">
                    <Calendar className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-gray-500">Confirmed Bookings</p>
                      <p className="text-2xl font-bold">{bookings.filter((b) => b.status === "confirmed").length}</p>
                    </div>
                  </div>
      
                  <div className="bg-white border rounded-lg p-6 flex items-center gap-4 shadow-sm">
                    <Clock className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-500">Pending Requests</p>
                      <p className="text-2xl font-bold">{pendingBookings}</p>
                    </div>
                  </div>
      
                  <div className="bg-white border rounded-lg p-6 flex items-center gap-4 shadow-sm">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-gray-500">Avg. Guests</p>
                      <p className="text-2xl font-bold">
                        {Math.round(bookings.reduce((sum, b) => sum + b.guests, 0) / bookings.length)}
                      </p>
                    </div>
                  </div>
                </div> */}

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
            <div className="rounded-lg overflow-hidden h-[400px]">
              <img 
                src={venue.mainPhotoUrl} 
                alt={venue.venueName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Sub Images */}
            {venue.subPhotoUrls && venue.subPhotoUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {venue.subPhotoUrls.map((url, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden h-24 group">
                    <img 
                      src={url} 
                      alt={`${venue.venueName} ${index + 1}`}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span>Capacity: {venue.capacity} people</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span>Booking Type: {venue.bookingType}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{venue.contactEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{venue.contactPhone}</span>
              </div>
            </div>

            {venue.description && (
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-600">{venue.description}</p>
              </div>
            )}

            <div>
              <h3 className="font-medium mb-2">Amenities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {venue.amenities.map((amenity) => (
                  <div key={amenity.id} className="p-4 border rounded-lg">
                    <h4 className="font-medium">{amenity.resourceName}</h4>
                    <p className="text-sm text-gray-600">{amenity.amenitiesDescription}</p>
                    <div className="mt-2 flex justify-between text-sm">
                      <span>Quantity: {amenity.quantity}</span>
                      <span>Cost: ${amenity.costPerUnit}/unit</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Booking Conditions</h3>
              {venue.bookingConditions.map((condition) => (
                <div key={condition.id} className="mb-4 p-4 border rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-500 mt-1" />
                    <div>
                      <p className="font-medium">{condition.descriptionCondition}</p>
                      <p className="text-sm text-gray-600 mt-1">{condition.notaBene}</p>
                      <div className="mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Transition Time: {condition.transitionTime} minutes</span>
                        </div>
                        <p>Deposit Required: {condition.depositRequiredPercent}%</p>
                        <p>Payment Due: {condition.paymentComplementTimeBeforeEvent} days before event</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Venue Manager */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-4">Venue Manager</h3>
                {venue.venueVariables[0]?.manager && (
                  <div className="space-y-2">
                    <p className="font-medium">
                      {venue.venueVariables[0].manager.firstName} {venue.venueVariables[0].manager.lastName}
                    </p>
                    <p className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      {venue.venueVariables[0].manager.email}
                    </p>
                    <p className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      {venue.venueVariables[0].manager.phoneNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Organization */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-4">Organization</h3>
                <div className="space-y-2">
                  <p className="font-medium">{venue.organization.organizationName}</p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    {venue.organization.contactEmail}
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {venue.organization.contactPhone}
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {venue.organization.address}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Location</h3>
              <div className="h-[300px] rounded-lg overflow-hidden">
                <MapPicker
                  value={{ lat: venue.latitude, lng: venue.longitude }}
                  onChange={() => {}} // Read-only mode
                  height="300px"
                  width="100%"
                />
              </div>
              <a 
                href={venue.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <MapPin className="w-4 h-4 mr-2" />
                View on Google Maps
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { X, Plus, ChevronLeft, ChevronRight, Check, Loader2, Calendar, Clock, MapPin, User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Footer from '@/components/footer';
import { Header } from '@/components/header';
import ApiService from '@/api/apiConfig';
import { toast } from 'sonner';

interface Guest {
  guestName: string;
  guestPhoto?: File | string;
}

interface BookingDate {
  date: string;
  startTime?: string;
  endTime?: string;
}

interface FormData {
  eventTitle: string;
  eventDescription: string;
  eventType: string;
  eventPhoto?: File | string;
  maxAttendees: string;
  guests: Guest[];
  isEntryPaid: boolean;
  specialNotes: string;
  expectedGuests: string;
  socialMediaLinks: string;
  bookingDates: BookingDate[];
  startTime: string;
  endTime: string;
}

interface VenueData {
  venueId: string;
  venueName: string;
  bookingType: string;
  capacity: number;
  venueLocation: string;
}

interface OrganizerData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

const EventDetailsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const totalSteps = 4;

  // Venue and organizer data
  const [venueData, setVenueData] = useState<VenueData | null>(null);
  const [organizerData, setOrganizerData] = useState<OrganizerData | null>(null);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    eventTitle: '',
    eventDescription: '',
    eventType: '',
    eventPhoto: '',
    maxAttendees: '',
    guests: [],
    isEntryPaid: false,
    specialNotes: '',
    expectedGuests: '',
    socialMediaLinks: '',
    bookingDates: [],
    startTime: '',
    endTime: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch event data on component mount
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await ApiService.getEventById(eventId);
        
        if (response.success && response.data) {
          const eventData = response.data;
          
          // Extract venue data
          if (eventData.eventVenues && eventData.eventVenues.length > 0) {
            const venue = eventData.eventVenues[0].venue;
            setVenueData({
              venueId: venue.venueId,
              venueName: venue.venueName,
              bookingType: venue.bookingType,
              capacity: venue.capacity,
              venueLocation: venue.venueLocation
            });
          }

          // Extract organizer data
          if (eventData.organizer) {
            setOrganizerData({
              userId: eventData.organizer.userId,
              firstName: eventData.organizer.firstName,
              lastName: eventData.organizer.lastName,
              email: eventData.organizer.email,
              phoneNumber: eventData.organizer.phoneNumber
            });
          }
          
          // Transform API data to form data
          setFormData({
            eventTitle: eventData.eventName || '',
            eventDescription: eventData.eventDescription || '',
            eventType: eventData.eventType || '',
            eventPhoto: eventData.eventPhoto || '',
            maxAttendees: eventData.maxAttendees?.toString() || '',
            guests: eventData.eventGuests?.map((guest: any) => ({
              guestName: guest.guestName || '',
              guestPhoto: guest.guestPhoto || ''
            })) || [],
            isEntryPaid: eventData.isEntryPaid || false,
            specialNotes: eventData.specialNotes || '',
            expectedGuests: eventData.expectedGuests?.toString() || '',
            socialMediaLinks: eventData.socialMediaLinks || '',
            bookingDates: eventData.bookingDates || [],
            startTime: '', // Will be set from booking dates if available
            endTime: ''    // Will be set from booking dates if available
          });
        } else {
          setError('Failed to load event data');
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event data');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleGuestChange = (index: number, field: keyof Guest, value: any) => {
    setFormData(prev => ({
      ...prev,
      guests: prev.guests.map((guest, i) => 
        i === index ? { ...guest, [field]: value } : guest
      )
    }));
  };

  const addGuest = () => {
    setFormData(prev => ({
      ...prev,
      guests: [...prev.guests, { guestName: '', guestPhoto: undefined }]
    }));
  };

  const removeGuest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      guests: prev.guests.filter((_, i) => i !== index)
    }));
  };

  const handleCreateEvent = async () => {
    setProcessing(true);
    
    try {
      // Check if we have files to upload
      const hasEventPhoto = formData.eventPhoto instanceof File;
      const hasGuestPhotos = formData.guests.some(guest => guest.guestPhoto instanceof File);
      
      if (hasEventPhoto || hasGuestPhotos) {
        // Use FormData for file uploads
        const formDataToSend = new FormData();
        
        // Add text fields
        formDataToSend.append('eventName', formData.eventTitle);
        formDataToSend.append('eventDescription', formData.eventDescription);
        formDataToSend.append('maxAttendees', formData.maxAttendees);
        formDataToSend.append('isEntryPaid', formData.isEntryPaid.toString());
        formDataToSend.append('specialNotes', formData.specialNotes);
        formDataToSend.append('expectedGuests', formData.expectedGuests);
        formDataToSend.append('socialMediaLinks', formData.socialMediaLinks);
        formDataToSend.append('startTime', formData.startTime);
        formDataToSend.append('endTime', formData.endTime);
        
        // Add guests data as JSON string
        const guestsData = formData.guests.map(guest => ({
          guestName: guest.guestName
        }));
        formDataToSend.append('guests', JSON.stringify(guestsData));
        
        // Add event photo if it's a File - use 'eventPhoto' field name
        if (hasEventPhoto) {
          formDataToSend.append('eventPhoto', formData.eventPhoto as File);
        }
        
        // Add guest photos if they are Files - use 'guestPhotos' for each file
        formData.guests.forEach((guest, index) => {
          if (guest.guestPhoto instanceof File) {
            formDataToSend.append('guestPhotos', guest.guestPhoto as File);
          }
        });
        
        // Call updateEventById API with FormData
        const response = await ApiService.updateEventById(eventId, formDataToSend);
        
        if (response.success) {
          toast.success('Event updated successfully!');
          setSuccess(true);
        } else {
          toast.error(response.message || 'Failed to update event');
        }
      } else {
        // Use JSON for non-file data
        const updateData = {
          eventName: formData.eventTitle,
          eventDescription: formData.eventDescription,
          eventPhoto: formData.eventPhoto,
          maxAttendees: parseInt(formData.maxAttendees),
          isEntryPaid: formData.isEntryPaid,
          specialNotes: formData.specialNotes,
          expectedGuests: parseInt(formData.expectedGuests),
          socialMediaLinks: formData.socialMediaLinks,
          startTime: formData.startTime,
          endTime: formData.endTime,
          guests: formData.guests.map(guest => ({
            guestName: guest.guestName
          })),
          guestPhotos: formData.guests
            .filter(guest => guest.guestPhoto)
            .map(guest => guest.guestPhoto)
        };

        // Call updateEventById API with JSON
        const response = await ApiService.updateEventById(eventId, updateData);
        
        if (response.success) {
          toast.success('Event updated successfully!');
          setSuccess(true);
        } else {
          toast.error(response.message || 'Failed to update event');
        }
      }
    } catch (error: any) {
      console.error('Error updating event:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to update event';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleInvitePeople = () => {
  }

  const handlePublishRequest = async () => {
    try {
      setProcessing(true);
      const response = await ApiService.requestEventPublication(eventId, {});
      
      if (response.success) {
        toast.success('Event publication request sent successfully!');
        setTimeout(() => {
          router.push('/user-dashboard/events');
        }, 1500);
      } else {
        toast.error(response.message || 'Failed to send publication request');
      }
    } catch (error: any) {
      console.error('Error requesting event publication:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to send publication request';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  }

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.eventTitle.trim()) newErrors.eventTitle = 'Event title is required';
        if (!formData.eventDescription.trim()) newErrors.eventDescription = 'Event description is required';
        break;
      case 2:
        if (!formData.eventPhoto) newErrors.eventPhoto = 'Event photo is required';
        if (!formData.maxAttendees || parseInt(formData.maxAttendees) <= 0) {
          newErrors.maxAttendees = 'Valid maximum attendees is required';
        }
        if (!formData.startTime) newErrors.startTime = 'Start time is required';
        if (!formData.endTime) newErrors.endTime = 'End time is required';
        break;
      case 3:
        if (formData.guests.length === 0) {
          newErrors.guests = 'At least one guest is required';
        } else {
          formData.guests.forEach((guest, index) => {
            if (!guest.guestName.trim()) {
              newErrors[`guestName-${index}`] = 'Guest name is required';
            }
          });
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
              <p className="text-gray-600">Let's start with the essential details about your event</p>
            </div>

            <div className="space-y-6">
              {/* Event Title */}
              <div>
                <Label htmlFor="eventTitle" className="text-base font-medium">
                  Event Title *
                </Label>
                <Input
                  id="eventTitle"
                  value={formData.eventTitle}
                  onChange={(e) => handleInputChange("eventTitle", e.target.value)}
                  placeholder="Enter event title"
                  className="mt-2 h-12 text-base"
                />
                {errors.eventTitle && <p className="text-sm text-red-500 mt-1">{errors.eventTitle}</p>}
              </div>

              {/* Event Description */}
              <div>
                <Label htmlFor="eventDescription" className="text-base font-medium">
                  Event Description *
                </Label>
                <Textarea
                  id="eventDescription"
                  value={formData.eventDescription}
                  onChange={(e) => handleInputChange("eventDescription", e.target.value)}
                  placeholder="Describe your event"
                  rows={4}
                  className="mt-2 text-base"
                />
                {errors.eventDescription && <p className="text-sm text-red-500 mt-1">{errors.eventDescription}</p>}
              </div>

              {/* Event Type - Disabled */}
              <div>
                <Label className="text-base font-medium">Event Type *</Label>
                <div className="mt-2 h-12 bg-gray-50 border border-gray-200 rounded-md px-3 flex items-center">
                  <span className="text-gray-900 font-medium">
                    {formData.eventType ? 
                      formData.eventType.charAt(0).toUpperCase() + formData.eventType.slice(1).toLowerCase() : 
                      'Not specified'
                    }
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Event type cannot be changed after creation</p>
              </div>

              {/* Organizer Information - Read Only */}
              {organizerData && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <Label className="text-base font-medium">Event Organizer</Label>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium">{organizerData.firstName} {organizerData.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium">{organizerData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="text-sm font-medium">{organizerData.phoneNumber}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Dates - Read Only */}
              {formData.bookingDates.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <Label className="text-base font-medium">Booked Dates</Label>
                  </div>
                  <div className="space-y-2">
                    {formData.bookingDates.map((bookingDate, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {formatDate(bookingDate.date)}
                        </Badge>
                        {venueData?.bookingType === 'HOURLY' && bookingDate.startTime && bookingDate.endTime && (
                          <span className="text-sm text-gray-600">
                            {bookingDate.startTime} - {bookingDate.endTime}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Booking dates cannot be changed after creation
                  </p>
                </div>
              )}

              {/* Venue Information */}
              {venueData && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <Label className="text-base font-medium">Venue Information</Label>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Venue:</span>
                      <span className="text-sm font-medium">{venueData.venueName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm font-medium">{venueData.venueLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Capacity:</span>
                      <span className="text-sm font-medium">{venueData.capacity} people</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Booking Type:</span>
                      <Badge variant="outline" className="text-xs">
                        {venueData.bookingType}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Event Details & Timing</h2>
              <p className="text-gray-600">Add photos, capacity, and set event timing</p>
            </div>

            <div className="space-y-6">
              {/* Event Photo */}
              <div>
                <Label className="text-base font-medium">Event Photo *</Label>
                <div className="mt-2">
                  {formData.eventPhoto ? (
                    <div className="relative">
                      <div className="relative h-48 w-full rounded-lg overflow-hidden">
                        <img
                          src={
                            typeof formData.eventPhoto === "string"
                              ? formData.eventPhoto
                              : URL.createObjectURL(formData.eventPhoto)
                          }
                          alt="Event preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleInputChange("eventPhoto", undefined)}
                        className="mt-3 bg-transparent"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove Photo
                      </Button>
                    </div>
                  ) : (
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleInputChange("eventPhoto", file)
                      }}
                      className="block w-full border border-gray-300 rounded-lg p-2 text-base mt-2"
                      id="eventPhoto"
                    />
                  )}
                </div>
                {errors.eventPhoto && <p className="text-sm text-red-500 mt-1">{errors.eventPhoto}</p>}
              </div>

              {/* Maximum Attendees */}
              <div>
                <Label htmlFor="maxAttendees" className="text-base font-medium">
                  Maximum Attendees *
                </Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  value={formData.maxAttendees}
                  onChange={(e) => handleInputChange("maxAttendees", e.target.value)}
                  placeholder="Enter maximum number of attendees"
                  className={`mt-2 h-12 text-base ${errors.maxAttendees ? "border-red-500" : ""}`}
                />
                {errors.maxAttendees && <p className="text-sm text-red-500 mt-1">{errors.maxAttendees}</p>}
                {venueData && (
                  <p className="text-sm text-gray-500 mt-1">Venue capacity: {venueData.capacity} people</p>
                )}
              </div>

              {/* Event Timing */}
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <Label className="text-base font-medium">Event Timing</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime" className="text-sm font-medium">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange("startTime", e.target.value)}
                      className="mt-2 h-12"
                    />
                    {errors.startTime && <p className="text-sm text-red-500 mt-1">{errors.startTime}</p>}
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-sm font-medium">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange("endTime", e.target.value)}
                      className="mt-2 h-12"
                    />
                    {errors.endTime && <p className="text-sm text-red-500 mt-1">{errors.endTime}</p>}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Set the start and end time for your event on the booked dates
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Guests & Settings</h2>
              <p className="text-gray-600">Add featured guests and configure event settings</p>
            </div>

            <div className="space-y-6">
              {/* Featured Guests */}
              <div>
                   {/* Expected Guests */}
              <div>
                <Label className="text-base font-medium">Expected Guests</Label>
                <Input
                  type="number"
                  value={formData.expectedGuests}
                  onChange={(e) => handleInputChange("expectedGuests", e.target.value)}
                  placeholder="Expected number of guests (optional)"
                  className="mt-2 text-base"
                />
              </div>
                <Label className="text-base font-medium">Featured Guests *</Label>
                <div className="mt-2 space-y-4">
                  {formData.guests.map((guest, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Guest {index + 1}</h4>
                        {formData.guests.length > 1 && (
                          <Button variant="outline" size="sm" onClick={() => removeGuest(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`guestName-${index}`}>Guest Name</Label>
                          <Input
                            id={`guestName-${index}`}
                            value={guest.guestName}
                            onChange={(e) => handleGuestChange(index, "guestName", e.target.value)}
                            placeholder="Enter guest name"
                            className="mt-1 h-10"
                          />
                          {errors[`guestName-${index}`] && <p className="text-sm text-red-500 mt-1">{errors[`guestName-${index}`]}</p>}
                        </div>
                        <div>
                          <Label htmlFor={`guestPhoto-${index}`}>Guest Photo</Label>
                          <div className="flex items-center gap-3 mt-1">
                            {guest.guestPhoto && (
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={
                                    typeof guest.guestPhoto === "string"
                                      ? guest.guestPhoto
                                      : URL.createObjectURL(guest.guestPhoto)
                                  }
                                />
                                <AvatarFallback>
                                  {guest.guestName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleGuestChange(index, "guestPhoto", file)
                              }}
                              id={`guestPhoto-${index}`}
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addGuest} className="w-full h-12 border-dashed bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Guest
                  </Button>
                </div>
                {errors.guests && <p className="text-sm text-red-500 mt-1">{errors.guests}</p>}
              </div>

              {/* Entry Type */}
              <div>
                <Label className="text-base font-medium">Is Entry Paid?</Label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="isEntryPaid"
                      checked={!formData.isEntryPaid}
                      onChange={() => handleInputChange("isEntryPaid", false)}
                    />
                    Free Entry
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="isEntryPaid"
                      checked={formData.isEntryPaid}
                      onChange={() => handleInputChange("isEntryPaid", true)}
                    />
                    Paid Entry
                  </label>
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <Label className="text-base font-medium">Special Notes</Label>
                <Textarea
                  value={formData.specialNotes}
                  onChange={(e) => handleInputChange("specialNotes", e.target.value)}
                  placeholder="Any special notes for this event (optional)"
                  rows={2}
                  className="mt-2 text-base"
                />
              </div>

           

              {/* Social Media Links */}
              <div>
                <Label className="text-base font-medium">Social Media Links</Label>
                <Input
                  type="text"
                  value={formData.socialMediaLinks}
                  onChange={(e) => handleInputChange("socialMediaLinks", e.target.value)}
                  placeholder="e.g. https://twitter.com/your-event, https://facebook.com/your-event (optional)"
                  className="mt-2 text-base"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>
              <p className="text-gray-600">Review your event details before updating</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold">Event Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Event Title:</span>
                    <p className="font-medium">{formData.eventTitle}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Event Type:</span>
                    <p className="font-medium">{formData.eventType}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Max Attendees:</span>
                    <p className="font-medium">{formData.maxAttendees}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Entry Type:</span>
                    <p className="font-medium">{formData.isEntryPaid ? 'Paid Entry' : 'Free Entry'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Start Time:</span>
                    <p className="font-medium">{formData.startTime || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">End Time:</span>
                    <p className="font-medium">{formData.endTime || 'Not set'}</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-500">Description:</span>
                  <p className="text-sm mt-1">{formData.eventDescription}</p>
                </div>

                <div>
                  <span className="text-sm text-gray-500">Featured Guests:</span>
                  <div className="mt-1 space-y-1">
                    {formData.guests.map((guest, index) => (
                      <p key={index} className="text-sm">• {guest.guestName}</p>
                    ))}
                  </div>
                </div>

                {formData.specialNotes && (
                  <div>
                    <span className="text-sm text-gray-500">Special Notes:</span>
                    <p className="text-sm mt-1">{formData.specialNotes}</p>
                  </div>
                )}

                {venueData && (
                  <div>
                    <span className="text-sm text-gray-500">Venue:</span>
                    <p className="text-sm mt-1">{venueData.venueName} - {venueData.venueLocation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Event details & organizer' },
    { number: 2, title: 'Event Details', description: 'Photo, capacity & timing' },
    { number: 3, title: 'Guests & Settings', description: 'Guests and configuration' },
    { number: 4, title: 'Review', description: 'Review and submit' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600">Loading event details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Error Loading Event</h2>
            <p className="text-gray-600">{error}</p>
                         <Button onClick={() => router.back()} variant="outline">
               Go Back
             </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Event Setup Successfully!</h2>
              <p className="text-gray-600">
                Your event has been setedup successfully. If you want to publish your event, create tickets or Invite people.
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Event Details</p>
                <p className="text-lg font-semibold text-gray-900">{formData.eventTitle}</p>
                <p className="text-sm text-gray-500">{formData.eventType}</p>
              </div>
              <div className="flex gap-4 pt-6">
                <Button 
                  variant="ghost" 
                  className="flex-1 h-12 bg-transparent" 
                  onClick={() => router.push("/user-dashboard/events")}
                >
                  Cancel
                </Button>
              
                
                {!formData.isEntryPaid ? (
                  <Button 
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700" 
                    onClick={handlePublishRequest}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      'Publish Event'
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700" 
                    onClick={() => router.push(`/events/${eventId}/create-ticket`)}
                  >
                    Create Event Ticket
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Event Setup</h1>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step.number === currentStep
                        ? "bg-blue-500 border-blue-500 text-white"
                        : step.number < currentStep
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 text-gray-500"
                    }`}
                  >
                    {step.number < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.number}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${
                      step.number === currentStep ? "text-blue-600" : 
                      step.number < currentStep ? "text-green-600" : "text-gray-500"
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      step.number < currentStep ? "bg-green-500" : "bg-gray-300"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-md p-8  border-2 border-blue-200">
            {renderStepContent()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={prevStep} 
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-3">
                {currentStep < totalSteps ? (
                  <Button 
                    onClick={nextStep} 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <>
                                         <Button 
                       variant="ghost" 
                       onClick={() => router.push("/venues")}
                       className="bg-transparent"
                     >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateEvent}
                      disabled={processing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Event Setup...
                        </>
                      ) : (
                        'Event Setup '
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default EventDetailsPage;
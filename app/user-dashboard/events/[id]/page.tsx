"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, useParams } from "next/navigation"
import { Key, useEffect, useState } from "react"
import { ArrowLeft, Calendar, MapPin, Users, Edit, Share2, Trash2, DollarSign, AlertCircle, Home, Ticket, CheckCircle, Building2, Building2Icon, Eye, Pencil, Twitter, Facebook, Linkedin } from "lucide-react"
import Link from "next/link"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import ApiService from "@/api/apiConfig"
import EventTicketsManagement from "./event-tickets-management"
import AttendancePage from "./event-attendance"



export default function EventDetails({ params }: { params: { id: string } }) {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState("guests")
  const [isLoaded, setIsLoaded] = useState(false)
  // Pagination state for guests
  const [guestPage, setGuestPage] = useState(1)
  const GUESTS_PER_PAGE = 5

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch event data from API
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        if (!id) {
          return;
        }
        setLoading(true);
        const eventId = Array.isArray(id) ? id[0] : id;
        
        const response = await ApiService.getEventById(eventId);
        console.log("event data", response); // Console log the response
        
        if (response && response.success && response.data) {
          setEvent(response.data);
        } else {
          console.log("API call failed or no data"); // Debug: Check failure case
          setEvent(null);
        }
      } catch (error) {
        console.log("API call failed with error:", error); // Debug: Check error
        setEvent(null);
      } finally {
        console.log("API call completed, setting loading to false"); // Debug: Check completion
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  const handleDelete = () => {
    // In a real app, this would be an API call to delete the event
    setTimeout(() => {
      router.push("/user-dashboard/events")
    }, 1000)
  }

  if (!isLoggedIn || !user) {
    return <div>Loading...</div>
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="p-8">
        <Link href="/user-dashboard/events" className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Link>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Link href="/user-dashboard/events" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Return to Events
          </Link>
        </div>
      </div>
    )
  }

  // Pagination for guests
  const guests = event.eventGuests || [];
  const totalGuestPages = Math.ceil(guests.length / GUESTS_PER_PAGE)
  const paginatedGuests = guests.slice((guestPage - 1) * GUESTS_PER_PAGE, guestPage * GUESTS_PER_PAGE)

  // Mock attendees and tickets data (if you want to keep them for now)
  const attendeesData = [];
  const ticketsData = [];

  return (
    <div className="p-4 md:p-8">
      <div className={`transform transition-all duration-1000 ease-out ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
        {/* Event Header - Mobile Responsive */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col gap-4 mb-4">
            <div>
              <Link href="/user-dashboard/events" className="text-blue-600 hover:underline flex items-center text-sm md:text-base">
                <ArrowLeft className="mr-2 h-4 w-4 md:h-5 md:w-5" /> Back to Events
              </Link>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mt-2">
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 break-words">{event.eventName}</h1>
                <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                  event.isEntryPaid ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                }`}>
                  {event.isEntryPaid ? "Payable" : "Free Entrance"}
                </span>
              </div>
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 md:hidden">
              <Link 
                href={`/user-dashboard/events/${event.eventId}/edit`} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
              {!event.isEntryPaid && (
                <Link 
                  href={`/events/check-invitation`} className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"  >
                    
                  <CheckCircle className="mr-2 h-4 w-4" /> Check Invitation
               
                  </Link>
              )}
              {event.isEntryPaid && (
                <Link 
                  href={`/user-dashboard/events/${event.eventId}/eventTicket/create`}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
                >
                  <Ticket className="mr-2 h-4 w-4" /> Create Ticket
                </Link>
              )}
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-2">
              <Link href={`/user-dashboard/events/${event.eventId}/edit`} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center">
                <Edit className="mr-2 h-5 w-5" /> Edit
              </Link>
              {!event.isEntryPaid && (
                <Link 
                  href={`/events/check-invitation`}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
                >
                  <CheckCircle className="mr-2 h-5 w-5" /> Check Invitation
                </Link>
              )}
              {event.isEntryPaid && (
                <Link 
                  href={`/user-dashboard/events/${event.eventId}/eventTicket/create`}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
                >
                  <Ticket className="mr-2 h-5 w-5" /> Create Ticket
                </Link>
              )}
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md flex items-center">
                <Share2 className="mr-2 h-5 w-5" /> Share
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
              >
                <Trash2 className="mr-2 h-5 w-5" /> Delete
              </button>
            </div>
          </div>
          
          {/* Event Location and Date - Mobile Responsive */}
          <div className="flex flex-col md:flex-row md:items-center text-gray-600 mt-2 space-y-2 md:space-y-0">
            <div className="flex items-center text-sm md:text-base">
              <MapPin className="mr-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              <span className="break-words">
                {event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.venueName : ""}, {event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.venueLocation : ""}
              </span>
            </div>
            <span className="hidden md:block mx-3">|</span>
            <div className="flex items-center text-sm md:text-base">
              <Calendar className="mr-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              <span className="break-words">
                {event.bookingDates && event.bookingDates.length > 0 ? 
                  event.bookingDates.map((date: any) => new Date(date.date).toLocaleDateString()).join(', ') : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Event Image - Mobile Responsive */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6 md:mb-8">
          <div className="h-48 md:h-80 bg-gray-200 relative">
            <img
              src={event.eventPhoto || "/placeholder.svg?height=400&width=800"}
              alt={event.eventName}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 md:top-4 right-2 md:right-4 flex gap-1 md:gap-2">
              <span
                className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                  event.eventStatus === "PUBLISHED" ? "bg-green-100 text-green-800" : 
                  event.eventStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" : 
                  "bg-red-100 text-red-800"
                }`}
              >
                {event.eventStatus}
              </span>
            </div>
            {event.eventType && (
              <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-black bg-opacity-50 text-white px-2 md:px-3 py-1 md:py-2 rounded-md">
                <p className="text-xs md:text-sm font-medium">{event.eventType}</p>
              </div>
            )}
          </div>
        </div>

        {/* Event Description - Mobile Responsive */}
        <div className="w-full bg-white rounded-lg shadow p-4 md:p-8 mb-6 md:mb-8">
          <div className="">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2 md:mb-0">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                  <span className="text-sm md:text-lg font-semibold">
                    {event.bookingDates && event.bookingDates.length > 0 ? 
                      event.bookingDates.map((date: any) => new Date(date.date).toLocaleDateString()).join(', ') : "No dates"}
                  </span>
                </div>
                <span className="hidden md:block mx-2">|</span>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                  <span className="text-sm md:text-lg font-semibold break-words">
                    {event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.venueName : "Venue Name"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
                <span className="text-sm md:text-lg font-semibold">Max {event.maxAttendees} Attendees</span>
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">About This Event</h2>
            <p className="text-gray-700 text-sm md:text-lg leading-relaxed whitespace-pre-line mb-4 break-words">{event.eventDescription}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
              <div>
                <p className="text-xs md:text-sm text-gray-500">Type</p>
                <p className="font-medium text-sm md:text-base break-words">{event.eventType}</p>
              </div>
                {event.startTime && (
              <div><span className="font-medium">Start Time:</span> {event.startTime}</div>
            )}
            {event.endTime && (
              <div><span className="font-medium">End Time:</span> {event.endTime}</div>
            )}
              <div>
                <p className="text-xs md:text-sm text-gray-500">Visibility</p>
                <p className="font-medium text-sm md:text-base break-words">{event.visibilityScope}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Special Notes</p>
                <p className="font-medium text-sm md:text-base break-words">{event.specialNotes}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500 mb-1">Social Media Links</p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const getSocialIcon = (url: string | string[]) => {
                      if (url.includes("twitter.com")) return <Twitter className="h-4 w-4 text-blue-400" />;
                      if (url.includes("facebook.com")) return <Facebook className="h-4 w-4 text-blue-600" />;
                      if (url.includes("linkedin.com")) return <Linkedin className="h-4 w-4 text-blue-700" />;
                      return null;
                    };
                    let links = [];
                    try {
                      links = JSON.parse(event.socialMediaLinks);
                      if (!Array.isArray(links)) throw new Error();
                    } catch {
                      links = event.socialMediaLinks
                        .replace(/[\[\]"]/g, "")
                        .split(",")
                        .map((l: string) => l.trim())
                        .filter(Boolean);
                    }
                    return links
                      .filter((link: any): link is string => typeof link === "string" && link.trim() !== "")
                      .map((link: string, idx: number) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 hover:bg-blue-50 text-blue-700 text-xs md:text-sm font-medium transition"
                        >
                          {getSocialIcon(link)}
                          {link.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                        </a>
                      ));
                  })()}
                </div>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Created On</p>
                <p className="font-medium text-sm md:text-base">{event.createdAt ? new Date(event.createdAt).toLocaleString() : ""}</p>
              </div>
            </div>
          </div>
        
          <div className="pt-6 md:pt-8">
            <h3 className="text-base md:text-lg font-semibold mb-4">Venue Information</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div>
                <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4">
                  <h4 className="font-semibold text-base md:text-lg mb-2 break-words">
                    {event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.venueName : "Venue Name"}
                  </h4>
                  <p className="text-gray-700 mb-3 text-sm md:text-base break-words">
                    {event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.description || "No description available" : "No venue information"}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                      <span className="text-xs md:text-sm">Capacity: {event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.capacity : 0} people</span>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-xs md:text-sm break-words">Location: {event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.venueLocation : "Location not available"}</span>
                    </div>
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                      <span className="text-xs md:text-sm break-words">Booking Type: {event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.bookingType : "Not specified"}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {event.eventVenues && event.eventVenues[0] && event.eventVenues[0].venue.googleMapsLink && (
                    <a 
                      href={event.eventVenues[0].venue.googleMapsLink}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm md:text-base"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      View on Google Maps
                    </a>
                  )}
                </div>
              </div>
              <div>
                <img 
                  src={event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.mainPhotoUrl : "/placeholder.svg"} 
                  alt={event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.venueName : "Venue"} 
                  className="w-full h-48 md:h-64 object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Tabs Section - Mobile Responsive */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation - Mobile Responsive */}
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto px-4 md:px-6">
              <button
                onClick={() => setActiveTab("guests")}
                className={`py-3 md:py-4 px-2 md:px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "guests"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Guests ({guests.length})
              </button>
              <button
                onClick={() => setActiveTab("attendees")}
                className={`py-3 md:py-4 px-2 md:px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "attendees"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Attendees
              </button>
              {event.isEntryPaid && (
                <button
                  onClick={() => setActiveTab("tickets")}
                  className={`py-3 md:py-4 px-2 md:px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "tickets"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Tickets
                </button>
              )}
            </nav>
          </div>
          
          {/* Tab Content - Mobile Responsive */}
          <div className="p-4 md:p-6">
            {activeTab === "guests" && (
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-4">Event Guests</h3>
                
                {/* Mobile Card Layout for Guests */}
                <div className="md:hidden space-y-4">
                  {paginatedGuests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p>No guests found.</p>
                    </div>
                  ) : (
                    paginatedGuests.map((guest: any) => (
                      <div key={guest.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-3">
                          {guest.guestPhoto ? (
                            <img 
                              src={guest.guestPhoto} 
                              alt={guest.guestName} 
                              className="h-12 w-12 rounded-full object-cover flex-shrink-0" 
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                              <Users className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{guest.guestName}</h4>
                            <p className="text-sm text-gray-500">
                              {guest.createdAt ? new Date(guest.createdAt).toLocaleString() : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop Table for Guests */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Photo</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedGuests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-gray-500">No guests found.</TableCell>
                        </TableRow>
                      ) : (
                        paginatedGuests.map((guest: any) => (
                          <TableRow key={guest.id}>
                            <TableCell>{guest.guestName}</TableCell>
                            <TableCell>
                              {guest.guestPhoto ? (
                                <img src={guest.guestPhoto} alt={guest.guestName} className="h-12 w-12 rounded-full object-cover" />
                              ) : (
                                <span className="text-gray-400">No photo</span>
                              )}
                            </TableCell>
                            <TableCell>{guest.createdAt ? new Date(guest.createdAt).toLocaleString() : ""}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination - Mobile Responsive */}
                {totalGuestPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent className="flex flex-wrap justify-center gap-1 md:gap-2">
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={e => {
                              e.preventDefault()
                              setGuestPage(p => Math.max(1, p - 1))
                            }}
                            aria-disabled={guestPage === 1}
                            className="text-sm md:text-base"
                          />
                        </PaginationItem>
                        
                        {/* Show limited page numbers on mobile */}
                        {Array.from({ length: totalGuestPages }, (_, i) => {
                          const pageNumber = i + 1
                          const isVisible = 
                            pageNumber === 1 || 
                            pageNumber === totalGuestPages || 
                            (pageNumber >= guestPage - 1 && pageNumber <= guestPage + 1)
                          
                          if (!isVisible) {
                            if (pageNumber === guestPage - 2 || pageNumber === guestPage + 2) {
                              return (
                                <PaginationItem key={`ellipsis-${pageNumber}`}>
                                  <span className="px-2 py-1 text-gray-500">...</span>
                                </PaginationItem>
                              )
                            }
                            return null
                          }
                          
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                href="#"
                                isActive={guestPage === pageNumber}
                                onClick={e => {
                                  e.preventDefault()
                                  setGuestPage(pageNumber)
                                }}
                                className="text-sm md:text-base min-w-[2rem] md:min-w-[2.5rem]"
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        })}
                        
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={e => {
                              e.preventDefault()
                              setGuestPage(p => Math.min(totalGuestPages, p + 1))
                            }}
                            aria-disabled={guestPage === totalGuestPages}
                            className="text-sm md:text-base"
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    
                    {/* Mobile page info */}
                    <div className="md:hidden text-center mt-2 text-sm text-gray-500">
                      Page {guestPage} of {totalGuestPages}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === "attendees" && (
              <div className="space-y-6">
                {/* Import and render the full attendance component */}
                <AttendancePage />
              </div>
            )}

            {/* Tickets tab section */}
            {activeTab === "tickets" && event.isEntryPaid && (
              <div className="space-y-4">
                <h3 className="text-base md:text-lg font-semibold">Event Tickets</h3>
                <EventTicketsManagement eventId={id as string} />
              </div>
            )}
          </div>
        </div>
      
        {/* Delete Confirmation Modal */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{event.eventName}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete Event</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

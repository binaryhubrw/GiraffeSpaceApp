"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Calendar, MapPin, Users, Edit, Share2, Trash2, DollarSign, AlertCircle, Home, Ticket, CheckCircle, Building2, Building2Icon, Eye, Pencil } from "lucide-react"
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import ApiService from "@/api/apiConfig"


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
    <div className="p-8">
      <div className={`transform transition-all duration-1000 ease-out ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
        {/* Event Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
            <div>
              <Link href="/user-dashboard/events" className="text-blue-600 hover:underline flex items-center">
                <ArrowLeft className="mr-2 h-5 w-5" /> Back to Events
              </Link>
              <div className="flex items-center gap-3 mt-2">
                <h1 className="text-3xl font-bold text-gray-800">{event.eventName}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${event.isEntryPaid ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>{event.isEntryPaid ? "Payable" : "Free Entrance"}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/user-dashboard/events/${event.eventId}/edit`} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center">
                <Edit className="mr-2 h-5 w-5" aria-label="Edit" /> Edit
              </Link>
              <button className="bg-green-500 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center">
                <Share2 className="mr-2 h-5 w-5" aria-label="Share" /> Share
              </button>
              {/* Registration/Buy Ticket Button */}
              <Link 
                href={`/user-dashboard/events/${event.eventId}/eventTicket/create`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
          
              >
                <Ticket className="mr-2 h-5 w-5" />
                create Ticket
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
              >
                <Trash2 className="mr-2 h-5 w-5" aria-label="Delete" /> Delete
              </button>
            </div>
          </div>
          <div className="flex items-center text-gray-600 mt-2">
            <MapPin className="mr-2 h-5 w-5" />
            <span>{event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.venueName : ""}, {event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.venueLocation : ""}</span>
            <span className="mx-3">|</span>
            <Calendar className="mr-2 h-5 w-5" />
            <span>{event.bookingDates && event.bookingDates.length > 0 ? 
              event.bookingDates.map((date: any) => new Date(date.date).toLocaleDateString()).join(', ') : ""}</span>
          </div>
        </div>

        {/* Debug Section - Raw API Response */}
        {/* The rawResponse state variable is removed, so this section is also removed. */}
        {/* Event Image */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="h-64 md:h-80 bg-gray-200 relative">
            <img
              src={event.eventPhoto || "/placeholder.svg?height=400&width=800"}
              alt={event.eventName}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${event.eventStatus === "PUBLISHED" ? "bg-green-100 text-green-800" : event.eventStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}
              >
                {event.eventStatus}
              </span>
            </div>
            {event.eventType && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-md">
                <p className="text-sm font-medium">{event.eventType}</p>
            </div>
            )}
          </div>
        </div>
        {/* Redesigned Event Description */}
        <div className="w-full bg-white rounded-lg shadow p-8  mb-8">
          <div className="">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div className="flex items-center gap-3 mb-4 md:mb-0">
                <Calendar className="h-6 w-6 text-blue-500" />
                <span className="text-lg font-semibold">
                  {event.bookingDates && event.bookingDates.length > 0 ? 
                    event.bookingDates.map((date: any) => new Date(date.date).toLocaleDateString()).join(', ') : "No dates"}
                </span>
                <span className="mx-2">|</span>
                <MapPin className="h-6 w-6 text-green-500" />
                <span className="text-lg font-semibold">{event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.venueName : "Venue Name"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-purple-500" />
                <span className="text-lg font-semibold">Max {event.maxAttendees} Attendees</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">About This Event</h2>
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line mb-4">{event.eventDescription}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{event.eventType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Visibility</p>
                <p className="font-medium">{event.visibilityScope}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Special Notes</p>
                <p className="font-medium">{event.specialNotes}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Social Media Links</p>
                <p className="font-medium">{event.socialMediaLinks}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created On</p>
                <p className="font-medium">{event.createdAt ? new Date(event.createdAt).toLocaleString() : ""}</p>
              </div>
            </div>
          </div>
        
          <div className="pt-8">
            <h3 className="text-lg font-semibold mb-4">Venue Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-lg mb-2">{event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.venueName : "Venue Name"}</h4>
                  <p className="text-gray-700 mb-3">{event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.description || "No description available" : "No venue information"}</p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">Capacity: {event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.capacity : 0} people</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">Location: {event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.venueLocation : "Location not available"}</span>
                    </div>
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">Booking Type: {event.eventVenues && event.eventVenues[0] ? event.eventVenues[0].venue.bookingType : "Not specified"}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {event.eventVenues && event.eventVenues[0] && event.eventVenues[0].venue.googleMapsLink && (
                    <a 
                      href={event.eventVenues[0].venue.googleMapsLink}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
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
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Tabs Section */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("guests")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "guests"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Guests ({guests.length})
              </button>
              <button
                onClick={() => setActiveTab("attendees")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "attendees"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Attendees
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "tickets"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Tickets
              </button>
            </nav>
          </div>
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "guests" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Event Guests</h3>
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
                {totalGuestPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={e => {
                              e.preventDefault()
                              setGuestPage(p => Math.max(1, p - 1))
                            }}
                            aria-disabled={guestPage === 1}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalGuestPages }, (_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              href="#"
                              isActive={guestPage === i + 1}
                              onClick={e => {
                                e.preventDefault()
                                setGuestPage(i + 1)
                              }}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={e => {
                              e.preventDefault()
                              setGuestPage(p => Math.min(totalGuestPages, p + 1))
                            }}
                            aria-disabled={guestPage === totalGuestPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
            {activeTab === "attendees" && (
              <div className="text-center text-gray-500 py-8">No attendees data available.</div>
            )}
            {activeTab === "tickets" && (
              <div className="text-center text-gray-500 py-8">No tickets data available.</div>
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

"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Calendar, Plus, Filter, ChevronDown, Users, MapPin, Clock, Send, MoreHorizontal } from "lucide-react"
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
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
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pencil, Eye, Trash2, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { isToday, isThisWeek, isThisMonth, parseISO, isAfter, isBefore } from "date-fns"
import ApiService from "@/api/apiConfig"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"


const EVENTS_PER_PAGE = 3

// Helper to determine event pay type
function getPayType(event: {
    id: string; name: string; date: string; venue: string; registrations: number; capacity: number; status: string;
    ticketPrice: number | string;
  }) {
  let price = event.ticketPrice !== undefined ? event.ticketPrice : "Free"
  if (typeof price === "string") price = price.trim()
  if (
    price === 0 ||
    price === "0" ||
    (typeof price === "string" && (price.toLowerCase() === "free" || price.toLowerCase() === "by invitation"))
  ) {
    return "Free Entrance"
  }
  return "Payable"
}

// Helper to determine if an event can request publication
function canRequestPublication(eventStatus: string): boolean {
  return eventStatus !== "PUBLISHED" && 
         eventStatus !== "PENDING_PUBLICATION" && 
         eventStatus !== "APPROVED"
}

export default function EventSection() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("my-events")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null)
  const [showCancelId, setShowCancelId] = useState<string | null>(null)
  const [showPublishRequestId, setShowPublishRequestId] = useState<string | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [eventNameFilter, setEventNameFilter] = useState("")
  const [payTypeFilter, setPayTypeFilter] = useState("all") // all, free, payable
  const [dateFilter, setDateFilter] = useState("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [showBookingCheckDialog, setShowBookingCheckDialog] = useState(false)

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    setLoading(true);
    ApiService.getAllEventByUserId(user.userId)
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setEvents(res.data)
        } else {
          setEvents([])
        }
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [isLoggedIn, user])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn || !user) {
    return <div>Loading...</div>
  }

  // Date filter logic
  const filteredByDate = events.filter(event => {
    const eventDate = event.bookingDates && event.bookingDates[0] && event.bookingDates[0].date
      ? parseISO(event.bookingDates[0].date)
      : null;
    if (!eventDate) return false;
    if (dateFilter === "today") {
      return isToday(eventDate)
    }
    if (dateFilter === "week" || dateFilter === "thisWeek") {
      return isThisWeek(eventDate, { weekStartsOn: 1 })
    }
    if (dateFilter === "month" || dateFilter === "thisMonth") {
      return isThisMonth(eventDate)
    }
    if (dateFilter === "custom") {
      if (customStartDate && customEndDate) {
        const start = parseISO(customStartDate)
        const end = parseISO(customEndDate)
        return (isAfter(eventDate, start) || eventDate.getTime() === start.getTime()) &&
               (isBefore(eventDate, end) || eventDate.getTime() === end.getTime())
      }
      return true
    }
    return true
  })

  // Filter events based on status, name, and pay type
  const filteredEvents = (statusFilter === "all" ? filteredByDate : filteredByDate.filter((event) => (event.eventStatus || "").toLowerCase() === statusFilter.toLowerCase()))
    .filter((event) =>
      eventNameFilter.trim() === "" || (event.eventName || "").toLowerCase().includes(eventNameFilter.trim().toLowerCase())
    )
    .filter((event) => {
      if (payTypeFilter === "all") return true
      let price = (event.ticketPrice !== undefined ? event.ticketPrice : "Free")
      if (typeof price === "string") price = price.trim()
      if (payTypeFilter === "free") {
        return price === 0 || price === "0" || (typeof price === "string" && (price.toLowerCase() === "free" || price.toLowerCase() === "by invitation"))
      } else if (payTypeFilter === "payable") {
        return !(price === 0 || price === "0" || (typeof price === "string" && (price.toLowerCase() === "free" || price.toLowerCase() === "by invitation")))
      }
      return true
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE)
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE
  )

  // Action handlers
  const handleCreateEventClick = () => {
    setShowBookingCheckDialog(true)
  }

  const handleBookingDialogCancel = () => {
    setShowBookingCheckDialog(false)
  }

  const handleBookingDialogBookVenue = () => {
    setShowBookingCheckDialog(false)
    router.push("/venues")
  }
  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.eventId !== id))
    setShowDeleteId(null)
  }
  const handleCancel = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.eventId === id ? { ...e, eventStatus: "CANCELLED" } : e
      )
    )
    setShowCancelId(null)
  }

  const handlePublishRequest = async (eventId: string) => {
    try {
      // You can customize the data sent for the publish request
      const requestData = {
        status: "PENDING_PUBLICATION",
        requestDate: new Date().toISOString(),
        notes: "User requested event publication"
      }
      
      // Call the API to request publication
      const response = await ApiService.requestEventPublication(eventId, requestData)
      
      if (response.success) {
        // Update the local state to reflect the status change
        setEvents((prev) =>
          prev.map((e) =>
            e.eventId === eventId ? { ...e, eventStatus: "PENDING_PUBLICATION" } : e
          )
        )
        toast.success("Publication request sent successfully!")
      } else {
        toast.error("Failed to send publication request")
      }
    } catch (error) {
      console.error("Error requesting publication:", error)
      toast.error("Failed to send publication request")
    } finally {
      setShowPublishRequestId(null)
    }
  }

  // Stats for the dashboard
  const totalPayable = events.filter(e => getPayType(e) === "Payable").length
  const totalFree = events.filter(e => getPayType(e) === "Free Entrance").length
  const stats = {
    totalEvents: events.length,
    totalEventsChange: "+12%",
    totalAttendees: 1892,
    totalAttendeesChange: "+5%",
    venuesUsed: 12,
    venuesUsedChange: "+2",
    upcomingEvents: 8,
    upcomingEventsPeriod: "Next 30 days",
    totalPayable,
    totalFree,
  }

  // In the render, show a loading spinner or message if loading is true
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-lg text-gray-500">Loading events...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className={`transform transition-all duration-1000 ease-out ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Organizer Dashboard</h1>
            <p className="text-gray-600 text-sm md:text-base">Manage your events and track performance</p>
          </div>

          <div className="w-full md:w-auto">
            <button
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full md:w-auto"
              onClick={handleCreateEventClick}
            >
              <Plus className="h-4 w-4" />
              Create Event
            </button>
          </div>
        </div>

        {/* Stats Cards - Mobile Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="border rounded-lg p-3 md:p-6 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-xs md:text-sm mb-1">Total Events</p>
                <h2 className="text-xl md:text-3xl font-bold">{stats.totalEvents}</h2>
                <p className="text-gray-600 text-xs md:text-sm">{stats.totalEventsChange}</p>
              </div>
              <Calendar className="h-4 md:h-5 w-4 md:w-5 text-gray-400" />
            </div>
          </div>
          <div className="border rounded-lg p-3 md:p-6 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-xs md:text-sm mb-1">Total Attendees</p>
                <h2 className="text-xl md:text-3xl font-bold">{stats.totalAttendees}</h2>
                <p className="text-gray-600 text-xs md:text-sm">{stats.totalAttendeesChange}</p>
              </div>
              <Users className="h-4 md:h-5 w-4 md:w-5 text-gray-400" />
            </div>
          </div>
          <div className="border rounded-lg p-3 md:p-6 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-xs md:text-sm mb-1">Venues Used</p>
                <h2 className="text-xl md:text-3xl font-bold">{stats.venuesUsed}</h2>
                <p className="text-gray-600 text-xs md:text-sm">{stats.venuesUsedChange}</p>
              </div>
              <MapPin className="h-4 md:h-5 w-4 md:w-5 text-gray-400" />
            </div>
          </div>
          <div className="border rounded-lg p-3 md:p-6 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-xs md:text-sm mb-1">Upcoming Events</p>
                <h2 className="text-xl md:text-3xl font-bold">{stats.upcomingEvents}</h2>
                <p className="text-gray-600 text-xs md:text-sm">{stats.upcomingEventsPeriod}</p>
              </div>
              <Clock className="h-4 md:h-5 w-4 md:w-5 text-gray-400" />
            </div>
          </div>
          <div className="border rounded-lg p-3 md:p-6 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-xs md:text-sm mb-1">Payable Events</p>
                <h2 className="text-xl md:text-3xl font-bold">{stats.totalPayable}</h2>
              </div>
              <span className="inline-block bg-yellow-200 text-yellow-700 rounded-full px-2 md:px-3 py-1 text-xs font-semibold">Payable</span>
            </div>
          </div>
          <div className="border rounded-lg p-3 md:p-6 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-xs md:text-sm mb-1">Free Events</p>
                <h2 className="text-xl md:text-3xl font-bold">{stats.totalFree}</h2>
              </div>
              <span className="inline-block bg-green-100 text-green-600 rounded-full px-2 md:px-3 py-1 text-xs font-semibold">Free</span>
            </div>
          </div>
        </div>


      <div className="bg-white">
        {/* Tab Navigation - Mobile Responsive */}
        <div className="border-b mb-4 md:mb-6 mx-3">
          <div className="flex -mb-px overflow-x-auto">
            <button
              className={`px-4 md:px-6 py-2 font-medium text-sm border-b-2 whitespace-nowrap ${
                activeTab === "my-events"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("my-events")}
            >
              My Events
            </button>
            <button
              className={`px-4 md:px-6 py-2 font-medium text-sm border-b-2 whitespace-nowrap ${
                activeTab === "analytics"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("analytics")}
            >
              Analytics
            </button>
          </div>
        </div>

        {activeTab === "my-events" && (
          <>
            {/* Events Header - Mobile Responsive */}
            <div className="flex flex-col gap-4 mb-4 mx-3">
              <h2 className="text-lg md:text-xl font-bold">Your Events</h2>
              
              {/* Mobile Filter Toggle */}
              <div className="md:hidden">
                <button
                  className="flex items-center gap-2 border rounded-md px-3 py-2 text-gray-700 bg-white w-full"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </button>
              </div>

              {/* Mobile Filters Panel */}
              {isStatusDropdownOpen && (
                <div className="md:hidden space-y-3 p-4 bg-gray-50 rounded-lg">
                  <Input
                    type="text"
                    placeholder="Search by event name..."
                    value={eventNameFilter}
                    onChange={(e) => {
                      setEventNameFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full"
                  />
                  <select
                    value={payTypeFilter}
                    onChange={(e) => {
                      setPayTypeFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="border rounded-md px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  >
                    <option value="all">All Types</option>
                    <option value="free">Free Entrance</option>
                    <option value="payable">Payable</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="border rounded-md px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                    
                  </select>
                  <select
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="border rounded-md px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="thisWeek">This Week</option>
                    <option value="thisMonth">This Month</option>
                    <option value="custom">Custom</option>
                  </select>
                  {dateFilter === "custom" && (
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={e => setCustomStartDate(e.target.value)}
                        className="px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                      />
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={e => setCustomEndDate(e.target.value)}
                        className="px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Filters */}
              <div className="hidden md:flex md:items-center md:justify-between gap-4 w-full">
                <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
                  {/* Search by event name */}
                  <Input
                    type="text"
                    placeholder="Search by event name..."
                    value={eventNameFilter}
                    onChange={(e) => {
                      setEventNameFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full md:w-56"
                  />
                  {/* Filter by pay type */}
                  <select
                    value={payTypeFilter}
                    onChange={(e) => {
                      setPayTypeFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="border rounded-md px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="free">Free Entrance</option>
                    <option value="payable">Payable</option>
                  </select>
                  {/* Status filter dropdown */}
                  <div className="relative">
                    <button
                      className="flex items-center gap-2 border rounded-md px-4 py-2 text-gray-700 bg-white"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      type="button"
                    >
                      <Filter className="h-4 w-4" />
                      <span>Status</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {isStatusDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border rounded-md shadow-lg z-10">
                        <ul className="py-1">
                          {["all", "published", "pending", "cancelled"].map((status) => (
                            <li
                              key={status}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm capitalize"
                              onClick={() => {
                                setStatusFilter(status)
                                setIsStatusDropdownOpen(false)
                                setCurrentPage(1)
                              }}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {/* Date Filter Dropdown */}
                  <select
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="border rounded-md px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="thisWeek">This Week</option>
                    <option value="thisMonth">This Month</option>
                    <option value="custom">Custom</option>
                  </select>
                  {dateFilter === "custom" && (
                    <div className="flex gap-2 items-center">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={e => setCustomStartDate(e.target.value)}
                        className="px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={e => setCustomEndDate(e.target.value)}
                        className="px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          {/* Events Table - Mobile Responsive */}
          <div className="mx-3">
            {/* Desktop Table */}
            <div className="hidden md:block border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Expected Daily Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
                          <p className="text-gray-500 mb-4">
                            {statusFilter !== "all"
                              ? `You don't have any ${statusFilter.toLowerCase()} events.`
                              : "You haven't created any events yet."}
                          </p>
                          <button
                            onClick={handleCreateEventClick}
                            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Event
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedEvents.map((event) => (
                      <TableRow key={event.eventId}>
                        <TableCell className="font-medium">{event.eventName}</TableCell>
                        <TableCell>
                          {event.bookingDates && event.bookingDates.length > 0 ? (
                            <div className="space-y-1">
                              {event.bookingDates.map((date: any, index: number) => (
                                <div key={index} className="text-sm">
                                  {new Date(date.date).toLocaleDateString()}
                                </div>
                              ))}
                            </div>
                          ) : (
                            "No dates"
                          )}
                        </TableCell>
                        <TableCell>{event.venueBookings && event.venueBookings[0] && event.venueBookings[0].venue ? event.venueBookings[0].venue.venueName : ""}</TableCell>
                        <TableCell>{event.eventType}</TableCell>
                        <TableCell>{event.maxAttendees}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              event.eventStatus === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : event.eventStatus === "DRAFT"
                                ? "bg-gray-100 text-gray-800"
                                : event.eventStatus === "PUBLISHED"
                                ? "bg-blue-100 text-blue-800"
                                : event.eventStatus === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : event.eventStatus === "PENDING_PUBLICATION"
                                ? "bg-orange-100 text-orange-800"
                                : event.eventStatus === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {event.eventStatus === "APPROVED" ? "APPROVED" : 
                             event.eventStatus === "DRAFT" ? "DRAFT" : 
                             event.eventStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link href={`/user-dashboard/events/${event.eventId}`} className="flex items-center gap-2 cursor-pointer">
                                  <Eye className="h-4 w-4" />
                                  View Event
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/user-dashboard/events/${event.eventId}/edit`} className="flex items-center gap-2 cursor-pointer">
                                  <Pencil className="h-4 w-4" />
                                  Edit Event
                                </Link>
                              </DropdownMenuItem>
                              {canRequestPublication(event.eventStatus) && event.eventStatus !== "APPROVED" && event.eventStatus !== "PENDING_PUBLICATION" && (
                                <DropdownMenuItem 
                                  onClick={() => setShowPublishRequestId(event.eventId)}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Send className="h-4 w-4" />
                                  Request Publication
                                </DropdownMenuItem>
                              )}
                              {event.eventStatus === "PENDING_PUBLICATION" && (
                                <DropdownMenuItem 
                                  disabled
                                  className="flex items-center gap-2 cursor-not-allowed opacity-50"
                                >
                                  <Send className="h-4 w-4" />
                                  Publication Pending
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => setShowCancelId(event.eventId)}
                                className="flex items-center gap-2 cursor-pointer"
                                disabled={event.eventStatus === "CANCELLED"}
                              >
                                <XCircle className="h-4 w-4" />
                                Cancel Event
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4">
              {paginatedEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
                  <p className="text-gray-500 mb-4">
                    {statusFilter !== "all"
                      ? `You don't have any ${statusFilter.toLowerCase()} events.`
                      : "You haven't created any events yet."}
                  </p>
                  <button
                    onClick={handleCreateEventClick}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mx-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Event
                  </button>
                </div>
              ) : (
                paginatedEvents.map((event) => (
                  <div key={event.eventId} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">{event.eventName}</h3>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          event.eventStatus === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : event.eventStatus === "DRAFT"
                            ? "bg-gray-100 text-gray-800"
                            : event.eventStatus === "PUBLISHED"
                            ? "bg-blue-100 text-blue-800"
                            : event.eventStatus === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : event.eventStatus === "PENDING_PUBLICATION"
                            ? "bg-orange-100 text-orange-800"
                            : event.eventStatus === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {event.eventStatus === "APPROVED" ? "APPROVED" : 
                         event.eventStatus === "DRAFT" ? "DRAFT" : 
                         event.eventStatus}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {event.bookingDates && event.bookingDates.length > 0 ? (
                            event.bookingDates.map((date: any, index: number) => (
                              <span key={index}>
                                {new Date(date.date).toLocaleDateString()}
                                {index < event.bookingDates.length - 1 ? ", " : ""}
                              </span>
                            ))
                          ) : (
                            "No dates"
                          )}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.venueBookings && event.venueBookings[0] && event.venueBookings[0].venue ? event.venueBookings[0].venue.venueName : "No venue"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Capacity: {event.maxAttendees}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Type:</span>
                        <span>{event.eventType}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4 pt-3 border-t">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/user-dashboard/events/${event.eventId}`} className="flex items-center gap-2 cursor-pointer">
                              <Eye className="h-4 w-4" />
                              View Event
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/user-dashboard/events/${event.eventId}/edit`} className="flex items-center gap-2 cursor-pointer">
                              <Pencil className="h-4 w-4" />
                              Edit Event
                            </Link>
                          </DropdownMenuItem>
                          {canRequestPublication(event.eventStatus) && event.eventStatus !== "APPROVED" && event.eventStatus !== "PENDING_PUBLICATION" && (
                            <DropdownMenuItem 
                              onClick={() => setShowPublishRequestId(event.eventId)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Send className="h-4 w-4" />
                              Request Publication
                            </DropdownMenuItem>
                          )}
                          {event.eventStatus === "PENDING_PUBLICATION" && (
                            <DropdownMenuItem 
                              disabled
                              className="flex items-center gap-2 cursor-not-allowed opacity-50"
                            >
                              <Send className="h-4 w-4" />
                              Publication Pending
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => setShowCancelId(event.eventId)}
                            className="flex items-center gap-2 cursor-pointer"
                            disabled={event.eventStatus === "CANCELLED"}
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Pagination - Mobile Responsive */}
          {totalPages > 1 && (
            <div className="mt-6 mx-3">
              <Pagination>
                <PaginationContent className="flex flex-wrap justify-center gap-1 md:gap-2">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }}
                      aria-disabled={currentPage === 1}
                      className="text-sm md:text-base"
                    />
                  </PaginationItem>
                  
                  {/* Show limited page numbers on mobile */}
                  {Array.from({ length: totalPages }, (_, i) => {
                    const pageNumber = i + 1
                    const isVisible = 
                      pageNumber === 1 || 
                      pageNumber === totalPages || 
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    
                    if (!isVisible) {
                      if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
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
                          isActive={currentPage === pageNumber}
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(pageNumber)
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
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }}
                      aria-disabled={currentPage === totalPages}
                      className="text-sm md:text-base"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              {/* Mobile page info */}
              <div className="md:hidden text-center mt-2 text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
          {/* Cancel Event Dialog */}
          <AlertDialog open={!!showCancelId} onOpenChange={() => setShowCancelId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Event</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel this event? This will mark the event as cancelled but keep it in your list.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Dismiss</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleCancel(showCancelId!)}>
                  Yes, Cancel Event
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* Delete Event Dialog */}
          <AlertDialog open={!!showDeleteId} onOpenChange={() => setShowDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this event? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(showDeleteId!)}>
                  Yes, Delete Event
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* Publish Request Dialog */}
          <AlertDialog open={!!showPublishRequestId} onOpenChange={() => setShowPublishRequestId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Request Event Publication</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to send a publication request for this event? This will submit your event for review and approval by administrators.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handlePublishRequest(showPublishRequestId!)}>
                  Yes, Send Request
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {activeTab === "analytics" && (
        <div className="border rounded-lg p-6 m-3">
          <h2 className="text-xl font-bold mb-6">Event Analytics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Popular Events */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Most Popular Events</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Annual Conference</p>
                    <p className="text-sm text-gray-500">April 15, 2025</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">145 registrations</p>
                    <p className="text-sm text-green-600">48% of capacity</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "48%" }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Product Launch</p>
                    <p className="text-sm text-gray-500">April 20, 2025</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">78 registrations</p>
                    <p className="text-sm text-green-600">52% of capacity</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "52%" }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Team Building Retreat</p>
                    <p className="text-sm text-gray-500">April 25, 2025</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">32 registrations</p>
                    <p className="text-sm text-green-600">64% of capacity</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "64%" }}></div>
                </div>
              </div>
            </div>

            {/* Traffic Sources */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Traffic Sources</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Direct</p>
                  <p className="font-medium">45%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "45%" }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="font-medium">Social Media</p>
                  <p className="font-medium">30%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: "30%" }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="font-medium">Email</p>
                  <p className="font-medium">15%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: "15%" }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="font-medium">Other</p>
                  <p className="font-medium">10%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: "10%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Check Dialog */}
      <Dialog open={showBookingCheckDialog} onOpenChange={setShowBookingCheckDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Venue Booking Required 
            </DialogTitle>
            <DialogDescription>
            Firstly start by booking a venue where your event  will take place.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <button
              onClick={handleBookingDialogCancel}
              className="flex-1 bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Cancel
            </button>
            <Button onClick={handleBookingDialogBookVenue} className="flex-1">
              Book venue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

              
      </div>
      
      </div>
    </div>
  )
}

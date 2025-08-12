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
import axios from "axios"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"


const EVENTS_PER_PAGE = 3
const ATTENDANCE_EVENT_ID = "c1883bb9-8a54-4dd3-a234-6add0e872d48"

// Helper to determine event pay type based on backend field isEntryPaid
function getPayType(event: { isEntryPaid?: boolean }) {
  return event.isEntryPaid ? "Payable" : "Free Entrance"
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
  const [attendanceCount, setAttendanceCount] = useState<number>(0)
  const [upcomingEventsCount, setUpcomingEventsCount] = useState<number>(0)
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

  // Fetch total attendees for a specific event from backend
  useEffect(() => {
    if (!isLoggedIn) return
    ;(async () => {
      try {
        const res = await axios.get(
          `${ApiService.BASE_URL}/event/${ATTENDANCE_EVENT_ID}/attendance/free`,
          { headers: ApiService.getHeader(), withCredentials: true }
        )
        if (res?.data?.success && Array.isArray(res.data.data)) {
          const count = res.data.data.filter((r: any) => r?.attended === true).length
          setAttendanceCount(count)
        } else {
          setAttendanceCount(0)
        }
      } catch (e: any) {
        if (e?.response?.status === 404) {
          setAttendanceCount(0)
          return
        }
        setAttendanceCount(0)
      }
    })()
  }, [isLoggedIn])

  // Fetch upcoming events count (next 30 days) from /event/all
  useEffect(() => {
    ;(async () => {
      if (!user) return;
      try {
        const res = await ApiService.getAllEventByUserId(user.userId)
        console.log("Upcoming events response:", res)
        if (res?.data?.success && Array.isArray(res.data.data)) {
          const now = new Date()
          const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          const count = res.data.data.filter((ev: any) =>
            Array.isArray(ev?.bookingDates) && ev.bookingDates.some((bd: any) => {
              const dateStr = bd?.date
              if (!dateStr) return false
              const dt = parseISO(String(dateStr))
              return dt.getTime() >= now.getTime() && dt.getTime() <= horizon.getTime()
            })
          ).length
          setUpcomingEventsCount(count)
        } else {
          setUpcomingEventsCount(0)
        }
      } catch (e) {
        setUpcomingEventsCount(0)
      }
    })()
  }, [user])

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
      if (payTypeFilter === "free") {
        return event.isEntryPaid === false
      } else if (payTypeFilter === "payable") {
        return event.isEntryPaid === true
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
    totalAttendees: attendanceCount,
    totalAttendeesChange: "+5%",
    upcomingEvents: upcomingEventsCount,
    upcomingEventsPeriod: "Next 30 days",
    totalPayable,
    totalFree,
  }

  // In the render, show a loading spinner or message if loading is true
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-lg text-gray-500">Loading events...</div>;
  }

  return (
    <div className="py-4 md:py-8 px-0 md:px-4">
      <div className={`transform transition-all duration-1000 ease-out ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} mx-0` }>
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">All Events</h1>
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
        {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Total Events</p>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{stats.totalEvents}</h3>
                <p className="text-green-600 text-xs md:text-sm font-medium">{stats.totalEventsChange}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Total Attendees</p>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{stats.totalAttendees}</h3>
                <p className="text-green-600 text-xs md:text-sm font-medium">{stats.totalAttendeesChange}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Upcoming Events</p>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{stats.upcomingEvents}</h3>
                <p className="text-blue-600 text-xs md:text-sm font-medium">{stats.upcomingEventsPeriod}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Payable Events</p>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{stats.totalPayable}</h3>
                <div className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  Payable
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-lg md:text-xl">$</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Free Events</p>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{stats.totalFree}</h3>
                <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Free
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg md:text-xl">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div> */}


      <div className="bg-white p-6">
        {/* Events Header - Mobile Responsive */}
        <div className="flex flex-col gap-4 mb-4">
          <h2 className="text-lg md:text-xl font-bold">My Events</h2>
          
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
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Event</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Venue</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Capacity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
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
                          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Event
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map((event) => (
                    <tr key={event.eventId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{event.eventName}</div>
                      </td>
                      <td className="px-6 py-4">
                        {event.bookingDates && event.bookingDates.length > 0 ? (
                          <div className="space-y-1">
                            {event.bookingDates.map((date: any, index: number) => (
                              <div key={index} className="text-sm text-gray-600">
                                {new Date(date.date).toLocaleDateString()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No dates</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {event.venueBookings && event.venueBookings[0] && event.venueBookings[0].venue 
                            ? event.venueBookings[0].venue.venueName 
                            : "No venue"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{event.eventType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{event.maxAttendees}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-4 p-4">
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
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Event
              </button>
            </div>
          ) : (
            paginatedEvents.map((event) => (
              <div key={event.eventId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">{event.eventName}</h3>
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ml-2 flex-shrink-0 ${
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
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-gray-700">Date:</span>
                      <span className="ml-2">
                        {event.bookingDates && event.bookingDates.length > 0 ? (
                          event.bookingDates.map((date: any, index: number) => (
                            <span key={index}>
                              {new Date(date.date).toLocaleDateString()}
                              {index < event.bookingDates.length - 1 ? ", " : ""}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No dates</span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-gray-700">Venue:</span>
                      <span className="ml-2">
                        {event.venueBookings && event.venueBookings[0] && event.venueBookings[0].venue 
                          ? event.venueBookings[0].venue.venueName 
                          : "No venue"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-gray-700">Capacity:</span>
                      <span className="ml-2">{event.maxAttendees}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="h-4 w-4 mt-0.5 flex-shrink-0 bg-gray-300 rounded-full"></span>
                    <div className="flex-1">
                      <span className="font-medium text-gray-700">Category:</span>
                      <span className="ml-2">{event.eventType}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 pt-3 border-t border-gray-200">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
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
        <div className="mt-6">
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

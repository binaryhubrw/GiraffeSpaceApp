"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Calendar, Plus, Filter, ChevronDown, Users, MapPin, Clock } from "lucide-react"
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
import { Pencil, Eye, Trash2, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { isToday, isThisWeek, isThisMonth, parseISO, isAfter, isBefore } from "date-fns"


// Sample event data with updated status values
const sampleEvents = [
  {
    id: "event-1",
    name: "Annual Conference",
    date: "April 15, 2025",
    venue: "Main Conference Hall",
    registrations: 145,
    capacity: 300,
    status: "published", // approved by admin
    ticketPrice: 0, // Free entrance
  },
  {
    id: "event-2",
    name: "Product Launch",
    date: "April 20, 2025",
    venue: "Exhibition Center",
    registrations: 78,
    capacity: 150,
    status: "pending", // pending admin approval
    ticketPrice: 50, // Payable
  },
  {
    id: "event-3",
    name: "Team Building Retreat",
    date: "April 25, 2025",
    venue: "Mountain Resort",
    registrations: 32,
    capacity: 50,
    status: "published", // approved by admin
    ticketPrice: "Free", // Free entrance
  },
  {
    id: "event-4",
    name: "Client Appreciation Day",
    date: "May 5, 2025",
    venue: "Company Headquarters",
    registrations: 0,
    capacity: 100,
    status: "pending", // pending admin approval
    ticketPrice: 20, // Payable
  },
]

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
  const [events, setEvents] = useState(sampleEvents)
  const [eventNameFilter, setEventNameFilter] = useState("")
  const [payTypeFilter, setPayTypeFilter] = useState("all") // all, free, payable
  const [dateFilter, setDateFilter] = useState("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")


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
    const eventDate = parseISO(event.date)
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
  const filteredEvents = (statusFilter === "all" ? filteredByDate : filteredByDate.filter((event) => event.status === statusFilter.toLowerCase()))
    .filter((event) =>
      eventNameFilter.trim() === "" || event.name.toLowerCase().includes(eventNameFilter.trim().toLowerCase())
    )
    .filter((event) => {
      if (payTypeFilter === "all") return true
      // Find ticketPrice from event (mocked data may not have it, so fallback to free for demo)
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
  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setShowDeleteId(null)
  }
  const handleCancel = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "cancelled" } : e
      )
    )
    setShowCancelId(null)
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

  return (
    <div className="p-8">
      <div className={`transform transition-all duration-1000 ease-out ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
        {/* Remove old date filter buttons */}
              {/* Dashboard Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold mb-1">Organizer Dashboard</h1>
                  <p className="text-gray-600">Manage your events and track performance</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
                  <button
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    onClick={() => router.push("/user-dashboard/events/create")}
                  >
                    <Plus className="h-4 w-4" />
                    Create Event
                  </button>
                </div>
              </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Events</p>
              <h2 className="text-3xl font-bold">{stats.totalEvents}</h2>
              <p className="text-gray-600 text-sm">{stats.totalEventsChange}</p>
            </div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Attendees</p>
              <h2 className="text-3xl font-bold">{stats.totalAttendees}</h2>
              <p className="text-gray-600 text-sm">{stats.totalAttendeesChange}</p>
            </div>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-1">Venues Used</p>
              <h2 className="text-3xl font-bold">{stats.venuesUsed}</h2>
              <p className="text-gray-600 text-sm">{stats.venuesUsedChange}</p>
            </div>
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-1">Upcoming Events</p>
              <h2 className="text-3xl font-bold">{stats.upcomingEvents}</h2>
              <p className="text-gray-600 text-sm">{stats.upcomingEventsPeriod}</p>
            </div>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-1">Payable Events</p>
              <h2 className="text-3xl font-bold">{stats.totalPayable}</h2>
            </div>
            <span className="inline-block bg-red-100 text-red-600 rounded-full px-3 py-1 text-xs font-semibold">Payable</span>
          </div>
        </div>
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-1">Free Entrance Events</p>
              <h2 className="text-3xl font-bold">{stats.totalFree}</h2>
            </div>
            <span className="inline-block bg-green-100 text-green-600 rounded-full px-3 py-1 text-xs font-semibold">Free</span>
          </div>
        </div>
      </div>


      <div className="bg-white">
           {/* Tab Navigation */}
      <div className="border-b mb-6 ml-3 mr-3 ">
        <div className="flex -mb-px">
          <button
            className={`px-6 py-2 font-medium text-sm border-b-2 ${
              activeTab === "my-events"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("my-events")}
          >
            My Events
          </button>
          <button
            className={`px-6 py-2 font-medium text-sm border-b-2 ${
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
          {/* Events Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 ml-3 mr-3">
            <h2 className="text-xl font-bold">Your Events</h2>
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
              {/* Status filter dropdown (unchanged) */}
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
          {/* Events Table (shadcn) */}
          <div className="border rounded-lg overflow-x-auto ml-3 mr-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
                        <p className="text-gray-500 mb-4">
                          {statusFilter !== "all"
                            ? `You don't have any ${statusFilter.toLowerCase()} events.`
                            : "You haven't created any events yet."}
                        </p>
                        <button
                          onClick={() => router.push("/manage/events/create")}
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
                    <TableRow key={event.id}>
                      <TableCell>{event.name}</TableCell>
                      <TableCell>{event.date}</TableCell>
                      <TableCell>{event.venue}</TableCell>
                      <TableCell>{getPayType(event)}</TableCell>
                      <TableCell>
                        {event.registrations} / {event.capacity}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            event.status === "published"
                              ? "bg-green-100 text-green-800"
                              : event.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/user-dashboard/events/${event.id}`} className="inline-block text-blue-600 hover:text-blue-800">
                          <Eye className="h-5 w-5" aria-label="View" />
                        </Link>
                        <Link href={`/user-dashboard/events/${event.id}/edit`} className="inline-block text-gray-600 hover:text-gray-900">
                          <Pencil className="h-5 w-5" aria-label="Edit" />
                        </Link>
                        <button
                          onClick={() => setShowCancelId(event.id)}
                          className="inline-block text-yellow-600 hover:text-yellow-800"
                          title="Cancel Event"
                          disabled={event.status === "cancelled"}
                        >
                          <XCircle className="h-5 w-5" aria-label="Cancel Event" />
                        </button>
                        <button
                          onClick={() => setShowDeleteId(event.id)}
                          className="inline-block text-red-600 hover:text-red-800"
                          title="Delete Event"
                        >
                          <Trash2 className="h-5 w-5" aria-label="Delete Event" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 ml-3 mr-3">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }}
                      aria-disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === i + 1}
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(i + 1)
                        }}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }}
                      aria-disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
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

              
      </div>
      
      </div>
    </div>
  )
}

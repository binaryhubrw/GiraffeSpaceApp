"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Calendar, MapPin, Users as UsersIcon, Home, UserX, Search, CheckCircle, Clock, XCircle, Users } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { format, parseISO, isSameDay, isToday, isThisWeek, isThisMonth, isAfter, isBefore } from "date-fns"
import { useRouter } from "next/navigation"
import ApiService from "@/api/apiConfig"

interface Event {
  eventId: string
  eventName: string
  eventDescription: string
  eventType: string
  eventStatus: string
  bookingDates: Array<{ date: string }>
  maxAttendees: number
  venueBookings: Array<{
    venueId: string
    isPaid: boolean
  }>
  eventGuests: Array<{
    guestName: string
  }>
  createdAt: string
  updatedAt: string
  imageURL?: string
  qrCode?: string
  websiteURL?: string
  hashtag?: string
  isFeatured?: boolean
}

interface Venue {
  venueId: string
  venueName: string
  organizationId: string
  organization?: {
    organizationName: string
  }
  organizationName?: string
  location?: string
  capacity?: number
  description?: string
  amenities?: string
  amount?: number
}

interface Organization {
  organizationId: string
  organizationName: string
}

export default function AdminEvents() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const itemsPerPage = 10
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<Event[]>([])

  // Statistics
  const stats = {
    total: events.length,
    active: events.filter(e => e.eventStatus === "ACTIVE").length,
    draft: events.filter(e => e.eventStatus === "DRAFT").length,
    cancelled: events.filter(e => e.eventStatus === "CANCELLED").length,
    completed: events.filter(e => e.eventStatus === "COMPLETED").length,
    requested: events.filter(e => e.eventStatus === "REQUESTED").length,
    approved: events.filter(e => e.eventStatus === "APPROVED").length,
  }

  // Status options
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "REQUESTED", label: "Requested" },
    { value: "APPROVED", label: "Approved" },
    { value: "ACTIVE", label: "Active" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "COMPLETED", label: "Completed" },
    { value: "DRAFT", label: "Draft" },
  ]

  // fetch all events from database
  useEffect(() => {   
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const response = await ApiService.getAllEvents()
        console.log("API Response:", response)
        if (response.success && response.data) {
          setEvents(response.data)
        } else {
          console.error("Failed to fetch events:", response)
          setEvents([])
        }
      } catch (error) {
        console.error("Error fetching events:", error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  // Filtered events
  const filteredEvents = events.filter((event: Event) => {
    const search = searchQuery.toLowerCase()
    const matchesSearch =
      (event.eventName?.toLowerCase() || '').includes(search) ||
      (event.eventDescription?.toLowerCase() || '').includes(search)
    const matchesStatus = statusFilter === "all" || event.eventStatus === statusFilter.toUpperCase()

    // Date filtering
    let matchesDate = true
    if (event.bookingDates && event.bookingDates.length > 0) {
      const eventDate = parseISO(event.bookingDates[0].date)
      if (eventDate) {
        if (dateFilter === "today") {
          matchesDate = isToday(eventDate)
        } else if (dateFilter === "thisWeek") {
          matchesDate = isThisWeek(eventDate, { weekStartsOn: 1 })
        } else if (dateFilter === "thisMonth") {
          matchesDate = isThisMonth(eventDate)
        } else if (dateFilter === "custom") {
          if (customStartDate && customEndDate) {
            const start = parseISO(customStartDate)
            const end = parseISO(customEndDate)
            matchesDate = (isAfter(eventDate, start) || eventDate.getTime() === start.getTime()) &&
                          (isBefore(eventDate, end) || eventDate.getTime() === end.getTime())
          } else {
            matchesDate = true
          }
        }
      }
    }
    return matchesSearch && matchesStatus && matchesDate
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage)

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading events...</div>

  return (
    <div className="flex-1 p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Event Management</h2>
        </div>
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Requested</p>
                    <p className="text-2xl font-bold">{stats.requested}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold">{stats.approved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Draft</p>
                    <p className="text-2xl font-bold">{stats.draft}</p>
                  </div>
                  <Clock className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cancelled</p>
                    <p className="text-2xl font-bold">{stats.cancelled}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="custom">Custom</option>
              </select>
            </div>
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
          {/* Events Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Events</CardTitle>
              <CardDescription>Manage all events in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Venue Bookings</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEvents.length > 0 ? (
                    paginatedEvents.map((event) => (
                      <TableRow key={event.eventId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{event.eventName}</div>
                            <div className="text-sm text-gray-500">{event.eventDescription}</div>
                            {event.maxAttendees && (
                              <div className="text-xs text-gray-400">
                                Max: {event.maxAttendees} attendees
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.eventType}</Badge>
                        </TableCell>
                        <TableCell>
                          {event.bookingDates && event.bookingDates.length > 0 ? (
                            <div>
                              {event.bookingDates.map((date, index) => {
                                try {
                                  if (!date.date) return <div key={index} className="text-sm">No date</div>
                                  const parsedDate = parseISO(date.date)
                                  if (isNaN(parsedDate.getTime())) {
                                    return <div key={index} className="text-sm">Invalid date</div>
                                  }
                                  return (
                                    <div key={index} className="text-sm">
                                      {format(parsedDate, 'MMM dd, yyyy')}
                                    </div>
                                  )
                                } catch (error) {
                                  return <div key={index} className="text-sm">Invalid date</div>
                                }
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-500">No dates</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              event.eventStatus === "APPROVED" ? "default" : 
                              event.eventStatus === "REQUESTED" ? "secondary" : 
                              event.eventStatus === "ACTIVE" ? "default" :
                              event.eventStatus === "CANCELLED" ? "destructive" :
                              "outline"
                            }
                          >
                            {event.eventStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {event.venueBookings && event.venueBookings.length > 0 ? (
                            <div className="text-sm">
                              <div>{event.venueBookings.length} venue(s)</div>
                              <div className="text-gray-500">
                                {event.venueBookings.some(booking => booking.isPaid) ? 
                                  "Payment received" : "Payment pending"
                                }
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">No venues</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {event.eventGuests && event.eventGuests.length > 0 ? (
                            <div className="text-sm">
                              <div>{event.eventGuests.length} guest(s)</div>
                              <div className="text-gray-500">
                                {event.eventGuests.slice(0, 2).map(guest => guest.guestName).join(', ')}
                                {event.eventGuests.length > 2 && '...'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">No guests</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => router.push(`/admin/events/${event.eventId}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="outline" onClick={() => {/* handle delete */}}>
                              <UserX className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        No events found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Pagination */}
              <div className="flex justify-end mt-4 space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage(safeCurrentPage - 1)}
                >
                  Previous
                </Button>
                <span className="px-2 py-1 text-sm">
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage(safeCurrentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
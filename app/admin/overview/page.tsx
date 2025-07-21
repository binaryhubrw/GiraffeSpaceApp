"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Filter,
  Settings,
} from "lucide-react"
import ApiService from "@/api/apiConfig"
import { useToast } from "@/hooks/use-toast"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Chart configuration
const chartConfig: ChartConfig = {
  events: {
    label: "Events",
    color: "#3b82f6", // blue-500
  },
  venues: {
    label: "Venues", 
    color: "#6b7280", // gray-500
  },
}

export default function AdminOverview() {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Filter and customization state
  const [dateFilter, setDateFilter] = useState<string>("all") // "all", "today", "weekly", "monthly"
  const [showCharts, setShowCharts] = useState<boolean>(true)
  const [showCountdowns, setShowCountdowns] = useState<boolean>(true)
  const [showStatistics, setShowStatistics] = useState<boolean>(true)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false)

  // Pagination state
  const [eventPage, setEventPage] = useState(1)
  const [venuePage, setVenuePage] = useState(1)
  const ITEMS_PER_PAGE = 5

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Auto refresh functionality
  useEffect(() => {
    if (!autoRefresh) return

    const refreshTimer = setInterval(() => {
      Promise.all([
        ApiService.getAllEvents(),
        ApiService.getAllVenues(),
      ])
        .then(([eventsRes, venuesRes]) => {
          setEvents(Array.isArray(eventsRes) ? eventsRes : (eventsRes.data || []))
          setVenues(Array.isArray(venuesRes) ? venuesRes : (venuesRes.data || []))
        })
        .catch((err) => {
          console.error("Auto refresh failed:", err)
        })
    }, 30000) // 30 seconds

    return () => clearInterval(refreshTimer)
  }, [autoRefresh])

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      ApiService.getAllEvents(),
      ApiService.getAllVenues(),
    ])
      .then(([eventsRes, venuesRes]) => {
        setEvents(Array.isArray(eventsRes) ? eventsRes : (eventsRes.data || []))
        setVenues(Array.isArray(venuesRes) ? venuesRes : (venuesRes.data || []))
      })
      .catch((err) => {
        setError("Failed to load data.")
      })
      .finally(() => setLoading(false))
  }, [])

  // Filter for pending status
  const pendingEvents = events.filter((event) => (event.status?.toUpperCase?.() === "PENDING" || event.status?.toUpperCase?.() === "DRAFT"))
  const pendingVenues = venues.filter((venue) => venue.status?.toUpperCase?.() === "PENDING")

  // Date filtering functions
  const isWithinDateRange = (dateString: string, filterType: string) => {
    if (!dateString) return false
    
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (filterType) {
      case "today":
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return date >= today && date < tomorrow
        
      case "weekly":
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return date >= weekAgo && date <= now
        
      case "monthly":
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return date >= monthAgo && date <= now
        
      default:
        return true
    }
  }

  // Apply date filter to events and venues
  const filteredEvents = pendingEvents.filter((event: any) => 
    isWithinDateRange(event.createdAt || event.startDate, dateFilter)
  )
  
  const filteredVenues = pendingVenues.filter((venue: any) => 
    isWithinDateRange(venue.createdAt, dateFilter)
  )

  // Pagination logic for filtered items
  const totalEventPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE))
  const totalVenuePages = Math.max(1, Math.ceil(filteredVenues.length / ITEMS_PER_PAGE))
  const paginatedEvents = filteredEvents.slice((eventPage - 1) * ITEMS_PER_PAGE, eventPage * ITEMS_PER_PAGE)
  const paginatedVenues = filteredVenues.slice((venuePage - 1) * ITEMS_PER_PAGE, venuePage * ITEMS_PER_PAGE)

  // Reset pagination when filter changes
  useEffect(() => {
    setEventPage(1)
    setVenuePage(1)
  }, [dateFilter])

  // Process data for charts
  const processChartData = () => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]
    
    const currentYear = new Date().getFullYear()
    const chartData = months.map((month, index) => ({
      month,
      events: 0,
      venues: 0,
    }))

    // Count events by month
    events.forEach((event) => {
      if (event.createdAt) {
        const eventDate = new Date(event.createdAt)
        if (eventDate.getFullYear() === currentYear) {
          const monthIndex = eventDate.getMonth()
          chartData[monthIndex].events++
        }
      }
    })

    // Count venues by month
    venues.forEach((venue) => {
      if (venue.createdAt) {
        const venueDate = new Date(venue.createdAt)
        if (venueDate.getFullYear() === currentYear) {
          const monthIndex = venueDate.getMonth()
          chartData[monthIndex].venues++
        }
      }
    })

    return chartData
  }

  const chartData = processChartData()

  // Process data for doughnut chart
  const processDoughnutData = () => {
    const totalEvents = events.length
    const totalVenues = venues.length
    
    return [
      { name: "Events", value: totalEvents, color: "#3b82f6" }, // blue-500
      { name: "Venues", value: totalVenues, color: "#6b7280" }, // gray-500
    ]
  }

  const doughnutData = processDoughnutData()

  // Countdown function
  const getCountdown = (targetDate: string) => {
    const target = new Date(targetDate)
    const now = currentTime
    const diff = target.getTime() - now.getTime()
    
    if (diff <= 0) {
      return "Expired"
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  // Approve/Reject handlers
  const handleApproveEvent = async (eventId: string) => {
    try {
      await ApiService.updateEventById(eventId, { status: "APPROVED" })
      setEvents((prev) => prev.map(e => e.eventId === eventId ? { ...e, status: "APPROVED" } : e))
      toast({ title: "Event Approved", description: "The event has been approved." })
    } catch {
      toast({ title: "Error", description: "Failed to approve event.", variant: "destructive" })
    }
  }
  const handleRejectEvent = async (eventId: string) => {
    try {
      await ApiService.updateEventById(eventId, { status: "REJECTED" })
      setEvents((prev) => prev.map(e => e.eventId === eventId ? { ...e, status: "REJECTED" } : e))
      toast({ title: "Event Rejected", description: "The event has been rejected." })
    } catch {
      toast({ title: "Error", description: "Failed to reject event.", variant: "destructive" })
    }
  }
  const handleApproveVenue = async (venueId: string) => {
    try {
      await ApiService.approveVenue(venueId)
      setVenues((prev) => prev.map(v => v.venueId === venueId ? { ...v, status: "APPROVED", isAvailable: true } : v))
      toast({ title: "Venue Approved", description: "The venue has been approved." })
    } catch {
      toast({ title: "Error", description: "Failed to approve venue.", variant: "destructive" })
    }
  }
  const handleRejectVenue = async (venueId: string) => {
    try {
      await ApiService.cancelVenue(venueId, { status: "REJECTED", isAvailable: false })
      setVenues((prev) => prev.map(v => v.venueId === venueId ? { ...v, status: "REJECTED", isAvailable: false } : v))
      toast({ title: "Venue Rejected", description: "The venue has been rejected." })
    } catch {
      toast({ title: "Error", description: "Failed to reject venue.", variant: "destructive" })
    }
  }

  // Statistics (optional, can be improved with real data)
  const stats = {
    totalEvents: events.length,
    totalVenues: venues.length,
    pendingApprovals: pendingEvents.length + pendingVenues.length,
    approvedEvents: events.filter((event) => event.status?.toUpperCase?.() === "APPROVED").length,
    approvedVenues: venues.filter((venue) => venue.status?.toUpperCase?.() === "APPROVED").length,
  }

  return (
    <div className="flex-1 p-8">
      <h2 className="text-2xl font-bold mb-4">Admin Overview</h2>
      {/* Statistics Cards */}
      {showStatistics && (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
                <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Venues</p>
                <p className="text-2xl font-bold">{stats.totalVenues}</p>
              </div>
                <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
              </div>
                <AlertTriangle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Events</p>
                <p className="text-2xl font-bold">{stats.approvedEvents}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Venues</p>
                <p className="text-2xl font-bold">{stats.approvedVenues}</p>
              </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter and Customization Controls */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Date Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Date Filter
            </CardTitle>
            <CardDescription>Filter pending items by date range</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="weekly">Last 7 Days</SelectItem>
                <SelectItem value="monthly">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-4 text-sm text-gray-600">
              Showing: {paginatedEvents.length} of {filteredEvents.length} events, {paginatedVenues.length} of {filteredVenues.length} venues
              {totalEventPages > 1 && ` (Page ${eventPage}/${totalEventPages} for events)`}
              {totalVenuePages > 1 && ` (Page ${venuePage}/${totalVenuePages} for venues)`}
            </div>
          </CardContent>
        </Card>

        {/* Customization Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Customization
            </CardTitle>
            <CardDescription>Customize your dashboard view</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-statistics">Show Statistics Cards</Label>
              <Switch
                id="show-statistics"
                checked={showStatistics}
                onCheckedChange={setShowStatistics}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-countdowns">Show Countdowns</Label>
              <Switch
                id="show-countdowns"
                checked={showCountdowns}
                onCheckedChange={setShowCountdowns}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-charts">Show Charts</Label>
              <Switch
                id="show-charts"
                checked={showCharts}
                onCheckedChange={setShowCharts}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-refresh">Auto Refresh (30s)</Label>
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Items with Countdowns */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Pending Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Pending Event Approvals
              </CardTitle>
              <CardDescription>Events waiting for approval</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {paginatedEvents.length > 0 ? (
                  paginatedEvents.map((event) => (
                    <div
                      key={event.eventId}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white"
                    >
                      <div>
                        <p className="font-medium">{event.eventTitle}</p>
                      <p className="text-sm text-gray-600">
                        Start Date: {event.startDate ? new Date(event.startDate).toLocaleDateString() : "-"}
                        <br />
                        End Date: {event.endDate ? new Date(event.endDate).toLocaleDateString() : "-"}
                        <br />
                        Status: {event.status?.toUpperCase()}
                      </p>
                      {showCountdowns && (
                        <p className="text-sm text-gray-600">
                          Approval Deadline: {event.approvalDeadline ? getCountdown(event.approvalDeadline) : "N/A"}
                        </p>
                      )}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleApproveEvent(event.eventId)}>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectEvent(event.eventId)}>
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No pending event approvals</p>
                )}
              </div>
              {totalEventPages > 1 && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setEventPage(prev => Math.max(1, prev - 1))}
                  disabled={eventPage === 1}
                >
                  Previous
                </Button>
                <span className="mx-2 text-gray-600">
                  Page {eventPage} of {totalEventPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setEventPage(prev => Math.min(totalEventPages, prev + 1))}
                  disabled={eventPage === totalEventPages}
                >
                  Next
                </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Venues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Pending Venue Approvals
              </CardTitle>
              <CardDescription>Venues waiting for approval</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {paginatedVenues.length > 0 ? (
                  paginatedVenues.map((venue) => (
                    <div
                      key={venue.venueId}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white"
                    >
                      <div>
                        <p className="font-medium">{venue.venueName}</p>
                      <p className="text-sm text-gray-600">
                        Location: {venue.location}
                        <br />
                        Capacity: {venue.capacity}
                        <br />
                        Status: {venue.status?.toUpperCase()}
                      </p>
                      {showCountdowns && (
                        <p className="text-sm text-gray-600">
                          Approval Deadline: {venue.approvalDeadline ? getCountdown(venue.approvalDeadline) : "N/A"}
                        </p>
                      )}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleApproveVenue(venue.venueId)}>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectVenue(venue.venueId)}>
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No pending venue approvals</p>
                )}
              </div>
              {totalVenuePages > 1 && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setVenuePage(prev => Math.max(1, prev - 1))}
                  disabled={venuePage === 1}
                >
                  Previous
                </Button>
                <span className="mx-2 text-gray-600">
                  Page {venuePage} of {totalVenuePages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setVenuePage(prev => Math.min(totalVenuePages, prev + 1))}
                  disabled={venuePage === totalVenuePages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Events Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Events Created by Month ({new Date().getFullYear()})
              </CardTitle>
              <CardDescription>Number of events created each month</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="month"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => (
                      <ChartTooltipContent
                        active={active}
                        payload={payload}
                        hideLabel
                      />
                    )}
                  />
                  <Bar
                    dataKey="events"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Venues Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Venues Created by Month ({new Date().getFullYear()})
              </CardTitle>
              <CardDescription>Number of venues created each month</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="month"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => (
                      <ChartTooltipContent
                        active={active}
                        payload={payload}
                        hideLabel
                      />
                    )}
                  />
                  <Bar
                    dataKey="venues"
                    fill="#6b7280"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
                </div>
              )}

      {/* Doughnut Chart for Comparison */}
      {showCharts && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Total Events vs Total Venues ({new Date().getFullYear()})
              </CardTitle>
              <CardDescription>Comparison of total events and venues created</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <PieChart width={400} height={400}>
                  <Pie
                    data={doughnutData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill="#8884d8"
                    label
                  >
                    {doughnutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <div className="text-center text-gray-500">All data loaded successfully</div>
      )}
    </div>
  )
} 
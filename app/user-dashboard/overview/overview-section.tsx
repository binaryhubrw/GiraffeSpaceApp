"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, Users, DollarSign, Ticket, CreditCard, Filter, Building, TrendingUp } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts"

interface OverviewSectionProps {
  user: any
  organizations: any[]
  userEvents: any[]
}

type EventTypeFilter = "all" | "free" | "paid"
type RangeFilter = "30d" | "90d" | "all"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

export default function OverviewSection({
  user = {
    firstName: "Amani",
    lastName: "N.",
    profilePictureURL: "",
  },
  organizations = [],
  userEvents = [],
}: OverviewSectionProps) {
  const [overviewPage, setOverviewPage] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>("all")
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("90d")
  const itemsPerPage = 5

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  if (!user) {
    return <div className="p-6">Loading...</div>
  }

  const now = new Date()
  const fromDate = useMemo(() => {
    if (rangeFilter === "all") return null
    const d = new Date(now)
    if (rangeFilter === "30d") d.setDate(d.getDate() - 30)
    if (rangeFilter === "90d") d.setDate(d.getDate() - 90)
    return d
  }, [rangeFilter])

  // Filter events by range and type
  const filteredEvents = useMemo(() => {
    return userEvents.filter((event: any) => {
      const eventDate = new Date(event.eventDate)
      const inRange = !fromDate || eventDate >= fromDate
      const isPaid = (event.eventType === "paid") || (event.ticketPrice && event.ticketPrice > 0)
      const isFree = (event.eventType === "free") || (!event.ticketPrice || event.ticketPrice === 0)

      let typeOk = true
      if (typeFilter === "paid") typeOk = isPaid
      if (typeFilter === "free") typeOk = isFree

      return inRange && typeOk
    })
  }, [userEvents, fromDate, typeFilter])

  // Stats from filtered events
  const freeEvents = filteredEvents.filter((event: any) => event.eventType === "free" || event.ticketPrice === 0)
  const paidEvents = filteredEvents.filter((event: any) => event.eventType === "paid" || (event.ticketPrice && event.ticketPrice > 0))

  const userStats = {
    totalEvents: filteredEvents.length,
    upcomingEvents: filteredEvents.filter((event: any) => new Date(event.eventDate) > new Date()).length,
    totalTickets: filteredEvents.reduce((sum: number, event: any) => sum + (event.ticketCount || 1), 0),
    totalAttendees: filteredEvents.reduce((sum: number, event: any) => sum + (event.attendeeCount || 0), 0),
    freeEvents: freeEvents.length,
    paidEvents: paidEvents.length,
    totalRevenue: paidEvents.reduce(
      (sum: number, event: any) => sum + ((event.ticketPrice || 0) * (event.ticketsSold || event.ticketCount || 0)),
      0
    ),
    averageTicketPrice: paidEvents.length > 0
      ? paidEvents.reduce((sum: number, event: any) => sum + (event.ticketPrice || 0), 0) / paidEvents.length
      : 0,
  }

  // Event type pie data
  const eventTypeData = [
    { name: "Free Events", value: userStats.freeEvents, color: "#10b981" },
    { name: "Paid Events", value: userStats.paidEvents, color: "#3b82f6" },
  ]

  // Category distribution
  const categoryData = filteredEvents.reduce((acc: Record<string, number>, event: any) => {
    const category = event.category || event.eventCategory || "Other"
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const categoryChartData = Object.entries(categoryData).map(([category, count]) => ({
    name: category,
    value: count,
    percentage: filteredEvents.length > 0 ? ((count / filteredEvents.length) * 100).toFixed(1) : "0.0",
  }))

  // Revenue by event (top 6)
  const revenueBarData = paidEvents.slice(0, 6).map((event: any) => ({
    name: event.eventTitle.length > 15 ? event.eventTitle.substring(0, 15) + "..." : event.eventTitle,
    revenue: (event.ticketPrice || 0) * (event.ticketsSold || event.ticketCount || 0),
    attendees: event.attendeeCount || Math.floor(Math.random() * 200) + 50,
    ticketPrice: event.ticketPrice || 0,
  }))

  // Attendance vs revenue (top 8)
  const attendanceRevenueData = paidEvents.slice(0, 8).map((event: any) => ({
    name: event.eventTitle.length > 10 ? event.eventTitle.substring(0, 10) + "..." : event.eventTitle,
    attendees: event.attendeeCount || Math.floor(Math.random() * 200) + 50,
    revenue: (event.ticketPrice || 0) * (event.ticketsSold || event.ticketCount || 0),
  }))

  const getTotalPages = (length: number) => Math.ceil(length / itemsPerPage)
  const getPaginatedData = (data: any[], page: number) => data.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-white text-black">
      <div
        className={`transform transition-all duration-700 ease-out max-w-full ${
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="space-y-6 md:space-y-8">
          {/* Header and Filters */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 md:p-6 overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg md:text-xl font-bold overflow-hidden">
                  {user.profilePictureURL ? (
                    <img
                      src={user.profilePictureURL || "/placeholder.svg?height=64&width=64&query=user-avatar"}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="select-none">
                      {(user.firstName?.[0] || "").toUpperCase()}
                      {(user.lastName?.[0] || "").toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 break-words">
                    {"Welcome back, "}{user.firstName}{"!"}
                  </h1>
                  <p className="text-gray-600 text-sm md:text-base break-words">
                    {"Here’s your creator overview: events, attendees, and revenue"}
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-white p-1">
                  {(["all", "free", "paid"] as EventTypeFilter[]).map((t) => (
                    <Button
                      key={t}
                      variant={typeFilter === t ? "default" : "ghost"}
                      onClick={() => setTypeFilter(t)}
                      className={`h-8 ${typeFilter === t ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-gray-700"}`}
                    >
                      {t === "all" ? "All" : t === "free" ? "Free" : "Paid"}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-white p-1">
                  {(["30d", "90d", "all"] as RangeFilter[]).map((r) => (
                    <Button
                      key={r}
                      variant={rangeFilter === r ? "default" : "ghost"}
                      onClick={() => setRangeFilter(r)}
                      className={`h-8 ${rangeFilter === r ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-gray-700"}`}
                    >
                      {r === "30d" ? "Last 30 days" : r === "90d" ? "Last 90 days" : "All time"}
                    </Button>
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Create New Event
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
                <div className="text-lg md:text-2xl font-bold text-blue-600 break-words">{userStats.totalEvents}</div>
                <div className="text-xs md:text-sm text-gray-600 break-words">Total Events</div>
              </div>
              <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
                <div className="text-lg md:text-2xl font-bold text-green-600 break-words">{userStats.paidEvents}</div>
                <div className="text-xs md:text-sm text-gray-600 break-words">Paid Events</div>
              </div>
              <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
                <div className="text-lg md:text-2xl font-bold text-purple-600 break-words">{userStats.freeEvents}</div>
                <div className="text-xs md:text-sm text-gray-600 break-words">Free Events</div>
              </div>
              <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
                <div className="text-lg md:text-2xl font-bold text-orange-600 break-words">
                  {formatCurrency(userStats.totalRevenue)}
                </div>
                <div className="text-xs md:text-sm text-gray-600 break-words">Total Revenue</div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium break-words">Upcoming Events</CardTitle>
                <Calendar className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold break-words">{userStats.upcomingEvents}</div>
                <p className="text-xs text-gray-500 break-words">Scheduled after today</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium break-words">Avg Ticket Price</CardTitle>
                <Ticket className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold break-words">
                  {formatCurrency(userStats.averageTicketPrice)}
                </div>
                <p className="text-xs text-gray-500 break-words">Across paid events</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium break-words">Total Attendees</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold break-words">{userStats.totalAttendees.toLocaleString()}</div>
                <p className="text-xs text-gray-500 break-words">Across all events</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium break-words">Revenue per Attendee</CardTitle>
                <CreditCard className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold break-words">
                  {userStats.totalAttendees > 0
                    ? formatCurrency(userStats.totalRevenue / userStats.totalAttendees)
                    : "$0"}
                </div>
                <p className="text-xs text-gray-500 break-words">Average per person</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Free vs Paid */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl break-words">Event Types Distribution</CardTitle>
                <CardDescription className="break-words">Free vs Paid events breakdown</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ChartContainer
                  config={{
                    value: {
                      label: "Events",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[240px] w-full"
                >
                  <div className="h-full w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {eventTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as any
                            const eventType = data.name === "Free Events" ? "free" : "paid"
                            const relevantEvents = filteredEvents.filter((event: any) =>
                              (eventType === "free" && (event.eventType === "free" || event.ticketPrice === 0)) ||
                              (eventType === "paid" && (event.eventType === "paid" || (event.ticketPrice && event.ticketPrice > 0)))
                            )

                            return (
                              <div className="bg-white p-4 border rounded shadow-lg max-w-xs">
                                <p className="font-medium text-lg mb-2 break-words">{data.name}</p>
                                <p className="text-sm text-gray-600 mb-3 break-words">{data.value} events</p>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  <p className="text-xs font-medium text-gray-700 border-b pb-1 break-words">
                                    Recent Events:
                                  </p>
                                  {relevantEvents.slice(0, 3).map((event: any, index: number) => (
                                    <div key={index} className="text-xs">
                                      <p className="font-medium truncate break-words">{event.eventTitle}</p>
                                      <p className="text-gray-500 break-words">
                                        {formatDate(event.eventDate)} {" • "} {event.category || "General"}
                                        {eventType === "paid" && ` • ${formatCurrency(event.ticketPrice || 0)}`}
                                      </p>
                                    </div>
                                  ))}
                                  {relevantEvents.length > 3 && (
                                    <p className="text-xs text-gray-400 break-words">
                                      {"+"}{relevantEvents.length - 3}{" more events"}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Revenue by Event */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl break-words">Revenue by Event</CardTitle>
                <CardDescription className="break-words">Revenue generated from paid events</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[260px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueBarData} barCategoryGap={20} barGap={6} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-40} textAnchor="end" height={70} />
                      <YAxis tickFormatter={(value) => `$${value}`} width={60} />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = (payload[0] as any).payload
                            // Try to find full event by label
                            const fullEvent = paidEvents.find(
                              (event: any) =>
                                (event.eventTitle.length > 15 ? event.eventTitle.substring(0, 15) + "..." : event.eventTitle) === label
                            )

                            return (
                              <div className="bg-white p-4 border rounded shadow-lg">
                                <p className="font-medium text-lg mb-2 break-words">{fullEvent?.eventTitle || label}</p>
                                <div className="space-y-1 text-sm">
                                  <p className="text-gray-600 break-words">
                                    <span className="font-medium">Date:</span> {fullEvent ? formatDate(fullEvent.eventDate) : "N/A"}
                                  </p>
                                  <p className="text-gray-600 break-words">
                                    <span className="font-medium">Category:</span> {fullEvent?.category || "General"}
                                  </p>
                                  <p className="text-gray-600 break-words">
                                    <span className="font-medium">Type:</span>
                                    <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                      <DollarSign className="w-3 h-3 mr-1" />
                                      {"Paid Event"}
                                    </span>
                                  </p>
                                  <p className="text-gray-600 break-words">
                                    <span className="font-medium">Revenue:</span> {formatCurrency(data.revenue)}
                                  </p>
                                  <p className="text-gray-600 break-words">
                                    <span className="font-medium">Ticket Price:</span> {formatCurrency(data.ticketPrice)}
                                  </p>
                                  <p className="text-gray-600 break-words">
                                    <span className="font-medium">Attendees:</span> {data.attendees}
                                  </p>
                                  <p className="text-gray-600 break-words">
                                    <span className="font-medium">Venue:</span> {fullEvent?.venue || "N/A"}
                                  </p>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categories */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl break-words">Event Categories</CardTitle>
                <CardDescription className="break-words">Distribution by event category</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ChartContainer
                  config={{
                    value: {
                      label: "Events",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[240px] w-full"
                >
                  <div className="h-full w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-cat-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = (payload[0] as any).payload
                            const categoryEvents = filteredEvents.filter(
                              (event: any) => (event.category || event.eventCategory || "Other") === data.name
                            )

                            return (
                              <div className="bg-white p-4 border rounded shadow-lg max-w-xs">
                                <p className="font-medium text-lg mb-2 break-words">{data.name}</p>
                                <p className="text-sm text-gray-600 mb-3 break-words">
                                  {data.value} events ({data.percentage}%)
                                </p>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  <p className="text-xs font-medium text-gray-700 border-b pb-1 break-words">
                                    Events in this category:
                                  </p>
                                  {categoryEvents.slice(0, 3).map((event: any, index: number) => (
                                    <div key={index} className="text-xs">
                                      <p className="font-medium truncate break-words">{event.eventTitle}</p>
                                      <p className="text-gray-500 break-words">
                                        {formatDate(event.eventDate)} {" • "}
                                        {(event.eventType === "paid" || (event.ticketPrice > 0)) ? "Paid" : "Free"}
                                        {(event.eventType === "paid" || (event.ticketPrice > 0)) &&
                                          ` • ${formatCurrency(event.ticketPrice || 0)}`}
                                      </p>
                                    </div>
                                  ))}
                                  {categoryEvents.length > 3 && (
                                    <p className="text-xs text-gray-400 break-words">
                                      {"+"}{categoryEvents.length - 3}{" more events"}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Attendance vs Revenue */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl break-words">Attendance vs Revenue</CardTitle>
                <CardDescription className="break-words">Correlation between attendance and revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    attendees: {
                      label: "Attendees",
                      color: "#3b82f6",
                    },
                    revenue: {
                      label: "Revenue",
                      color: "#10b981",
                    },
                  }}
                  className="h-[260px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 18 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-28} textAnchor="end" height={48} tickMargin={2} />
                      <YAxis yAxisId="left" width={40} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${value}`} width={60} />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const fullEvent = paidEvents.find(
                              (event: any) =>
                                (event.eventTitle.length > 10 ? event.eventTitle.substring(0, 10) + "..." : event.eventTitle) === label
                            )
                            const attendeesVal = Number(payload.find((p: any) => p.dataKey === "attendees")?.value || 0)
                            const revenueVal = Number(payload.find((p: any) => p.dataKey === "revenue")?.value || 0)

                            return (
                              <div className="bg-white p-4 border rounded shadow-lg">
                                <p className="font-medium text-lg mb-2 break-words">{fullEvent?.eventTitle || label}</p>
                                <div className="space-y-1 text-sm">
                                  <p className="text-gray-600 break-words">
                                    <span className="font-medium">Date:</span> {fullEvent ? formatDate(fullEvent.eventDate) : "N/A"}
                                  </p>
                                  <p className="text-gray-600 break-words">
                                    <span className="font-medium">Category:</span> {fullEvent?.category || "General"}
                                  </p>
                                  <p className="text-gray-600 break-words">
                                    <span className="font-medium">Type:</span>
                                    <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                      <DollarSign className="w-3 h-3 mr-1" />
                                      {"Paid Event"}
                                    </span>
                                  </p>
                                  <p style={{ color: "#3b82f6" }} className="break-words">
                                    <span className="font-medium">Attendees:</span> {attendeesVal}
                                  </p>
                                  <p style={{ color: "#10b981" }} className="break-words">
                                    <span className="font-medium">Revenue:</span> {formatCurrency(revenueVal)}
                                  </p>
                                  <p className="text-gray-600 break-words">
                                    <span className="font-medium">Venue:</span> {fullEvent?.venue || "N/A"}
                                  </p>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="attendees" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Events (compact, mobile-friendly) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Calendar className="h-5 w-5" />
                {"Recent Events"}
              </CardTitle>
              <CardDescription>{"Your latest event activities"}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile cards */}
              <div className="md:hidden space-y-3 p-4">
                {getPaginatedData(filteredEvents, overviewPage).map((event: any) => (
                  <div key={event.eventId} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{event.eventTitle}</h4>
                        <p className="text-sm text-gray-600">{event.category || "General"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {event.ticketPrice > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {"Paid"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {"Free"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <Button size="sm" variant="outline" className="text-xs">
                          {"View"}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">{"Date:"}</span>
                        <p className="font-medium">{formatDate(event.eventDate)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">{"Venue:"}</span>
                        <p className="font-medium truncate">{event.venue}</p>
                      </div>
                      {event.ticketPrice > 0 && (
                        <>
                          <div>
                            <span className="text-gray-500">{"Price:"}</span>
                            <p className="font-medium">{formatCurrency(event.ticketPrice)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">{"Revenue:"}</span>
                            <p className="font-medium">
                              {formatCurrency((event.ticketPrice || 0) * (event.ticketsSold || event.ticketCount || 0))}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">{"Event"}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">{"Date"}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">{"Type"}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">{"Price"}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">{"Revenue"}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">{"Venue"}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">{"Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedData(filteredEvents, overviewPage).map((event: any) => (
                      <tr key={event.eventId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <h4 className="font-medium">{event.eventTitle}</h4>
                            <p className="text-sm text-gray-600">{event.category || "General"}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(event.eventDate)}</td>
                        <td className="py-3 px-4">
                          {event.ticketPrice > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {"Paid"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {"Free"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {event.ticketPrice > 0 ? formatCurrency(event.ticketPrice) : "Free"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {event.ticketPrice > 0
                            ? formatCurrency((event.ticketPrice || 0) * (event.ticketsSold || event.ticketCount || 0))
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{event.venue || "-"}</td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline">
                            {"View"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t">
                <div className="text-sm text-gray-600 text-center sm:text-left">
                  {"Page "} {overviewPage} {" of "} {getTotalPages(filteredEvents.length)}
                </div>
                <div className="flex justify-center sm:justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={overviewPage === 1}
                    onClick={() => setOverviewPage((p) => Math.max(1, p - 1))}
                    className="flex-1 sm:flex-none"
                  >
                    {"Previous"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={overviewPage === getTotalPages(filteredEvents.length) || getTotalPages(filteredEvents.length) === 0}
                    onClick={() => setOverviewPage((p) => Math.min(getTotalPages(filteredEvents.length), p + 1))}
                    className="flex-1 sm:flex-none"
                  >
                    {"Next"}
                  </Button>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>

          {/* Organizations (optional small panel) */}
          {organizations?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-gray-700" />
                  {"Your Organizations"}
                </CardTitle>
                <CardDescription>
                  {"Linked organizations that can host your events"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {organizations.map((org: any, idx: number) => (
                    <div key={idx} className="rounded-md border border-gray-200 p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-gray-600">{org.role || "Member"}</p>
                      </div>
                      <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        {"View"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
    
  )
}

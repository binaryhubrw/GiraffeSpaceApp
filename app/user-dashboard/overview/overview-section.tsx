"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, Users, DollarSign, Ticket, CreditCard, Building } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts"

interface OverviewSectionProps {
  user: any
  organizations: any[]
  userEvents: any[]
  eventsLoading?: boolean
  eventsError?: string | null
}

type EventTypeFilter = "all" | "free" | "paid"
type RangeFilter = "30d" | "90d" | "all"

const COLORS = [    "rgba(59, 130, 246, 1)",   // 100% opacity
          "#818cf8",
          "rgba(59, 130, 246, 0.7)",
          "rgba(59, 130, 246, 0.55)",
          "rgba(59, 130, 246, 0.4)",
          "#4f46e5"]

export default function OverviewSection({
  user = {
    firstName: "Amani",
    lastName: "N.",
    profilePictureURL: "",
  },
  organizations = [],
  userEvents = [],
  eventsLoading = false,
  eventsError = null,
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

  const now = new Date()
  const fromDate = useMemo(() => {
    if (rangeFilter === "all") return null
    const d = new Date(now)
    if (rangeFilter === "30d") d.setDate(d.getDate() - 30)
    if (rangeFilter === "90d") d.setDate(d.getDate() - 90)
    return d
  }, [rangeFilter])

  // Filter events by range and type - adapted for real API data structure
  const filteredEvents = useMemo(() => {
    return userEvents.filter((event: any) => {
      const eventDate = new Date(event.eventDate || event.createdAt || now)
      const inRange = !fromDate || eventDate >= fromDate
      
      // Determine if event is paid or free based on isEntryPaid field
      const isPaid = event.isEntryPaid === true
      const isFree = event.isEntryPaid === false || event.isEntryPaid === undefined

      let typeOk = true
      if (typeFilter === "paid") typeOk = isPaid
      if (typeFilter === "free") typeOk = isFree

      return inRange && typeOk
    })
  }, [userEvents, fromDate, typeFilter])

  // Stats from filtered events - adapted for real API data structure
  const freeEvents = filteredEvents.filter((event: any) => 
    event.isEntryPaid === false || event.isEntryPaid === undefined
  )
  const paidEvents = filteredEvents.filter((event: any) => 
    event.isEntryPaid === true
  )

  const userStats = {
    totalEvents: filteredEvents.length,
    upcomingEvents: filteredEvents.filter((event: any) => 
      new Date(event.eventDate || event.createdAt) > new Date()
    ).length,
    totalTickets: filteredEvents.reduce((sum: number, event: any) => 
      sum + (event.ticketCount || event.capacity || 1), 0
    ),
    totalAttendees: filteredEvents.reduce((sum: number, event: any) => 
      sum + (event.attendeeCount || event.registeredAttendees || 0), 0
    ),
    freeEvents: freeEvents.length,
    paidEvents: paidEvents.length,
    totalRevenue: paidEvents.reduce(
      (sum: number, event: any) => 
        sum + ((event.ticketPrice || 0) * (event.ticketsSold || event.registeredAttendees || event.ticketCount || 0)),
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

  // Category distribution - adapted for real API data structure
  const categoryData = filteredEvents.reduce((acc: Record<string, number>, event: any) => {
    const category = event.eventType || event.category || event.eventCategory || "Other"
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const categoryChartData = Object.entries(categoryData).map(([category, count]) => ({
    name: category,
    value: count,
    percentage: filteredEvents.length > 0 ? ((count / filteredEvents.length) * 100).toFixed(1) : "0.0",
  }))

  // Revenue by event (top 6) - adapted for real API data structure
  const revenueBarData = paidEvents.slice(0, 6).map((event: any) => ({
    name: event.eventName?.length > 15 ? event.eventName.substring(0, 15) + "..." : event.eventName || "Unknown Event",
    revenue: (event.ticketPrice || 0) * (event.ticketsSold || event.registeredAttendees || event.ticketCount || 0),
    attendees: event.registeredAttendees || event.attendeeCount || Math.floor(Math.random() * 200) + 50,
    ticketPrice: event.ticketPrice || 0,
  }))

  // Attendance vs revenue (top 8) - adapted for real API data structure
  const attendanceRevenueData = paidEvents.slice(0, 8).map((event: any) => ({
    name: event.eventName?.length > 10 ? event.eventName.substring(0, 10) + "..." : event.eventName || "Unknown Event",
    attendees: event.registeredAttendees || event.attendeeCount || Math.floor(Math.random() * 200) + 50,
    revenue: (event.ticketPrice || 0) * (event.ticketsSold || event.registeredAttendees || event.ticketCount || 0),
  }))

  const getTotalPages = (length: number) => Math.ceil(length / itemsPerPage)
  const getPaginatedData = (data: any[], page: number) => data.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount)

  if (!user) {
    return <div className="p-6">Loading...</div>
  }

  // Show loading state for events
  if (eventsLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto bg-white text-black">
        <div className="flex items-center justify-center h-[60vh] w-full">
          <span className="text-lg text-gray-500">Loading events data...</span>
        </div>
      </div>
    )
  }

  // Show error state for events
  if (eventsError) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto bg-white text-black">
        <div className="flex items-center justify-center h-[60vh] w-full">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-2">Error loading events</div>
            <div className="text-gray-600">{eventsError}</div>
          </div>
        </div>
      </div>
    )
  }

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

              {/* Filters removed per request */}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-lg md:text-2xl font-bold text-blue-600 break-words">{userStats.totalEvents}</div>
                <div className="text-xs md:text-sm text-gray-600 break-words">Total Events</div>
              </div>
              <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-lg md:text-2xl font-bold text-green-600 break-words">{userStats.paidEvents}</div>
                <div className="text-xs md:text-sm text-gray-600 break-words">Paid Events</div>
              </div>
              <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <Ticket className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-lg md:text-2xl font-bold text-purple-600 break-words">{userStats.freeEvents}</div>
                <div className="text-xs md:text-sm text-gray-600 break-words">Free Events</div>
              </div>
              <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-lg md:text-2xl font-bold text-orange-600 break-words">
                  {formatCurrency(userStats.totalRevenue)}
                </div>
                <div className="text-xs md:text-sm text-gray-600 break-words">Total Revenue</div>
              </div>
            </div>
          </div>

          

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Free Events Chart */}
            <Card className="overflow-hidden">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-lg md:text-xl break-words">
                   <Ticket className="h-5 w-5 text-purple-600" />
                   Free Events Overview
                 </CardTitle>
                 <CardDescription className="break-words">Distribution of your free events by category with attendance</CardDescription>
              </CardHeader>
               <CardContent>
                 {freeEvents.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-[260px] text-center">
                     <Ticket className="h-12 w-12 text-gray-300 mb-4" />
                     <h3 className="text-lg font-medium text-gray-900 mb-2">No Free Events</h3>
                     <p className="text-gray-600 max-w-sm">
                       You haven't created any free events yet. Free events are great for building your audience!
                     </p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                <ChartContainer
                  config={{
                    value: {
                      label: "Events",
                      color: "hsl(var(--chart-1))",
                    },
                         attendance: {
                           label: "Attendance",
                           color: "hsl(var(--chart-2))",
                         },
                  }}
                       className="h-[260px] w-full"
                >
                  <div className="h-full w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                               data={freeEvents.reduce((acc: any[], event: any) => {
                                 const category = event.eventType || event.category || "General";
                                 const existingCategory = acc.find(item => item.name === category);
                                 if (existingCategory) {
                                   existingCategory.value += 1;
                                   existingCategory.totalAttendance += event.registeredAttendees || event.attendeeCount || 0;
                                 } else {
                                   acc.push({ 
                                     name: category, 
                                     value: 1, 
                                     totalAttendance: event.registeredAttendees || event.attendeeCount || 0,
                                     color: COLORS[acc.length % COLORS.length] 
                                   });
                                 }
                                 return acc;
                               }, [] as any[]).map(category => ({
                                 ...category,
                                 attendancePercentage: freeEvents.length > 0 
                                   ? ((category.totalAttendance / freeEvents.reduce((sum: number, event: any) => sum + (event.registeredAttendees || event.attendeeCount || 0), 0)) * 100).toFixed(1)
                                   : "0.0"
                               }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                               outerRadius={80}
                               innerRadius={40}
                          fill="#8884d8"
                          dataKey="value"
                               label={({ name, attendancePercentage }) => `${attendancePercentage}%`}
                             >
                               {freeEvents.reduce((acc: any[], event: any) => {
                                 const category = event.eventType || event.category || "General";
                                 const existingCategory = acc.find(item => item.name === category);
                                 if (existingCategory) {
                                   existingCategory.value += 1;
                                   existingCategory.totalAttendance += event.registeredAttendees || event.attendeeCount || 0;
                                 } else {
                                   acc.push({ 
                                     name: category, 
                                     value: 1, 
                                     totalAttendance: event.registeredAttendees || event.attendeeCount || 0,
                                     color: COLORS[acc.length % COLORS.length] 
                                   });
                                 }
                                 return acc;
                               }, [] as any[]).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                                   const data = payload[0].payload as any;
                                   const categoryEvents = freeEvents.filter(
                                     (event: any) => (event.eventType || event.category || "General") === data.name
                                   );
                                   const totalAttendance = freeEvents.reduce((sum: number, event: any) => sum + (event.registeredAttendees || event.attendeeCount || 0), 0);
                                   const attendancePercentage = totalAttendance > 0 
                                     ? ((data.totalAttendance / totalAttendance) * 100).toFixed(1)
                                     : "0.0";

                            return (
                              <div className="bg-white p-4 border rounded shadow-lg max-w-xs">
                                <p className="font-medium text-lg mb-2 break-words">{data.name}</p>
                                       <div className="space-y-2 mb-3">
                                         <p className="text-sm text-gray-600 break-words">
                                           <span className="font-medium">{data.value} events</span>
                                         </p>
                                         <p className="text-sm text-gray-600 break-words">
                                           <span className="font-medium">{data.totalAttendance} total attendees</span>
                                         </p>
                                         <p className="text-sm text-purple-600 break-words">
                                           <span className="font-medium">{attendancePercentage}% of total attendance</span>
                                         </p>
                                       </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  <p className="text-xs font-medium text-gray-700 border-b pb-1 break-words">
                                           Events in this category:
                                  </p>
                                         {categoryEvents.slice(0, 3).map((event: any, index: number) => (
                                    <div key={index} className="text-xs">
                                      <p className="font-medium truncate break-words">{event.eventName || "Unknown Event"}</p>
                                      <p className="text-gray-500 break-words">
                                               {formatDate(event.eventDate || event.createdAt)} • {event.registeredAttendees || event.attendeeCount || 0} attendees
                                               {(() => {
                                                 const attendees = event.registeredAttendees || event.attendeeCount || 0;
                                                 if (attendees > 0) {
                                                   return (
                                                     <span className="text-purple-600 ml-1">
                                                       ({((attendees / data.totalAttendance) * 100).toFixed(1)}%)
                                                     </span>
                                                   );
                                                 }
                                                 return null;
                                               })()}
                                      </p>
                                    </div>
                                  ))}
                                         {categoryEvents.length > 3 && (
                                    <p className="text-xs text-gray-400 break-words">
                                             +{categoryEvents.length - 3} more events
                                    </p>
                                  )}
                                </div>
                              </div>
                                   );
                          }
                                 return null;
                        }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartContainer>

                     {/* Legend */}
                     <div className="flex flex-wrap gap-3 justify-center">
                       {freeEvents.reduce((acc: any[], event: any) => {
                         const category = event.eventType || event.category || "General";
                         const existingCategory = acc.find(item => item.name === category);
                         if (existingCategory) {
                           existingCategory.value += 1;
                           existingCategory.totalAttendance += event.registeredAttendees || event.attendeeCount || 0;
                         } else {
                           acc.push({ 
                             name: category, 
                             value: 1, 
                             totalAttendance: event.registeredAttendees || event.attendeeCount || 0,
                             color: COLORS[acc.length % COLORS.length] 
                           });
                         }
                         return acc;
                       }, [] as any[]).map(category => ({
                         ...category,
                         attendancePercentage: freeEvents.length > 0 
                           ? ((category.totalAttendance / freeEvents.reduce((sum: number, event: any) => sum + (event.registeredAttendees || event.attendeeCount || 0), 0)) * 100).toFixed(1)
                           : "0.0"
                       })).map((category, index) => (
                         <div key={index} className="flex items-center gap-2 text-sm">
                           <div 
                             className="w-3 h-3 rounded-full" 
                             style={{ backgroundColor: category.color }}
                           />
                           <span className="font-medium">{category.name}</span>
                           <span className="text-purple-600 font-semibold">({category.attendancePercentage}%)</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </CardContent>
            </Card>

            {/*payed evenet */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl break-words">Paid Events Overview</CardTitle>
                <CardDescription className="break-words">Your paid events with ticket prices and attendance</CardDescription>
              </CardHeader>
              <CardContent>
                {paidEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Paid Events</h3>
                    <p className="text-gray-600 mb-4">You haven't created any paid events yet.</p>
                    <Button className="bg-green-600 hover:bg-green-700">
                      Create Paid Event
                    </Button>
                  </div>
                ) : (
                  <>
                    <ChartContainer
                      config={{
                        ticketPrice: {
                          label: "Ticket Price",
                          color: "hsl(var(--chart-1))",
                        },
                        attendees: {
                          label: "Attendees",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                      className="h-[260px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={paidEvents.slice(0, 8).map((event: any) => ({
                          name: event.eventName?.length > 12 ? event.eventName.substring(0, 12) + "..." : event.eventName || "Unknown Event",
                          ticketPrice: event.ticketPrice || 0,
                          attendees: event.registeredAttendees || event.attendeeCount || 0,
                          revenue: (event.ticketPrice || 0) * (event.registeredAttendees || event.attendeeCount || 0),
                          fullName: event.eventName || "Unknown Event"
                        }))} barCategoryGap={8} barGap={4} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-40} textAnchor="end" height={70} />
                          <YAxis yAxisId="left" tickFormatter={(value) => `$${value}`} width={60} />
                          <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}`} width={60} />
                          <ChartTooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = (payload[0] as any).payload
                                const fullEvent = paidEvents.find(
                                  (event: any) => event.eventName === data.fullName
                                )

                                return (
                                  <div className="bg-white p-4 border rounded shadow-lg">
                                    <p className="font-medium text-lg mb-2 break-words">{data.fullName}</p>
                                    <div className="space-y-1 text-sm">
                                      <p className="text-gray-600 break-words">
                                        <span className="font-medium">Date:</span> {fullEvent ? formatDate(fullEvent.eventDate || fullEvent.createdAt) : "N/A"}
                                      </p>
                                      <p className="text-gray-600 break-words">
                                        <span className="font-medium">Category:</span> {fullEvent?.eventType || fullEvent?.category || "General"}
                                      </p>
                                      <p className="text-gray-600 break-words">
                                        <span className="font-medium">Ticket Price:</span> {formatCurrency(data.ticketPrice)}
                                      </p>
                                      <p className="text-gray-600 break-words">
                                        <span className="font-medium">Attendees:</span> {data.attendees}
                                      </p>
                                      <p className="text-gray-600 break-words">
                                        <span className="font-medium">Revenue:</span> {formatCurrency(data.revenue)}
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
                          <Bar yAxisId="left" dataKey="ticketPrice" fill="rgba(59, 130, 246, 1)" radius={[4, 4, 0, 0]} maxBarSize={26} name="Ticket Price" />
                          <Bar yAxisId="right" dataKey="attendees" fill="rgba(16, 185, 129, 1)" radius={[4, 4, 0, 0]} maxBarSize={26} name="Attendees" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    {/* Paid Events Summary */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">Total Paid Events</p>
                            <p className="text-2xl font-bold text-blue-900">{paidEvents.length}</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(userStats.totalRevenue)}</p>
                          </div>
                          <CreditCard className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-600">Avg Ticket Price</p>
                            <p className="text-2xl font-bold text-purple-900">{formatCurrency(userStats.averageTicketPrice)}</p>
                          </div>
                          <Ticket className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
                        <h4 className="font-medium text-gray-900 truncate">{event.eventName || "Unknown Event"}</h4>
                        <p className="text-sm text-gray-600">{event.eventType || "General"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {event.isEntryPaid === true ? (
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
                        <p className="font-medium">{formatDate(event.eventDate || event.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">{"Venue:"}</span>
                        <p className="font-medium truncate">{event.venue || event.venueName || "-"}</p>
                      </div>
                      {event.isEntryPaid === true && (
                        <>
                          <div>
                            <span className="text-gray-500">{"Price:"}</span>
                            <p className="font-medium">{formatCurrency(event.ticketPrice || 0)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">{"Revenue:"}</span>
                            <p className="font-medium">
                              {formatCurrency((event.ticketPrice || 0) * (event.ticketsSold || event.registeredAttendees || event.ticketCount || 0))}
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
                            <h4 className="font-medium">{event.eventName || "Unknown Event"}</h4>
                            <p className="text-sm text-gray-600">{event.eventType || "General"}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(event.eventDate || event.createdAt)}</td>
                        <td className="py-3 px-4">
                          {event.isEntryPaid === true ? (
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
                          {event.isEntryPaid === true ? formatCurrency(event.ticketPrice || 0) : "Free"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {event.isEntryPaid === true
                            ? formatCurrency((event.ticketPrice || 0) * (event.ticketsSold || event.registeredAttendees || event.ticketCount || 0))
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{event.venue || event.venueName || "-"}</td>
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

        
        </div>
      </div>
      
    
  )
}

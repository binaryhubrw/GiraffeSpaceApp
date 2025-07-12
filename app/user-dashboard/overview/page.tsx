"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function OverviewSection() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()
  const [overviewPage, setOverviewPage] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const itemsPerPage = 5

  // Mock data
  const userStats = {
    totalEventsAttended: 12,
    upcomingEvents: 3,
    totalTickets: 15,
  }

  const organizations = [
    {
      organizationId: "ORG-001",
      organizationName: "Tech Association of Rwanda",
      organizationType: "Professional Association"
    },
    {
      organizationId: "ORG-002",
      organizationName: "Corporate Events Rwanda",
      organizationType: "Event Management"
    }
  ]

  const userEvents = [
    {
      eventId: "EVT-001",
      eventTitle: "Annual Conference",
      eventType: "Conference",
      eventDate: "2025-04-15",
      venue: "Main Conference Hall",
      attendanceStatus: "Attended"
    },
    {
      eventId: "EVT-002",
      eventTitle: "Product Launch",
      eventType: "Product Launch",
      eventDate: "2025-04-20",
      venue: "Exhibition Center",
      attendanceStatus: "Attended"
    },
    {
      eventId: "EVT-003",
      eventTitle: "Team Building Retreat",
      eventType: "Corporate",
      eventDate: "2025-04-25",
      venue: "Mountain Resort",
      attendanceStatus: "Attended"
    }
  ]

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

  const getTotalPages = (length: number) => Math.ceil(length / itemsPerPage)
  const getPaginatedData = (data: any[], page: number) => data.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  return (
    <div className="">
      <div className={`transform transition-all duration-1000 ease-out ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
        <div className="space-y-8">
      {/* User Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
            {user.profilePictureURL ? (
              <img
                src={user.profilePictureURL || "/placeholder.svg"}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.firstName}!</h1>
            <p className="text-gray-600">Here's your event activity overview</p>
          </div>
        </div>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{userStats.totalEventsAttended}</div>
            <div className="text-sm text-gray-600">Events Attended</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600">{userStats.upcomingEvents}</div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{userStats.totalTickets}</div>
            <div className="text-sm text-gray-600">Total Tickets</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{organizations.length}</div>
            <div className="text-sm text-gray-600">Organizations</div>
          </div>
        </div>
      </div>
      {/* Recent Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Recent Events
          </CardTitle>
          <CardDescription>Your latest event activities</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Event</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Venue</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedData(userEvents, overviewPage).map((event) => (
                  <tr key={event.eventId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <h4 className="font-medium">{event.eventTitle}</h4>
                        <p className="text-sm text-gray-600">{event.eventType}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(event.eventDate)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{event.venue}</td>
                    <td className="py-3 px-4">{event.attendanceStatus}</td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex justify-end gap-2 mt-4 p-4">
            <Button size="sm" variant="outline" disabled={overviewPage === 1} onClick={() => setOverviewPage(overviewPage - 1)}>Previous</Button>
            <span className="px-2 py-1 text-sm">Page {overviewPage} of {getTotalPages(userEvents.length)}</span>
            <Button size="sm" variant="outline" disabled={overviewPage === getTotalPages(userEvents.length)} onClick={() => setOverviewPage(overviewPage + 1)}>Next</Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
    </div>
  )
} 
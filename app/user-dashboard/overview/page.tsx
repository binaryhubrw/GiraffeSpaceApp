"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OverviewSectionProps {
  user: any
  organizations: any[]
  userEvents: any[]
}

export default function OverviewSection({ user, organizations, userEvents }: OverviewSectionProps) {
  const [overviewPage, setOverviewPage] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const itemsPerPage = 5

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  if (!user) {
    return <div>Loading...</div>
  }

  // You can calculate stats from userEvents/organizations if needed
  const userStats = {
    totalEventsAttended: userEvents.length,
    upcomingEvents: 3, // Example static value
    totalTickets: 15, // Example static value
  }

  const getTotalPages = (length: number) => Math.ceil(length / itemsPerPage)
  const getPaginatedData = (data: any[], page: number) => data.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  return (
    <div className="p-4 md:p-8">
      <div className={`transform transition-all duration-1000 ease-out ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
        <div className="space-y-6 md:space-y-8">
      {/* User Welcome Section - Mobile Responsive */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg md:text-xl font-bold flex-shrink-0">
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
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Welcome back, {user.firstName}!</h1>
            <p className="text-gray-600 text-sm md:text-base">Here's your event activity overview</p>
          </div>
        </div>
        {/* Quick Stats - Mobile Responsive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
            <div className="text-lg md:text-2xl font-bold text-blue-600">{userStats.totalEventsAttended}</div>
            <div className="text-xs md:text-sm text-gray-600">Events Attended</div>
          </div>
          <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
            <div className="text-lg md:text-2xl font-bold text-green-600">{userStats.upcomingEvents}</div>
            <div className="text-xs md:text-sm text-gray-600">Upcoming</div>
          </div>
          <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
            <div className="text-lg md:text-2xl font-bold text-purple-600">{userStats.totalTickets}</div>
            <div className="text-xs md:text-sm text-gray-600">Total Tickets</div>
          </div>
          <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm">
            <div className="text-lg md:text-2xl font-bold text-orange-600">{organizations.length}</div>
            <div className="text-xs md:text-sm text-gray-600">Organizations</div>
          </div>
        </div>
      </div>
      
      {/* Recent Events - Mobile Responsive */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg md:text-xl">
            <Calendar className="h-5 w-5 md:h-6 md:w-6 mr-2" />
            Recent Events
          </CardTitle>
          <CardDescription className="text-sm md:text-base">Your latest event activities</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3 p-4">
            {getPaginatedData(userEvents, overviewPage).map((event) => (
              <div key={event.eventId} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{event.eventTitle}</h4>
                    <p className="text-sm text-gray-600">{event.eventType}</p>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <Button size="sm" variant="outline" className="text-xs">
                      View
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <p className="font-medium">{formatDate(event.eventDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Venue:</span>
                    <p className="font-medium truncate">{event.venue}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium">{event.attendanceStatus}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto">
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
          
          {/* Pagination - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t">
            <div className="text-sm text-gray-600 text-center sm:text-left">
              Page {overviewPage} of {getTotalPages(userEvents.length)}
            </div>
            <div className="flex justify-center sm:justify-end gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                disabled={overviewPage === 1} 
                onClick={() => setOverviewPage(overviewPage - 1)}
                className="flex-1 sm:flex-none"
              >
                Previous
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                disabled={overviewPage === getTotalPages(userEvents.length)} 
                onClick={() => setOverviewPage(overviewPage + 1)}
                className="flex-1 sm:flex-none"
              >
                Next
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
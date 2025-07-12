"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function TicketsSection() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()
  const [ticketsPage, setTicketsPage] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const itemsPerPage = 5

  // Mock user events data
  const userEvents = [
    {
      ticketId: "TKT-001",
      eventTitle: "Annual Conference",
      eventType: "Conference",
      eventDate: "2025-04-15",
      eventStartTime: "09:00",
      eventEndTime: "17:00",
      venue: "Main Conference Hall",
      attendanceStatus: "Confirmed"
    },
    {
      ticketId: "TKT-002",
      eventTitle: "Product Launch",
      eventType: "Product Launch",
      eventDate: "2025-04-20",
      eventStartTime: "10:00",
      eventEndTime: "14:00",
      venue: "Exhibition Center",
      attendanceStatus: "Confirmed"
    },
    {
      ticketId: "TKT-003",
      eventTitle: "Team Building Retreat",
      eventType: "Corporate",
      eventDate: "2025-04-25",
      eventStartTime: "08:00",
      eventEndTime: "18:00",
      venue: "Mountain Resort",
      attendanceStatus: "Pending"
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

  const getPaginatedData = (data, page) => data.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const getTotalPages = (dataLength) => Math.ceil(dataLength / itemsPerPage)
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const formatTime = (timeString) => new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })

  return (
    <div className="p-8">
      <div className={`transform transition-all duration-1000 ease-out ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">My Tickets</h2>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Event</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Date & Time</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Venue</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Ticket ID</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Status</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getPaginatedData(userEvents, ticketsPage).map((event) => (
                            <tr key={event.ticketId} className="border-b hover:bg-gray-50">
                              <td className="py-4 px-6">
                                <div>
                                  <h4 className="font-medium">{event.eventTitle}</h4>
                                  <p className="text-sm text-gray-600">{event.eventType}</p>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="text-sm">
                                  <div className="font-medium">{formatDate(event.eventDate)}</div>
                                  <div className="text-gray-600">
                                    {formatTime(event.eventStartTime)} - {formatTime(event.eventEndTime)}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-600">{event.venue}</td>
                              <td className="py-4 px-6">
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{event.ticketId}</code>
                              </td>
                              <td className="py-4 px-6">{event.attendanceStatus}</td>
                              <td className="py-4 px-6">
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination */}
                    <div className="flex justify-end gap-2 mt-4 p-4">
                      <Button size="sm" variant="outline" disabled={ticketsPage === 1} onClick={() => setTicketsPage(ticketsPage - 1)}>Previous</Button>
                      <span className="px-2 py-1 text-sm">Page {ticketsPage} of {getTotalPages(userEvents.length)}</span>
                      <Button size="sm" variant="outline" disabled={ticketsPage === getTotalPages(userEvents.length)} onClick={() => setTicketsPage(ticketsPage + 1)}>Next</Button>
                    </div>
                  </CardContent>
                </Card>
      </div>
    </div>
    </div>
  )
} 
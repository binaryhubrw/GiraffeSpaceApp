"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { isToday, isThisWeek, isThisMonth, parseISO, isAfter, isBefore } from "date-fns"

export default function TicketsSection() {
  const [ticketsPage, setTicketsPage] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const itemsPerPage = 5
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")

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

  const getPaginatedData = (data: any[], page: number) => data.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const getTotalPages = (dataLength: number) => Math.ceil(dataLength / itemsPerPage)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const formatTime = (timeString: string) => new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })

  // Filter tickets based on search, status, and date
  const filteredTickets = userEvents.filter(ticket => {
    const matchesSearch =
      ticket.eventTitle.toLowerCase().includes(search.toLowerCase()) ||
      ticket.ticketId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? ticket.attendanceStatus === statusFilter : true;

    // Date filtering
    let matchesDate = true
    const ticketDate = parseISO(ticket.eventDate)
    if (dateFilter === "today") {
      matchesDate = isToday(ticketDate)
    } else if (dateFilter === "thisWeek") {
      matchesDate = isThisWeek(ticketDate, { weekStartsOn: 1 })
    } else if (dateFilter === "thisMonth") {
      matchesDate = isThisMonth(ticketDate)
    } else if (dateFilter === "custom") {
      if (customStartDate && customEndDate) {
        const start = parseISO(customStartDate)
        const end = parseISO(customEndDate)
        matchesDate = (isAfter(ticketDate, start) || ticketDate.getTime() === start.getTime()) &&
                      (isBefore(ticketDate, end) || ticketDate.getTime() === end.getTime())
      } else {
        matchesDate = true
      }
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="p-8">
      <div className={`transform transition-all duration-1000 ease-out ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">My Tickets</h2>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row gap-4 mb-4 w-full items-center justify-between px-4 pt-4">
                      <input
                        type="text"
                        placeholder="Search tickets..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="input input-bordered w-full md:w-64"
                      />
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="input input-bordered w-full md:w-48"
                      >
                        <option value="">All Statuses</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Used">Used</option>
                        <option value="Expired">Expired</option>
                      </select>
                      {/* Date Filter */}
                      <select
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        className="input input-bordered w-full md:w-48"
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
                      <div className="text-sm text-gray-600">Total: {filteredTickets.length} tickets</div>
                    </div>
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
                          {getPaginatedData(filteredTickets, ticketsPage).map((event) => (
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
                      <span className="px-2 py-1 text-sm">Page {ticketsPage} of {getTotalPages(filteredTickets.length)}</span>
                      <Button size="sm" variant="outline" disabled={ticketsPage === getTotalPages(filteredTickets.length)} onClick={() => setTicketsPage(ticketsPage + 1)}>Next</Button>
                    </div>
                  </CardContent>
                </Card>
      </div>
    </div>
    </div>
  )
} 
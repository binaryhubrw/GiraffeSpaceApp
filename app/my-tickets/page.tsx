"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Loader2, Ticket, CheckCircle, XCircle, DollarSign, Calendar, MapPin } from "lucide-react"
import { isToday, isThisWeek, isThisMonth, parseISO, isAfter, isBefore } from "date-fns"
import { useAuth } from "@/contexts/auth-context" // Assuming this context is available
import { toast } from "sonner" // Assuming sonner is configured
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import Footer from "@/components/footer"
import { API_BASE_URL } from "@/lib/config"

interface Ticket {
  registrationId: string
  attendeeName: string
  ticketTypeName: string
  eventId: string
  eventName: string
  venueId: string
  venueName: string
  venueGoogleMapsLink: string
  noOfTickets: number
  totalCost: string
  registrationDate: string
  attendedDate: string
  paymentStatus: string // Still in interface, but not displayed in table
  qrCode: string
  buyerId: string
  attended?: boolean // This field is now used for filtering and display
  payment: {
    paymentId: string
    amountPaid: string
    paymentMethod: string
    paymentStatus: string
    paymentReference: string
    notes: string
  }
}

export default function TicketsSection() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ticketsPage, setTicketsPage] = useState(1)
  const itemsPerPage = 5
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // Re-added statusFilter state
  const [dateFilter, setDateFilter] = useState("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")

  const { user } = useAuth() // Get user from auth context
  const router = useRouter()

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user?.userId) {
        setError("User not authenticated.")
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("Authentication token not found.")
        }
        const response = await fetch(`${API_BASE_URL}/event/tickets/user/${user.userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            if (response.status === 404 && errorData.message === "No tickets found for this user.") {
              setTickets([])
              setError(null)
              return;
            } else {
              throw new Error(errorData.message || `HTTP error! status: ${response.status}, Details: ${errorText}`);
            }
          } catch (jsonError) {
            // If parsing as JSON fails, it's likely a plain HTML error page
            throw new Error(`The server returned an unexpected response. Please try again later.`);
          }
        }

        const data = await response.json()

        if (data.success) {
          setTickets(data.data)
          setError(null)
        } else {
          // This else block handles cases where response.ok is true but data.success is false
          setError(data.message || "We couldn't retrieve your tickets. Please try again.")
          toast.error(data.message || "Failed to retrieve tickets.")
        }
      } catch (err: any) {
        console.error("Fetch error:", err)
        setError(err.message || "An unexpected error occurred while loading your tickets.")
        toast.error(err.message || "Failed to load tickets.")
      } finally {
        setLoading(false)
      }
    }
    fetchTickets()
  }, [user?.userId])

  const getPaginatedData = (data: Ticket[], page: number) => data.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const getTotalPages = (dataLength: number) => Math.ceil(dataLength / itemsPerPage)
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.eventName.toLowerCase().includes(search.toLowerCase()) ||
      ticket.registrationId.toLowerCase().includes(search.toLowerCase()) ||
      ticket.venueName.toLowerCase().includes(search.toLowerCase()) ||
      ticket.ticketTypeName.toLowerCase().includes(search.toLowerCase())

    // Re-added matchesStatus logic based on 'attended'
    const matchesStatus =
      statusFilter === "all"
        ? true // Display all tickets if "all" is selected
        : statusFilter === "active"
          ? ticket.attended === false || ticket.attended === undefined || ticket.attended === null // Active if attended is false, undefined, or null
          : statusFilter === "inactive"
            ? ticket.attended === true // Inactive only if attended is true
            : true // Fallback, should not be reached with defined options

    let matchesDate = true
    const attendedDate = parseISO(ticket.attendedDate) // Use attendedDate for filtering

    if (dateFilter === "today") {
      matchesDate = isToday(attendedDate)
    } else if (dateFilter === "thisWeek") {
      matchesDate = isThisWeek(attendedDate, { weekStartsOn: 1 })
    } else if (dateFilter === "thisMonth") {
      matchesDate = isThisMonth(attendedDate)
    } else if (dateFilter === "custom") {
      if (customStartDate && customEndDate) {
        const start = parseISO(customStartDate)
        const end = parseISO(customEndDate)
        matchesDate =
          (isAfter(attendedDate, start) || attendedDate.getTime() === start.getTime()) &&
          (isBefore(attendedDate, end) || attendedDate.getTime() === end.getTime())
      } else {
        matchesDate = true
      }
    }
    return matchesSearch && matchesStatus && matchesDate // Filter by search, status, and date
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header activePage="my-tickets" />
        <div className="flex justify-center items-center min-h-[500px]">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="ml-3 text-gray-600">Loading your tickets...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header activePage="my-tickets" />
        <div className="flex flex-col justify-center items-center min-h-[500px] text-red-600">
          <p className="text-lg font-medium">Error: {error}</p>
          <p className="text-sm text-gray-500 mt-2">Please try refreshing the page or contact support.</p>
        </div>
        <Footer />
      </div>
    )
  }

  // Calculate statistics from real data
  const totalTickets = tickets.length
  const activeTickets = tickets.filter(t => t.attended === false || t.attended === undefined || t.attended === null).length
  const usedTickets = tickets.filter(t => t.attended === true).length
  const totalSpent = tickets.reduce((sum, t) => sum + parseFloat(t.totalCost), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activePage="my-tickets" />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tickets</h1>
          <p className="text-gray-600">Manage and view all your purchased tickets</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
                </div>
                <Ticket className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Tickets</p>
                  <p className="text-2xl font-bold text-green-600">{activeTickets}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Used Tickets</p>
                  <p className="text-2xl font-bold text-blue-600">{usedTickets}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-purple-600">Frw {totalSpent.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row gap-4 mb-4 w-full items-center justify-between px-4 pt-4">
              <Input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-64"
              />
              {/* Re-added the Select component for status filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Ticket Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ticket Statuses</SelectItem>
                  <SelectItem value="active">Upcoming (Not Attended)</SelectItem>
                  <SelectItem value="inactive">Attended (Inactive)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {dateFilter === "custom" && (
                <div className="flex flex-col sm:flex-row gap-2 items-center w-full md:w-auto">
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                  <span className="text-gray-500 hidden sm:block">to</span>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                </div>
              )}
              <div className="text-sm text-gray-600 md:ml-auto">Total: {filteredTickets.length} tickets</div>
            </div>
            <div className="overflow-x-auto">
              {filteredTickets.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Event
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Venue
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Attended Date
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Ticket Type
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Tickets
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Cost
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Ticket Status
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {getPaginatedData(filteredTickets, ticketsPage).map((ticket) => (
                      <tr
                        key={ticket.registrationId}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                          <div>
                            <h4 className="font-medium">{ticket.eventName}</h4>
                            <p className="text-xs text-muted-foreground">{ticket.ticketTypeName}</p>
                          </div>
                        </td>
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground">
                          {ticket.venueName}
                          {ticket.venueGoogleMapsLink && (
                            <a
                              href={ticket.venueGoogleMapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:underline text-xs"
                            >
                              Map
                            </a>
                          )}
                        </td>
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                          <div className="text-muted-foreground">
                            <div className="font-medium">{formatDate(ticket.attendedDate)}</div>
                          </div>
                        </td>
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground">
                          {ticket.ticketTypeName}
                        </td>
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground">
                          {ticket.noOfTickets}
                        </td>
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-muted-foreground">
                          Frw {ticket.totalCost}
                        </td>
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              ticket.attended === true
                                ? 'bg-red-100 text-red-800' // Inactive if attended is true
                                : ticket.attended === false
                                  ? 'bg-green-100 text-green-800' // Active if attended is false
                                  : 'bg-gray-100 text-gray-800' // Default or N/A
                            }`}
                          >
                            {ticket.attended === true ? 'Inactive' :
                              ticket.attended === false ? 'Active' :
                              'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                sessionStorage.setItem('currentTicketDetail', JSON.stringify(ticket));
                                router.push(`/user-dashboard/tickets/${ticket.registrationId}`);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="text-lg font-semibold mb-2">No tickets found.</p>
                  <p className="text-sm">It seems you don't have any tickets yet. Explore events and book yours!</p>
                  {/* <Button className="mt-4">Browse Events</Button> */}
                </div>
              )}
            </div>
            {/* Pagination */}
            {filteredTickets.length > 0 && (
              <div className="flex justify-end gap-2 mt-4 p-4">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={ticketsPage === 1}
                  onClick={() => setTicketsPage(ticketsPage - 1)}
                >
                  Previous
                </Button>
                <span className="px-2 py-1 text-sm flex items-center">
                  Page {ticketsPage} of {getTotalPages(filteredTickets.length)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={ticketsPage === getTotalPages(filteredTickets.length)}
                  onClick={() => setTicketsPage(ticketsPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}

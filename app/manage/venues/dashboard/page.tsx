"use client"

import { useAuth } from "@/contexts/auth-context" // Assuming this path is correct
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { Eye, XCircle, DollarSign, Building, Calendar, BookOpen, Home, MinusCircle } from "lucide-react"
import Link from "next/link"
import ApiService from "@/api/apiConfig" // Assuming this path is correct
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Command, CommandInput } from "@/components/ui/command"
import { toast } from "sonner"
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
import { format, isSameMonth, parseISO } from "date-fns" // Added parseISO for date parsing
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const ITEMS_PER_PAGE = 5

// Define the interface for Venue based on the provided JSON response
interface Venue {
  venueId: string
  venueName: string
  description: string | null
  capacity: number
  amount: number
  location: string
  latitude: number
  longitude: number
  googleMapsLink: string
  managerId: string
  organizationId: string
  amenities: {
    id: string
    resourceName: string
    quantity: number
    amenitiesDescription: string
    costPerUnit: string
  }[]
  contactEmail: string
  contactPhone: string
  status: "PENDING" | "APPROVED" | "REJECTED" // Matches API response
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  cancellationReason: string | null
  mainPhotoUrl: string
  subPhotoUrls: string[]
  organization: {
    organizationId: string
    organizationName: string
    contactEmail: string
    contactPhone: string
    address: string
    status: string
  }
  bookingConditions: any[]
  availabilitySlots: {
    eventId: string | null
    id: string
    venueId: string
    Date: string
    bookedHours: string | null
    status: "BOOKED" | "TRANSITION" | "HOLDING" // Important for availability
    slotType: string
    notes: string
    metadata: any
    createdAt: string
  }[]
  venueVariables: any[]
  bookingType: string
  virtualTourUrl: string | null
  venueDocuments: string | null
}

export default function DashboardPage() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [allVenues, setAllVenues] = useState<Venue[]>([]) // Now holds real venue data
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [loadingAllVenues, setLoadingAllVenues] = useState(true)

  const [bookingFilter, setBookingFilter] = useState("")
  const [bookingDateFilter, setBookingDateFilter] = useState("")
  const [bookingPage, setBookingPage] = useState(1)

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [canceling, setCanceling] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  // Fetch bookings for manager
  useEffect(() => {
    const fetchManagerBookings = async () => {
      if (!user?.userId) return
      setLoadingBookings(true)
      try {
        const response = await ApiService.getAllBookingsByManager(user.userId)
        setBookings(response.data.bookings || [])
      } catch (err) {
        console.error("Error fetching bookings:", err)
        toast.error("Failed to fetch bookings.")
      } finally {
        setLoadingBookings(false)
      }
    }
    if (user?.userId) fetchManagerBookings()
  }, [user?.userId])

  // Fetch all managed venues from the real API
  useEffect(() => {
    const fetchAllManagedVenues = async () => {
      if (!user?.userId) return
      setLoadingAllVenues(true)
      try {
        const response = await ApiService.getVenueByManagerId(user.userId)
        setAllVenues(response.data.data || [])
      } catch (err) {
        console.error("Error fetching managed venues:", err)
        toast.error("Failed to fetch managed venues.")
      } finally {
        setLoadingAllVenues(false)
      }
    }
    if (user?.userId) fetchAllManagedVenues()
  }, [user?.userId])

  // Filtered bookings (pending only, with text and date filter)
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => b.bookingStatus === "PENDING")
      .filter((b) => {
        const search = bookingFilter.toLowerCase()
        const matchesText =
          b.eventDetails?.eventName?.toLowerCase().includes(search) ||
          b.venue?.venueName?.toLowerCase().includes(search) ||
          b.bookingStatus?.toLowerCase().includes(search)
        const matchesDate = bookingDateFilter ? (b.bookingDates?.[0]?.date || "").includes(bookingDateFilter) : true
        return matchesText && matchesDate
      })
  }, [bookings, bookingFilter, bookingDateFilter])

  const totalBookingPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE))
  const paginatedBookings = filteredBookings.slice((bookingPage - 1) * ITEMS_PER_PAGE, bookingPage * ITEMS_PER_PAGE)

  // Filter bookings for the current month for financial cards
  const currentMonthBookings = useMemo(() => {
    const now = new Date()
    return bookings.filter((b) => {
      // Assuming bookingDates[0].date is the relevant date for the booking
      if (b.bookingDates?.[0]?.date) {
        const bookingDate = parseISO(b.bookingDates[0].date)
        return isSameMonth(bookingDate, now)
      }
      return false
    })
  }, [bookings])

  // Stats calculations for financial cards using current month's data
  const totalAmountToBePaid = useMemo(() => {
    return currentMonthBookings
      .filter((b) => b.bookingStatus === "PENDING")
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  }, [currentMonthBookings])

  const totalAmountReceived = useMemo(() => {
    return currentMonthBookings
      .filter((b) => b.bookingStatus === "APPROVED")
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  }, [currentMonthBookings])

  // Venue Management Statistics
  const totalNumberOfVenues = allVenues.length

  const venuesBooked = useMemo(() => {
    const bookedVenueIds = new Set<string>()
    allVenues.forEach((venue) => {
      const isBooked = venue.availabilitySlots.some((slot) => slot.status === "BOOKED" || slot.status === "HOLDING")
      if (isBooked) {
        bookedVenueIds.add(venue.venueId)
      }
    })
    return bookedVenueIds.size
  }, [allVenues])

  const venuesAvailable = useMemo(() => {
    let availableCount = 0
    allVenues.forEach((venue) => {
      if (venue.status === "APPROVED") {
        const isBooked = venue.availabilitySlots.some((slot) => slot.status === "BOOKED" || slot.status === "HOLDING")
        if (!isBooked) {
          availableCount++
        }
      }
    })
    return availableCount
  }, [allVenues])

  const inactiveVenuesCount = useMemo(() => {
    return allVenues.filter((v) => v.status === "REJECTED").length
  }, [allVenues])

  // Calculate total venues and bookings count for the top cards
  const totalVenuesCount = allVenues.length
  const totalBookingsCount = bookings.length

  // Cancel booking handler
  const handleCancelBooking = async () => {
    if (!cancelingId) return
    setCanceling(true)
    try {
      await ApiService.cancelEventBooking(cancelingId, { reason: cancelReason })
      toast.success("Booking canceled successfully.")
      setCancelDialogOpen(false)
      setCancelReason("")
      setCancelingId(null)
      // Refresh bookings
      if (user?.userId) {
        const response = await ApiService.getAllBookingsByManager(user.userId)
        setBookings(response.data.bookings || [])
      }
    } catch (err) {
      toast.error("Failed to cancel booking.")
    } finally {
      setCanceling(false)
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="grid gap-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
              <Building className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVenuesCount}</div>
              <Link href="/manage/venues" className="text-xs text-muted-foreground hover:underline">
                View all venues
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBookingsCount}</div>
              <Link href="/manage/bookings" className="text-xs text-muted-foreground hover:underline">
                View all bookings
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Venues Booked</CardTitle>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{venuesBooked}</div>
              <CardDescription className="text-xs text-muted-foreground">
                With active or pending bookings
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount Remained</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalAmountToBePaid.toLocaleString("en-US", { style: "currency", currency: "RWF" })}
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                From pending bookings this month
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount We Have</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalAmountReceived.toLocaleString("en-US", { style: "currency", currency: "RWF" })}
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                From approved bookings this month
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* Pending Bookings Table */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Pending Bookings</CardTitle>
              <CardDescription>Bookings awaiting your approval.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
                <Command className="flex-1 w-full">
                  <CommandInput
                    placeholder="Filter bookings by event, venue, or status..."
                    value={bookingFilter}
                    onValueChange={setBookingFilter}
                    className="w-full"
                  />
                </Command>
                <div className="w-full md:w-auto flex items-center gap-2">
                  <label htmlFor="booking-date-filter" className="text-sm text-muted-foreground whitespace-nowrap">
                    Filter by date:
                  </label>
                  <Input
                    id="booking-date-filter"
                    type="date"
                    value={bookingDateFilter}
                    onChange={(e) => setBookingDateFilter(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>
              <div className="overflow-x-auto flex-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingBookings ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Loading bookings...
                        </TableCell>
                      </TableRow>
                    ) : paginatedBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No pending bookings found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedBookings.map((b, idx) => (
                        <TableRow key={b.bookingId}>
                          <TableCell>{(bookingPage - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                          <TableCell>{b.eventDetails?.eventName}</TableCell>
                          <TableCell>{b.venue?.venueName}</TableCell>
                          <TableCell>
                            {b.bookingDates?.[0]?.date ? format(new Date(b.bookingDates[0].date), "PPP") : "N/A"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                b.bookingStatus === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : b.bookingStatus === "APPROVED"
                                    ? "bg-green-100 text-green-800"
                                    : b.bookingStatus === "CANCELLED"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {b.bookingStatus}
                            </span>
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Button size="icon" variant="outline" asChild>
                              <Link href={`/manage/bookings/${b.bookingId}`} title="View Booking">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <AlertDialog
                              open={cancelDialogOpen && cancelingId === b.bookingId}
                              onOpenChange={setCancelDialogOpen}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  onClick={() => {
                                    setCancelingId(b.bookingId)
                                    setCancelDialogOpen(true)
                                  }}
                                  title="Cancel Booking"
                                  disabled={b.bookingStatus === "CANCELLED"}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Please provide a reason for canceling this booking:
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <textarea
                                  className="w-full border rounded p-2 mt-2 text-sm"
                                  rows={3}
                                  placeholder="Enter reason for cancellation..."
                                  value={cancelReason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  disabled={canceling}
                                />
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={canceling}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleCancelBooking}
                                    disabled={canceling || !cancelReason.trim()}
                                    className="bg-destructive text-white"
                                  >
                                    {canceling ? "Canceling..." : "Cancel Booking"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination for Bookings */}
              <div className="py-4 w-full flex justify-end">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setBookingPage((p) => Math.max(1, p - 1))} />
                    </PaginationItem>
                    {Array.from({ length: totalBookingPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <Button
                          size="icon"
                          variant={bookingPage === i + 1 ? "default" : "outline"}
                          onClick={() => setBookingPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext onClick={() => setBookingPage((p) => Math.min(totalBookingPages, p + 1))} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

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
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const ITEMS_PER_PAGE = 5

// New interfaces for payment data based on the provided JSON structure
interface PaymentDetail {
  paymentId: string
  amountPaid: number
  paymentMethod: string
  paymentStatus: string
  paymentReference: string | null
  paymentDate: string
  notes: string | null
}

interface Payer {
  userId: string
  username: string
  fullName: string
  email: string
  phoneNumber: string
  role: string
  location: {
    city: string
    country: string
  }
}

interface BookingPayment {
  bookingId: string
  bookingReason: string
  bookingDate: string
  amountToBePaid: number
  totalAmountPaid: number
  remainingAmount: number
  isFullyPaid: boolean
  payments: PaymentDetail[]
  payer: Payer
}

// Mock data and API service for requested venues (keeping existing mock for venues)
interface RequestedVenue {
  venueId: string
  venueName: string
  location: string
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED"
  requestedBy: string
  requestDate: string
  capacity: number
  amenities: string[]
  availability: string
}

const mockRequestedVenuesData: RequestedVenue[] = [
  {
    venueId: "req-v-1",
    venueName: "Conference Hall A",
    location: "Downtown Business District",
    status: "APPROVED",
    requestedBy: "Alice Wonderland",
    requestDate: "2024-07-28",
    capacity: 150,
    amenities: ["Projector", "WiFi", "Sound System"],
    availability: "Weekdays",
  },
  {
    venueId: "req-v-2",
    venueName: "Garden Event Space",
    location: "Green Valley Park",
    status: "APPROVED",
    requestedBy: "Bob The Builder",
    requestDate: "2024-07-29",
    capacity: 200,
    amenities: ["Outdoor Seating", "Restrooms"],
    availability: "Weekends",
  },
  {
    venueId: "req-v-3",
    venueName: "Rooftop Lounge",
    location: "City Heights",
    status: "PENDING_APPROVAL",
    requestedBy: "Charlie Chaplin",
    requestDate: "2024-07-30",
    capacity: 80,
    amenities: ["Bar", "City View", "Sound System"],
    availability: "Daily",
  },
  {
    venueId: "req-v-4",
    venueName: "Art Gallery Loft",
    location: "Arts District",
    status: "APPROVED",
    requestedBy: "Diana Prince",
    requestDate: "2024-07-25",
    capacity: 100,
    amenities: ["Exhibition Lighting", "Restrooms"],
    availability: "Weekdays",
  },
  {
    venueId: "req-v-5",
    venueName: "Warehouse Studio",
    location: "Industrial Zone",
    status: "REJECTED",
    requestedBy: "Eve Harrington",
    requestDate: "2024-08-01",
    capacity: 300,
    amenities: ["High Ceilings", "Loading Dock"],
    availability: "Daily",
  },
]

const fetchRequestedVenues = async (): Promise<{ data: { venues: RequestedVenue[] } }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { venues: mockRequestedVenuesData } })
    }, 500)
  })
}

export default function DashboardPage() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [allVenues, setAllVenues] = useState<RequestedVenue[]>([])
  const [paymentsData, setPaymentsData] = useState<BookingPayment[]>([]) // New state for payments
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [loadingAllVenues, setLoadingAllVenues] = useState(true)
  const [loadingPayments, setLoadingPayments] = useState(true) // New loading state for payments
  const [bookingFilter, setBookingFilter] = useState("")
  const [bookingDateFilter, setBookingDateFilter] = useState("")
  const [bookingPage, setBookingPage] = useState(1)
  const [paymentFilter, setPaymentFilter] = useState("") // New filter for payments
  const [paymentDateFilter, setPaymentDateFilter] = useState("") // New date filter for payments
  const [paymentPage, setPaymentPage] = useState(1) // New pagination for payments
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

  // Fetch all managed venues
  useEffect(() => {
    const fetchAllManagedVenues = async () => {
      setLoadingAllVenues(true)
      try {
        const response = await fetchRequestedVenues()
        setAllVenues(response.data.venues || [])
      } catch (err) {
        console.error("Error fetching managed venues:", err)
        toast.error("Failed to fetch managed venues.")
      } finally {
        setLoadingAllVenues(false)
      }
    }
    fetchAllManagedVenues()
  }, [])

  // Fetch payments data
  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.userId) return
      setLoadingPayments(true)
      try {
        // Construct the API URL dynamically with the user's ID
        const response = await ApiService.getFormattedManagerPayments(user.userId)
        setPaymentsData(response.data || [])
      } catch (err) {
        console.error("Error fetching payments:", err)
        toast.error("Failed to fetch payments.")
      } finally {
        setLoadingPayments(false)
      }
    }
    if (user?.userId) fetchPayments()
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

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return paymentsData.filter((p) => {
      const search = paymentFilter.toLowerCase()
      const matchesText =
        p.bookingReason?.toLowerCase().includes(search) ||
        p.payer?.fullName?.toLowerCase().includes(search) ||
        (p.isFullyPaid ? "fully paid" : "partially paid").includes(search)
      const matchesDate = paymentDateFilter ? p.bookingDate.includes(paymentDateFilter) : true
      return matchesText && matchesDate
    })
  }, [paymentsData, paymentFilter, paymentDateFilter])

  const totalPaymentPages = Math.max(1, Math.ceil(filteredPayments.length / ITEMS_PER_PAGE))
  const paginatedPayments = filteredPayments.slice((paymentPage - 1) * ITEMS_PER_PAGE, paymentPage * ITEMS_PER_PAGE)

  // Stats calculations for financial cards (now using paymentsData)
  const totalAmountToBePaid = useMemo(() => {
    return paymentsData.reduce((sum, p) => sum + (p.remainingAmount || 0), 0)
  }, [paymentsData])

  const totalAmountReceived = useMemo(() => {
    return paymentsData.reduce((sum, p) => sum + (p.totalAmountPaid || 0), 0)
  }, [paymentsData])

  // Venue Management Statistics (remain unchanged, using allVenues and bookings)
  const totalNumberOfVenues = allVenues.length
  const venuesWithBookings = useMemo(() => {
    const bookedVenueIds = new Set<string>()
    bookings.forEach((b) => {
      if (b.bookingStatus === "PENDING" || b.bookingStatus === "APPROVED") {
        bookedVenueIds.add(b.venue?.venueId)
      }
    })
    return bookedVenueIds.size
  }, [bookings])

  const venuesAvailable = useMemo(() => {
    const approvedVenueIds = new Set(allVenues.filter((v) => v.status === "APPROVED").map((v) => v.venueId))
    const bookedVenueIds = new Set<string>()
    bookings.forEach((b) => {
      if (b.bookingStatus === "PENDING" || b.bookingStatus === "APPROVED") {
        bookedVenueIds.add(b.venue?.venueId)
      }
    })
    let availableCount = 0
    approvedVenueIds.forEach((venueId) => {
      if (!bookedVenueIds.has(venueId)) {
        availableCount++
      }
    })
    return availableCount
  }, [allVenues, bookings])

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="2xl font-bold">{totalBookingsCount}</div>
              <Link href="/manage/bookings" className="text-xs text-muted-foreground hover:underline">
                View all bookings
              </Link>
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
              <CardDescription className="text-xs text-muted-foreground">From pending payments</CardDescription>
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
              <CardDescription className="text-xs text-muted-foreground">From all payments</CardDescription>
            </CardContent>
          </Card>
        </div>
        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          {/* Payment Overview Table */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Payment Overview</CardTitle>
              <CardDescription>All payment records for your bookings.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
                <Command className="flex-1 w-full">
                  <CommandInput
                    placeholder="Filter payments by reason, payer, or status..."
                    value={paymentFilter}
                    onValueChange={setPaymentFilter}
                    className="w-full"
                  />
                </Command>
                <div className="w-full md:w-auto flex items-center gap-2">
                  <label htmlFor="payment-date-filter" className="text-sm text-muted-foreground whitespace-nowrap">
                    Filter by date:
                  </label>
                  <Input
                    id="payment-date-filter"
                    type="date"
                    value={paymentDateFilter}
                    onChange={(e) => setPaymentDateFilter(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>
              <div className="overflow-x-auto flex-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount Due</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPayments ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          Loading payments...
                        </TableCell>
                      </TableRow>
                    ) : paginatedPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          No payments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPayments.map((p, idx) => (
                        <TableRow key={p.bookingId}>
                          <TableCell>{(paymentPage - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                          <TableCell>{p.bookingReason}</TableCell>
                          <TableCell>{format(new Date(p.bookingDate), "PPP")}</TableCell>
                          <TableCell>
                            {p.amountToBePaid.toLocaleString("en-US", { style: "currency", currency: "RWF" })}
                          </TableCell>
                          <TableCell>
                            {p.totalAmountPaid.toLocaleString("en-US", { style: "currency", currency: "RWF" })}
                          </TableCell>
                          <TableCell>
                            {p.remainingAmount.toLocaleString("en-US", { style: "currency", currency: "RWF" })}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                p.isFullyPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {p.isFullyPaid ? "Fully Paid" : "Partial"}
                            </span>
                          </TableCell>
                          <TableCell>{p.payer?.fullName}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination for Payments */}
              <div className="py-4 w-full flex justify-end">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setPaymentPage((p) => Math.max(1, p - 1))} />
                    </PaginationItem>
                    {Array.from({ length: totalPaymentPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <Button
                          size="icon"
                          variant={paymentPage === i + 1 ? "default" : "outline"}
                          onClick={() => setPaymentPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext onClick={() => setPaymentPage((p) => Math.min(totalPaymentPages, p + 1))} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Venue Management Statistics Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Venue Management Statistics</CardTitle>
            <CardDescription>Overview of your venue portfolio.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
                <Building className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalNumberOfVenues}</div>
                <CardDescription className="text-xs text-muted-foreground">All venues under management</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Venues Available</CardTitle>
                <Home className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{venuesAvailable}</div>
                <CardDescription className="text-xs text-muted-foreground">
                  Approved and not currently booked
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Venues Booked</CardTitle>
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{venuesWithBookings}</div>
                <CardDescription className="text-xs text-muted-foreground">
                  With active or pending bookings
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive Venues</CardTitle>
                <MinusCircle className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inactiveVenuesCount}</div>
                <CardDescription className="text-xs text-muted-foreground">Not approved or rejected</CardDescription>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

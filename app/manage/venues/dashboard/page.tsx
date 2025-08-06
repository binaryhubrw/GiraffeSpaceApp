"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { Eye, XCircle, DollarSign, Building, Calendar, BookOpen, Home, MinusCircle, CheckCircle, AlertCircle, Clock } from "lucide-react"
import Link from "next/link"
import ApiService from "@/api/apiConfig"
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
import { format, isSameMonth, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import * as RechartsPrimitive from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

const ITEMS_PER_PAGE = 5

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

interface ApiPayment {
  paymentId: string
  amountPaid: number
  paymentMethod: string
  paymentStatus: string
  paymentReference: string | null
  paymentDate: string
  notes: string | null
}

interface BookingPaymentInfo {
  bookingId: string
  bookingReason: string
  bookingDate: string
  amountToBePaid: number
  totalAmountPaid: number
  remainingAmount: number
  isFullyPaid: boolean
  payments: ApiPayment[]
  payer: Payer
}

interface PaymentsApiResponse {
  success: boolean
  data: BookingPaymentInfo[]
}

interface BookingSummary {
  totalVenues: number
  totalBookings: number
  totalAmount: number
  totalPaid: number
  totalRemaining: number
  pendingBookings: number
  approvedBookings: number
  partialBookings: number
  cancelledBookings: number
  bookingsByVenue: Array<{ venueId: string; venueName: string; totalBookings: number; totalAmount: number; totalPaid: number }>
  paymentSummary: {
    totalExpectedAmount: number
    totalPaidAmount: number
    totalPendingAmount: number
    collectionProgress: string
  }
}

interface AllBookingsApiResponse {
  success: boolean
  data: {
    bookings: any[];
    summary: BookingSummary;
  };
  message: string;
}

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
  status: "PENDING" | "APPROVED" | "REJECTED"
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
    status: "BOOKED" | "TRANSITION" | "HOLDING"
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

const bookingRateChartConfig = {
  totalBookings: {
    label: "Total Bookings",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const venueEarningsChartConfig: ChartConfig = {
  totalPaid: {
    label: "Total Paid",
  },
}

export default function DashboardPage() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [allVenues, setAllVenues] = useState<Venue[]>([])
  const [paymentsData, setPaymentsData] = useState<BookingPaymentInfo[]>([])
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(null)
  const [loadingBookingsAndSummary, setLoadingBookingsAndSummary] = useState(true)
  const [loadingAllVenues, setLoadingAllVenues] = useState(true)
  const [loadingPaymentsData, setLoadingPaymentsData] = useState(true)

  const [bookingFilter, setBookingFilter] = useState("")
  const [bookingDateFilter, setBookingDateFilter] = useState("")
  const [bookingPage, setBookingPage] = useState(1)

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [canceling, setCanceling] = useState(false)

  const bluePalette = [
    '#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#2563eb', '#1d4ed8'
  ];

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  useEffect(() => {
    const fetchManagerBookingsAndSummary = async () => {
      if (!user?.userId) return
      setLoadingBookingsAndSummary(true)
      try {
        const response: AllBookingsApiResponse = await ApiService.getAllBookingsByManager(user.userId)
        setBookings(response.data.bookings || [])
        setBookingSummary(response.data.summary || null)
      } catch (err) {
        console.error("Error fetching bookings and summary:", err)
        toast.error("Failed to fetch bookings and summary.")
      } finally {
        setLoadingBookingsAndSummary(false)
      }
    }
    if (user?.userId) fetchManagerBookingsAndSummary()
  }, [user?.userId])

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

  useEffect(() => {
    const fetchPaymentsFormatted = async () => {
      if (!user?.userId) return
      setLoadingPaymentsData(true)
      try {
        const response: PaymentsApiResponse = await ApiService.getFormattedManagerPayments(user.userId)
        if (response.success) {
          setPaymentsData(response.data || [])
        } else {
          toast.error("Failed to fetch payments data.")
        }
      } catch (err) {
        console.error("Error fetching formatted payments:", err)
        toast.error("Failed to fetch payments data.")
      } finally {
        setLoadingPaymentsData(false)
      }
    }
    if (user?.userId) fetchPaymentsFormatted()
  }, [user?.userId])

  const bookingsByVenueForCharts = useMemo(() => {
    if (!bookingSummary?.bookingsByVenue) return []

    const chartData = bookingSummary.bookingsByVenue.map((venueStats, index) => {
      const formattedVenueName = venueStats.venueName.replace(/\s/g, '');
      const color = bluePalette[index % bluePalette.length];
      
      venueEarningsChartConfig[formattedVenueName] = {
        label: venueStats.venueName,
        color: color,
      };

      return {
        venueName: venueStats.venueName,
        totalBookings: venueStats.totalBookings,
        totalAmount: venueStats.totalAmount,
        totalPaid: venueStats.totalPaid,
        color: color,
      }
    })

    return chartData
  }, [bookingSummary])

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

  const currentMonthBookings = useMemo(() => {
    const now = new Date()
    return bookings.filter((b) => {
      if (b.bookingDates?.[0]?.date) {
        const bookingDate = parseISO(b.bookingDates[0].date)
        return isSameMonth(bookingDate, now)
      }
      return false
    })
  }, [bookings])

  const totalAmountPaidOverall = useMemo(() => {
    return paymentsData.reduce((sum, booking) => sum + (booking.totalAmountPaid || 0), 0)
  }, [paymentsData])

  const overallTotalAmountRemaining = useMemo(() => {
    return paymentsData.reduce((sum, booking) => sum + (booking.remainingAmount || 0), 0)
  }, [paymentsData])

  const totalNumberOfVenues = bookingSummary?.totalVenues || 0
  const venuesBookedCount = (bookingSummary?.approvedBookings || 0) + (bookingSummary?.partialBookings || 0)
  const pendingBookingsCount = bookingSummary?.pendingBookings || 0

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

  const totalVenuesCardValue = bookingSummary?.totalVenues || 0
  const totalBookingsCardValue = bookingSummary?.totalBookings || 0

  const handleCancelBooking = async () => {
    if (!cancelingId) return
    setCanceling(true)
    try {
      await ApiService.cancelEventBooking(cancelingId, { reason: cancelReason })
      toast.success("Booking canceled successfully.")
      setCancelDialogOpen(false)
      setCancelReason("")
      setCancelingId(null)
      
      if (user?.userId) {
        const response: AllBookingsApiResponse = await ApiService.getAllBookingsByManager(user.userId)
        setBookings(response.data.bookings || [])
        setBookingSummary(response.data.summary || null)

        const paymentsResponse: PaymentsApiResponse = await ApiService.getFormattedManagerPayments(user.userId);
        if (paymentsResponse.success) {
          setPaymentsData(paymentsResponse.data || []);
        } else {
          console.error("Failed to refresh payments data:", paymentsResponse);
          toast.error("Failed to refresh payments data.");
        }
      }
    } catch (err) {
      toast.error("Failed to cancel booking.")
    } finally {
      setCanceling(false)
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <Card className="min-h-[120px] hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
            <Building className="h-5 w-5 text-blue-600" />
            </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-black">{totalVenuesCardValue}</div>
            <Link href="/manage/venues" className="text-xs text-blue-600 hover:underline mt-2 block">
                View all venues
              </Link>
            </CardContent>
          </Card>

        <Card className="min-h-[120px] hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-5 w-5 text-blue-600" />
            </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-black">{totalBookingsCardValue}</div>
            <Link href="/manage/bookings" className="text-xs text-blue-600 hover:underline mt-2 block">
                View all bookings
              </Link>
            </CardContent>
          </Card>

        <Card className="min-h-[120px] hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <span className="text-sm font-medium">FRW</span>
            </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-black">
              {totalAmountPaidOverall.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            <p className="text-xs text-muted-foreground mt-2">
                Overall from all bookings
            </p>
            </CardContent>
          </Card>

        <Card className="min-h-[120px] hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <CardTitle className="text-sm font-medium">Total Remaining</CardTitle>
            <span className="text-sm font-medium">FRW</span>
            </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-black">
              {overallTotalAmountRemaining.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            <p className="text-xs text-muted-foreground mt-2">
                Overall from all bookings
            </p>
          </CardContent>
        </Card>

        {/* {bookingSummary && (
          <Card className="min-h-[120px] hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <BookOpen className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-blue-800">
                {bookingSummary.paymentSummary.collectionProgress || '0%'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Of expected payments collected
              </p>
            </CardContent>
          </Card>
        )} */}
        </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
            <CardTitle className="text-blue-800">Venue Booking Rate</CardTitle>
            <CardDescription>Number of bookings per venue</CardDescription>
            </CardHeader>
          <CardContent className="h-[300px]">
            {loadingBookingsAndSummary ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (bookingSummary?.bookingsByVenue?.length || 0) > 0 ? (
              <ChartContainer
                config={bookingRateChartConfig}
                className="h-full w-full"
              >
                <RechartsPrimitive.BarChart
                  data={bookingsByVenueForCharts}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <RechartsPrimitive.XAxis
                    dataKey="venueName"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <RechartsPrimitive.YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <RechartsPrimitive.Tooltip
                    content={<ChartTooltipContent hideLabel indicator="dot" />}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  <RechartsPrimitive.Bar
                    dataKey="totalBookings"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  >
                    {bookingsByVenueForCharts.map((entry, index) => (
                      <RechartsPrimitive.Cell
                        key={`cell-${index}`}
                        fill={entry.color || '#3b82f6'}
                      />
                    ))}
                  </RechartsPrimitive.Bar>
                </RechartsPrimitive.BarChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <BookOpen className="h-8 w-8" />
                <p>No booking data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-blue-800">Revenue Distribution</CardTitle>
            <CardDescription>Total amount paid per venue</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingBookingsAndSummary ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (bookingsByVenueForCharts.length || 0) > 0 ? (
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <ChartContainer
                    config={venueEarningsChartConfig}
                    className="h-full w-full"
                  >
                    <RechartsPrimitive.PieChart>
                      <RechartsPrimitive.Pie
                        data={bookingsByVenueForCharts}
                        dataKey="totalPaid"
                        nameKey="venueName"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        labelLine={false}
                      >
                        {bookingsByVenueForCharts.map((entry, index) => (
                          <RechartsPrimitive.Cell
                            key={`cell-${index}`}
                            fill={entry.color || bluePalette[index % bluePalette.length]}
                          />
                        ))}
                      </RechartsPrimitive.Pie>
                      <RechartsPrimitive.Tooltip
                        formatter={(value, name, props) => [
                          value.toLocaleString("en-US", { style: "currency", currency: "RWF" }),
                          name,
                        ]}
                        contentStyle={{
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                      <RechartsPrimitive.Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ paddingTop: '20px' }}
                        content={({ payload }) => (
                          <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {payload?.map((entry, index) => (
                              <div key={`legend-${index}`} className="flex items-center text-xs">
                                <div
                                  className="w-3 h-3 rounded-full mr-1"
                                  style={{ backgroundColor: entry.color }}
                                />
                                {entry.value}
                              </div>
                            ))}
                          </div>
                        )}
                      />
                    </RechartsPrimitive.PieChart>
                  </ChartContainer>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <DollarSign className="h-8 w-8" />
                <p>No payment data available</p>
              </div>
            )}
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
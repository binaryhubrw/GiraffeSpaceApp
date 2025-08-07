"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Calendar,
  MapPin,
  Search,
  Filter,
  Download,
  Eye,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  DollarSign,
  Users,
  CalendarDays,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import ApiService from "@/api/apiConfig"

interface Payment {
  paymentId: string
  amountPaid: number
  paymentDate: string
  paymentMethod: string
  paymentStatus: string
  paymentReference: string | null
  notes: string | null
}

interface Venue {
  venueId: string
  venueName: string
  location: string
  totalAmount: number
  depositRequired: {
    percentage: number
    amount: number
    description: string
  }
  paymentCompletionRequired: {
    daysBeforeEvent: number
    amount: number
    deadline: string
    description: string
  }
}

interface BookingDate {
  date: string
}

interface PaymentSummary {
  totalAmount: number
  depositAmount: number
  totalPaid: number
  remainingAmount: number
  refundStatus: string | null
}

interface Booking {
  bookingId: string
  eventId: string
  eventName: string
  eventType: string
  eventStatus: string
  venue: Venue
  bookingDates: BookingDate[]
  bookingStatus: string
  isPaid: boolean
  createdAt: string
  payments: Payment[]
  totalPaid: number
  remainingAmount: number
  refundStatus: string | null
  paymentSummary: PaymentSummary
}

interface BookingSummary {
  totalBookings: number
  totalAmount: number
  totalDepositRequired: number
  totalRemainingAmount: number
  pendingBookings: number
  paidBookings: number
  unpaidBookings: number
}

interface ApiResponse {
  success: boolean
  data: {
    bookings: Booking[]
    summary: BookingSummary
  }
  message: string
}

export default function UserBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [summary, setSummary] = useState<BookingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.userId) {
        setError("User not authenticated.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await ApiService.getBookingByUserId(user.userId)
        console.log("API Response:", response)
        
        if (response.success) {
          setBookings(response.data.bookings)
          setSummary(response.data.summary)
          setError(null)
        } else {
          setError(response.message || "We couldn't retrieve your bookings. Please try again.")
          toast.error(response.message || "Failed to retrieve bookings.")
        }
      } catch (err: any) {
        console.error("Fetch error:", err)
        setError(err.message || "An unexpected error occurred while loading your bookings.")
        toast.error(err.message || "Failed to load bookings.")
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user?.userId])

  // Filter bookings based on search and filters
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.venue.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.eventType.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || booking.bookingStatus === statusFilter
    const matchesPayment = paymentFilter === "all" || (paymentFilter === "PAID" ? booking.isPaid : !booking.isPaid)
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentBookings = filteredBookings.slice(startIndex, endIndex)

  // Calculate statistics from real data
  const totalBookings = summary?.totalBookings || bookings.length
  const confirmedBookings = bookings.filter(b => b.bookingStatus === "APPROVED_PAID").length
  const pendingBookings = summary?.pendingBookings || bookings.filter(b => b.bookingStatus === "PENDING").length
  const totalSpent = summary?.totalAmount || bookings.reduce((sum, b) => sum + b.paymentSummary.totalPaid, 0)
  const totalOwed = summary?.totalRemainingAmount || bookings.reduce((sum, b) => sum + b.paymentSummary.remainingAmount, 0)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return `Frw ${amount.toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED_PAID":
        return "bg-green-100 text-green-800 border-green-200"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "PARTIAL":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPaymentStatusColor = (isPaid: boolean) => {
    return isPaid 
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-yellow-100 text-yellow-800 border-yellow-200"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[500px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Loading your bookings...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col justify-center items-center min-h-[500px] text-red-600">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Error: {error}</p>
            <p className="text-sm text-gray-500 mt-2">Please try refreshing the page or contact support.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Venue Bookings</h1>
          <p className="text-gray-600">Manage and view all your venue bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600">{confirmedBookings}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingBookings}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalSpent)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Amount Owed</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOwed)}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search venues, reasons, or contact person..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED_PAID">Approved & Paid</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Filter */}
              <div className="w-full md:w-48">
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Export Button */}
              <Button variant="outline" className="w-full md:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
          </p>
          {filteredBookings.length !== bookings.length && (
            <Badge variant="outline" className="text-xs">
              {filteredBookings.length} filtered from {bookings.length} total
            </Badge>
          )}
        </div>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                                 <TableRow>
                   <TableHead>Event & Venue</TableHead>
                   <TableHead>Booking Dates</TableHead>
                   <TableHead>Event Type</TableHead>
                   <TableHead>Amount</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Payment</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {currentBookings.map((booking) => (
                                     <TableRow key={booking.bookingId}>
                     <TableCell>
                       <div className="space-y-1">
                         <div className="font-medium text-sm">{booking.eventName}</div>
                         <div className="text-xs text-gray-500">{booking.venue.venueName}</div>
                        
                         <div className="text-xs text-gray-500">{booking.venue.location}</div>
                       </div>
                     </TableCell>
                     
                     <TableCell>
                       <div className="space-y-1">
                         {booking.bookingDates.map((date, index) => (
                           <div key={index} className="text-sm font-medium">
                             {formatDate(date.date)}
                           </div>
                         ))}
                         <div className="text-xs text-gray-400">
                           Booked: {formatDate(booking.createdAt)}
                         </div>
                       </div>
                     </TableCell>
                     
                     <TableCell>
                       <div className="max-w-xs">
                         <Badge variant="outline" className="text-xs">
                           {booking.eventType}
                         </Badge>
                         <div className="text-xs text-gray-500 mt-1">
                           {booking.eventStatus}
                         </div>
                       </div>
                     </TableCell>
                     
                     <TableCell>
                       <div className="space-y-1">
                         <div className="font-medium">{formatCurrency(booking.venue.totalAmount)}</div>
                         <div className="text-xs text-gray-500">
                           Paid: {formatCurrency(booking.paymentSummary.totalPaid)}
                         </div>
                         {booking.paymentSummary.remainingAmount > 0 && (
                           <div className="text-xs text-red-500">
                             Owed: {formatCurrency(booking.paymentSummary.remainingAmount)}
                           </div>
                         )}
                         {booking.paymentSummary.remainingAmount < 0 && (
                           <div className="text-xs text-green-500">
                             Refund: {formatCurrency(Math.abs(booking.paymentSummary.remainingAmount))}
                           </div>
                         )}
                       </div>
                     </TableCell>
                     
                     <TableCell>
                       <Badge 
                         variant="outline" 
                         className={`text-xs ${getStatusColor(booking.bookingStatus)}`}
                       >
                         {booking.bookingStatus}
                       </Badge>
                     </TableCell>
                     
                     <TableCell>
                       <div className="space-y-1">
                         <Badge 
                           variant="outline" 
                           className={`text-xs ${getPaymentStatusColor(booking.isPaid)}`}
                         >
                           {booking.isPaid ? "PAID" : "UNPAID"}
                         </Badge>
                         {booking.payments.length > 0 && (
                           <div className="text-xs text-gray-500">
                             {booking.payments[0].paymentMethod}
                           </div>
                         )}
                       </div>
                     </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                                                 <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => router.push(`/user-dashboard/booking/${booking.bookingId}`)}>
                             <Eye className="h-4 w-4 mr-2" />
                             View Details
                           </DropdownMenuItem>
                          
                           {(booking.bookingStatus === "PARTIAL" || booking.bookingStatus === "PENDING") && (
                             <DropdownMenuItem 
                               className="text-green-600 font-medium"
                               onClick={() => router.push(`/venues/book/payment/${booking.bookingId}`)}
                             >
                               <DollarSign className="h-4 w-4 mr-2" />
                               Pay Now
                             </DropdownMenuItem>
                           )}
                           {booking.bookingStatus === "PENDING" && (
                             <DropdownMenuItem className="text-red-600">
                               <XCircle className="h-4 w-4 mr-2" />
                               Cancel Booking
                             </DropdownMenuItem>
                           )}
                         </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Empty State */}
        {filteredBookings.length === 0 && (
          <Card className="mt-6">
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "You haven't made any venue bookings yet"}
              </p>
              <Button variant="outline" onClick={() => router.push("/venues")}>
                Browse Venues
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 
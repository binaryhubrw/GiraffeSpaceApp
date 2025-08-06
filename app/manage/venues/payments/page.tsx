"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  DollarSign,
  CreditCard,
  Clock,
  TrendingUp,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
} from "lucide-react"
import Link from "next/link"
import { format, isToday, isThisWeek, isThisMonth, parseISO, isAfter, isBefore, isValid } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import RefundForm from "@/components/RefundForm"

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
  paymentDateFull: string
}

interface Booking {
  bookingId: string
  bookingReason: string
  bookingDate: string; // Corrected: bookingDate is a direct property
  venueName: string; // Corrected: venueName is a direct property
  bookingDates: Array<{ date: string; hours?: number[] }>; // Keep for other parts if needed, but primary date is bookingDate
  amountToBePaid: number
  totalAmountPaid: number
  remainingAmount: number
  isFullyPaid: boolean
  payments: ApiPayment[]
  payer: Payer
  // Removed: venue object no longer present at this level
}

interface ApiResponse {
  success: boolean
  data: Booking[]; // Corrected: data is directly an array of bookings
}

interface FormattedPayment {
  id: string
  amount: number
  date: string
  time: string
  customer: string
  venue: string // Will store venue.venueName
  venueName: string; // Added to resolve the error
  method: string
  status: string
  transactionId?: string
  remainingAmount: number
  bookingDate: string // Corrected: Will store booking.bookingDate
  amountToBePaid: number
  bookingId: string
  statusDisplay: string; // New field for formatted status
}

export default function PaymentsPage() {
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<FormattedPayment[]>([])
  const [bookingsData, setBookingsData] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [showRefundForm, setShowRefundForm] = useState(false)
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState<{ bookingId: string; totalAmountPaidBooking: number } | null>(null)

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Authentication token not found. Please log in.")
        setLoading(false)
        router.push("/login")
        return
      }

      const response = await fetch(
        "https://giraffespacev2.onrender.com/api/v1/venue-bookings/payments/manager/566439eb-33bf-4954-903d-986862dfaa5f/formatted",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result: ApiResponse = await response.json()

      if (result.success && result.data) {
        setBookingsData(result.data || []); // Corrected: access data directly
        const formattedPayments: FormattedPayment[] = []
        
        result.data.forEach((booking) => { // Corrected: iterate directly over result.data
          // If a booking has no payments, we still want to represent it
          // especially for remainingAmount calculation. We'll create a "dummy" payment
          // for consistency in the table, pulling data from the booking itself.
          if (booking.payments.length === 0) {
            formattedPayments.push({
              id: booking.bookingId, // Use bookingId as paymentId if no payments
              amount: 0, // No amount paid yet
              date: booking.bookingDate || "N/A", // Use direct bookingDate
              time: "00:00", // Default time
              customer: booking.payer.fullName,
              venue: booking.venueName || "N/A", // Safely access venueName
              venueName: booking.venueName || "N/A", // Safely access venueName
              method: "N/A",
              status: booking.remainingAmount > 0 ? "PARTIAL" : "COMPLETED", // Backend status
              transactionId: booking.bookingId,
              remainingAmount: booking.remainingAmount,
              bookingDate: booking.bookingDate || "N/A", // Use direct bookingDate
              amountToBePaid: booking.amountToBePaid,
              bookingId: booking.bookingId, // Add bookingId
              statusDisplay: booking.remainingAmount > 0 ? "Partially Paid" : "Paid", // Display for UI
            })
          } else {
            booking.payments.forEach((payment) => {
              const paymentDateTime = parseISO(payment.paymentDate)
              formattedPayments.push({
                id: payment.paymentId,
                amount: payment.amountPaid,
                date: format(paymentDateTime, "yyyy-MM-dd"),
                time: format(paymentDateTime, "HH:mm"),
                customer: booking.payer.fullName,
                venue: booking.venueName || "N/A", // Safely access venueName
                venueName: booking.venueName || "N/A", // Safely access venueName
                method: payment.paymentMethod
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (char) => char.toUpperCase()), // Format "MOBILE_MONEY" to "Mobile Money"
                status: payment.paymentStatus, // Directly use backend status
                transactionId: payment.paymentReference || payment.paymentId,
                remainingAmount: booking.remainingAmount, // Take remainingAmount from booking
                bookingDate: booking.bookingDate || "N/A", // Use direct bookingDate
                amountToBePaid: booking.amountToBePaid,
                bookingId: booking.bookingId, // Add bookingId
                statusDisplay: (() => {
                  switch (payment.paymentStatus.toUpperCase()) {
                    case "COMPLETED":
                      return "Paid";
                    case "PARTIAL":
                      return "Partially Paid";
                    case "PENDING":
                      return "Pending";
                    default:
                      return payment.paymentStatus; // Fallback for unexpected statuses
                  }
                })(),
              })
            })
          }
        })
        setPayments(formattedPayments)
      } else {
        setError("Failed to fetch payments: " + ((result as any).message || "Unknown error"))
      }
    } catch (e: any) {
      setError("Error fetching payments: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!isLoggedIn || !token) {
      router.push("/login")
      return
    }
    fetchPayments()
  }, [isLoggedIn, router])

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.venueName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "Holdings" && (payment.status === "PENDING" || payment.status === "PARTIAL")) ||
      (statusFilter !== "Holdings" && payment.status === statusFilter);
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter

    let matchesDate = true
    const paymentDate = parseISO(payment.date)
    if (dateFilter === "today") {
      matchesDate = isToday(paymentDate)
    } else if (dateFilter === "thisWeek") {
      matchesDate = isThisWeek(paymentDate, { weekStartsOn: 1 })
    } else if (dateFilter === "thisMonth") {
      matchesDate = isThisMonth(paymentDate)
    } else if (dateFilter === "custom") {
      if (customStartDate && customEndDate) {
        const start = parseISO(customStartDate)
        const end = parseISO(customEndDate)
        matchesDate =
          (isAfter(paymentDate, start) || paymentDate.getTime() === start.getTime()) &&
          (isBefore(paymentDate, end) || paymentDate.getTime() === end.getTime())
      } else {
        matchesDate = true
      }
    }
    return matchesSearch && matchesStatus && matchesMethod && matchesDate
  })

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage)

  const totalAmountPaidOverall = bookingsData.reduce((sum, booking) => sum + booking.totalAmountPaid, 0)
  const totalAmountRemainingOverall = bookingsData.reduce((sum, booking) => sum + booking.remainingAmount, 0)
  const totalBookingsCount = bookingsData.length

  // Calculate Total Amount for bookings in the current Month (based on booking date)
  const totalAmountThisMonthBookings = bookingsData.reduce((sum, booking) => {
    const bookingDate = booking.bookingDate; // Access the direct bookingDate property

    if (!bookingDate) {
      return sum; // Skip if bookingDate is undefined or null
    }

    // Check if bookingDate is a valid date before calling isThisMonth
    const parsedBookingDate = parseISO(bookingDate);
    const isCurrentMonth = isValid(parsedBookingDate) && isThisMonth(parsedBookingDate);
    
    if (isCurrentMonth) {
      return sum + booking.totalAmountPaid; // Changed to totalAmountPaid
    }
    return sum
  }, 0)

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "Frw 0"
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "PARTIAL":
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleView = (paymentId: string) => {
    router.push(`/manage/venues/payments/${paymentId}`)
  }

  const handleRefundClick = (bookingId: string, totalAmountPaidBooking: number) => {
    setSelectedBookingForRefund({ bookingId, totalAmountPaidBooking })
    setShowRefundForm(true)
  }

  const handleRefundSuccess = () => {
    const token = localStorage.getItem("token")
    if (token) {
      fetchPayments()
    }
    setShowRefundForm(false)
  }

  if (loading) {
    return (
      <main className="flex-1 p-8 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading payments...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex-1 p-8 flex items-center justify-center">
        <p className="text-lg text-red-600">Error: {error}</p>
      </main>
    )
  }

  return (
    <main className="flex-1">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Payments Management</h1>
          {/* <Link
            href="/manage/payments/create"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <span className="text-lg">{"+"}</span>
            Add Payment
          </Link> */}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Total Amount Paid</h2>
              <span className="text-sm font-medium">FRW</span>
            </div>
            <p className="text-2xl font-bold mb-1">{formatCurrency(totalAmountPaidOverall)}</p>
            <p className="text-xs text-green-600">Overall payments</p>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Total Bookings</h2>
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold mb-1">{formatNumber(totalBookingsCount)}</p>
            <p className="text-xs text-gray-500">All bookings</p>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Total Amount unpaid</h2>
              <span className="text-sm font-medium">FRW</span>
            </div>
            <p className="text-2xl font-bold mb-1">{formatCurrency(totalAmountRemainingOverall)}</p>
            <p className="text-xs text-red-600">Unpaid amounts</p>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Amount This Month</h2>
              <span className="text-sm font-medium">FRW</span>
            </div>
            <p className="text-2xl font-bold mb-1">{formatCurrency(totalAmountThisMonthBookings)}</p>
            <p className="text-xs text-gray-500">Based on booking date</p>
          </div>
        </div>

        {/* Payments Table */}
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Payment History</h2>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Methods</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="PayPal">PayPal</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Venue</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Amount Paid</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date & Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Method</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">{payment.customer}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{payment.venueName}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {payment.date} • {payment.time}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{payment.method}</td>
                    <td className="px-4 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(payment.status)}`}
                      >
                        {payment.statusDisplay}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(payment.id)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRefundClick(payment.bookingId, payment.amount)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Refund"
                        >
                          <RefreshCcw className="h-4 w-4" /> Refund
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {formatNumber(startIndex + 1)} to{" "}
              {formatNumber(Math.min(startIndex + itemsPerPage, filteredPayments.length))} of{" "}
              {formatNumber(filteredPayments.length)} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      currentPage === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showRefundForm} onOpenChange={setShowRefundForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Payment</DialogTitle>
            <DialogDescription>
              Confirm the refund amount for the selected booking.
            </DialogDescription>
          </DialogHeader>
          {selectedBookingForRefund && (
            <RefundForm
              bookingId={selectedBookingForRefund.bookingId}
              maxRefundAmount={selectedBookingForRefund.totalAmountPaidBooking}
              onRefundSuccess={handleRefundSuccess}
              onClose={() => setShowRefundForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
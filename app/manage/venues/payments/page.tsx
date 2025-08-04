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
  RefreshCcw, // Added RefreshCcw icon
} from "lucide-react"
import Link from "next/link"
import { format, isToday, isThisWeek, isThisMonth, parseISO, isAfter, isBefore } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog" // Import Dialog components
import RefundForm from "@/components/RefundForm" // Import RefundForm

// Define types for the API response and formatted payments (simplified for table)
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
  paymentDate: string // ISO string
  notes: string | null
  paymentDateFull: string // original ISO string for payment (keeping for completeness, though not directly used in table)
}

interface Booking {
  bookingId: string
  bookingReason: string
  bookingDate: string // YYYY-MM-DD
  amountToBePaid: number
  totalAmountPaid: number
  remainingAmount: number
  isFullyPaid: boolean
  payments: ApiPayment[]
  payer: Payer
}

interface ApiResponse {
  success: boolean
  data: Booking[]
}

interface FormattedPayment {
  id: string // paymentId
  amount: number // amountPaid for this specific payment
  date: string // formatted payment date
  time: string // formatted payment time
  customer: string // payer.fullName
  venue: string // bookingReason
  method: string // formatted paymentMethod
  status: "completed" | "pending" | "failed" | "partial" // formatted paymentStatus
  transactionId?: string // paymentReference or paymentId
  remainingAmount: number // booking.remainingAmount
  bookingDate: string // booking.bookingDate (for monthly calculation)
  amountToBePaid: number // booking.amountToBePaid (for monthly calculation)
  bookingId: string // Added bookingId for refund
}

export default function PaymentsPage() {
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<FormattedPayment[]>([])
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
  const [showRefundForm, setShowRefundForm] = useState(false) // State for showing the refund form
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState<{ bookingId: string; totalAmountPaidBooking: number } | null>(null) // To pass data to refund form

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Authentication token not found. Please log in.")
        setLoading(false)
        router.push("/login") // Redirect if no token
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
        const formattedPayments: FormattedPayment[] = []
        result.data.forEach((booking) => {
          // If a booking has no payments, we still want to represent it
          // especially for remainingAmount calculation. We'll create a "dummy" payment
          // for consistency in the table, pulling data from the booking itself.
          if (booking.payments.length === 0) {
            formattedPayments.push({
              id: booking.bookingId, // Use bookingId as paymentId if no payments
              amount: 0, // No amount paid yet
              date: booking.bookingDate, // Use booking date as payment date
              time: "00:00", // Default time
              customer: booking.payer.fullName,
              venue: booking.bookingReason,
              method: "N/A",
              status: booking.remainingAmount > 0 ? "partial" : "completed",
              transactionId: booking.bookingId,
              remainingAmount: booking.remainingAmount,
              bookingDate: booking.bookingDate,
              amountToBePaid: booking.amountToBePaid,
              bookingId: booking.bookingId, // Add bookingId
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
                venue: booking.bookingReason, // Using bookingReason as venue
                method: payment.paymentMethod
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (char) => char.toUpperCase()), // Format "MOBILE_MONEY" to "Mobile Money"
                status:
                  payment.paymentStatus === "PAID"
                    ? "completed"
                    : payment.paymentStatus === "PARTIAL"
                      ? "partial"
                      : "failed", // Map API status to desired status
                transactionId: payment.paymentReference || payment.paymentId,
                remainingAmount: booking.remainingAmount, // Take remainingAmount from booking
                bookingDate: booking.bookingDate,
                amountToBePaid: booking.amountToBePaid,
                bookingId: booking.bookingId, // Add bookingId
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

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!isLoggedIn || !token) {
      router.push("/login")
      return
    }
    fetchPayments()
  }, [isLoggedIn, router])

  // Filter payments based on search and filters
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.venue.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter

    // Date filtering
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

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage)

  // Calculate statistics for the cards
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalPayments = payments.length
  const pendingPayments = payments.filter((payment) => payment.status === "partial").length // Using "partial" for pending

  // Calculate Total Amount in This Month
  const totalAmountThisMonth = payments.reduce((sum, payment) => {
    const bookingDate = parseISO(payment.bookingDate)
    if (isThisMonth(bookingDate)) {
      return sum + payment.amountToBePaid
    }
    return sum
  }, 0)

  // Helper function to format numbers with thousands separator
  const formatCurrency = (amount: number) => {
    return `Frw ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleView = (paymentId: string) => {
    router.push(`/manage/venues/payments/${paymentId}`)
  }

  const handleRefundClick = (bookingId: string, totalAmountPaidBooking: number) => {
    setSelectedBookingForRefund({ bookingId, totalAmountPaidBooking });
    setShowRefundForm(true);
  };

  const handleRefundSuccess = (refundedAmount: number) => {
    // Re-fetch payments or update local state if preferred
    // For now, let's re-fetch to ensure data consistency
    const token = localStorage.getItem("token");
    if (token) {
      fetchPayments(); // Re-fetch all payments to update the list
    }
    setShowRefundForm(false);
  };

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
          <Link
            href="/manage/payments/create"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <span className="text-lg">{"+"}</span>
            Add Payment
          </Link>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Total Revenue</h2>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-green-600">+15% from last month</p>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Total Payments</h2>
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold mb-1">{formatNumber(totalPayments)}</p>
            <p className="text-xs text-gray-500">This month</p>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Partial Payments</h2>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold mb-1">{formatNumber(pendingPayments)}</p>
            <p className="text-xs text-yellow-600">half payments</p>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Total Amount This Month</h2>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(totalAmountThisMonth)}</p>
            <p className="text-xs text-gray-500">Based on booking date</p>
          </div>
        </div>
        {/* Payments Table */}
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Payment History</h2>
            {/* Filters */}
            <div className="flex gap-4">
              {/* Search */}
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
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="partial">Partial</option>
                <option value="failed">Failed</option>
              </select>
              {/* Method Filter */}
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
              {/* Date Filter */}
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
                    <td className="px-4 py-4 text-sm text-gray-900">{payment.venue}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {payment.date} • {payment.time}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{payment.method}</td>
                    <td className="px-4 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(payment.status)}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(payment.id)} // Pass only the ID
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRefundClick(payment.bookingId, payment.amount)} // Assuming payment.amount is the amount available to refund
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
          {/* Pagination */}
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
              maxRefundAmount={selectedBookingForRefund.totalAmountPaidBooking} // Corrected prop name
              onRefundSuccess={handleRefundSuccess}
              onClose={() => setShowRefundForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}

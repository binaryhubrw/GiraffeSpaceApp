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
} from "lucide-react"
import Link from "next/link"
import { format, isToday, isThisWeek, isThisMonth, parseISO, isAfter, isBefore } from "date-fns"

// Mock data for payments
const mockPayments = [
  {
    id: "PAY-001",
    amount: 1200.0,
    date: "2025-01-10",
    time: "14:30",
    customer: "John Smith",
    venue: "Grand Conference Hall",
    method: "Credit Card",
    status: "completed",
    transactionId: "TXN-12345",
  },
  {
    id: "PAY-002",
    amount: 850.0,
    date: "2025-01-09",
    time: "10:15",
    customer: "Sarah Johnson",
    venue: "Riverside Meeting Room",
    method: "Bank Transfer",
    status: "pending",
    transactionId: "TXN-12346",
  },
  {
    id: "PAY-003",
    amount: 2100.0,
    date: "2025-01-08",
    time: "16:45",
    customer: "Tech Corp Inc",
    venue: "Downtown Studio",
    method: "Credit Card",
    status: "completed",
    transactionId: "TXN-12347",
  },
  {
    id: "PAY-004",
    amount: 650.0,
    date: "2025-01-07",
    time: "11:20",
    customer: "Mary Wilson",
    venue: "Garden Pavilion",
    method: "PayPal",
    status: "failed",
    transactionId: "TXN-12348",
  },
  {
    id: "PAY-005",
    amount: 1800.0,
    date: "2025-01-06",
    time: "13:00",
    customer: "Event Masters LLC",
    venue: "Grand Conference Hall",
    method: "Credit Card",
    status: "completed",
    transactionId: "TXN-12349",
  },
  {
    id: "PAY-006",
    amount: 950.0,
    date: "2025-01-05",
    time: "09:30",
    customer: "David Brown",
    venue: "Rooftop Terrace",
    method: "Bank Transfer",
    status: "pending",
    transactionId: "TXN-12350",
  },
]

export default function PaymentsPage() {
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  // Filter payments based on search and filters
  const filteredPayments = mockPayments.filter((payment) => {
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
        matchesDate = (isAfter(paymentDate, start) || paymentDate.getTime() === start.getTime()) &&
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleView = (paymentId: string) => {
    console.log("View payment:", paymentId)
    // Navigate to payment details page
  }

  const handleEdit = (paymentId: string) => {
    console.log("Edit payment:", paymentId)
    // Navigate to edit payment page
  }

  const handleDelete = (paymentId: string) => {
    console.log("Delete payment:", paymentId)
    // Show confirmation dialog and delete
  }

  return (
    <main className="flex-1 bg-white">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Payments Management</h1>
          <Link
            href="/manage/payments/create"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <span className="text-lg">+</span>
            Add Payment
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Total Revenue</h2>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold mb-1">$7,550</p>
            <p className="text-xs text-green-600">+15% from last month</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Total Payments</h2>
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold mb-1">6</p>
            <p className="text-xs text-gray-500">This month</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Pending Payments</h2>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold mb-1">2</p>
            <p className="text-xs text-yellow-600">Awaiting processing</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Average Payment</h2>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold mb-1">$1,258</p>
            <p className="text-xs text-gray-500">Per transaction</p>
          </div>
        </div>

        {/* Payments Table */}
        <div className="border rounded-lg p-6">
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
                <option value="pending">Pending</option>
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
                 
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Payment_Id</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Venue</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date & Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Method</th>
                   {/* <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Payment Type</th> */}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{payment.id}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{payment.customer}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{payment.venue}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">${payment.amount.toFixed(2)}</td>
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
                          onClick={() => handleView(payment.id)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(payment.id)}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(payment.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPayments.length)} of{" "}
              {filteredPayments.length} results
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
    </main>
  )
}

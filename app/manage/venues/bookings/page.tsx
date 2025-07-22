"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Check, X } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

// Sample booking data
const bookingsData = [
  {
    id: "booking-1",
    event: "Corporate Meeting",
    customer: "Acme Inc.",
    customerEmail: "events@acmeinc.com",
    venue: "Grand Conference Hall",
    date: "5/15/2025",
    time: "09:00-11:00",
    status: "Pending",
    feeStatus: "Paid",
    paymentStatus: "Paid",
    paymentId: "PAY-001",
  },
  {
    id: "booking-2",
    event: "Team Building",
    customer: "Marketing Agency",
    customerEmail: "team@marketingagency.com",
    venue: "Riverside Meeting Room",
    date: "5/16/2025",
    time: "14:00-16:00",
    status: "Approved",
    feeStatus: "Free", // Added for new filters
    paymentStatus: "Paid", // Added for new filters
  },
  {
    id: "booking-3",
    event: "Product Launch",
    customer: "Tech Startup",
    customerEmail: "events@techstartup.com",
    venue: "Grand Conference Hall",
    date: "5/20/2025",
    time: "10:00-13:00",
    status: "Approved",
    feeStatus: "Paid", // Added for new filters
    paymentStatus: "Paid", // Added for new filters
  },
  {
    id: "booking-4",
    event: "Annual Conference",
    customer: "Industry Association",
    customerEmail: "conference@association.org",
    venue: "Grand Conference Hall",
    date: "6/10/2025",
    time: "09:00-17:00",
    status: "Approved",
    feeStatus: "Paid", // Added for new filters
    paymentStatus: "Paid", // Added for new filters
  },
  {
    id: "booking-5",
    event: "Workshop",
    customer: "Educational Institute",
    customerEmail: "workshops@education.edu",
    venue: "Downtown Studio",
    date: "5/25/2025",
    time: "13:00-16:00",
    status: "Pending",
    feeStatus: "Free", // Added for new filters
    paymentStatus: "Pending", // Added for new filters
  },
]

export default function BookingRequestsPage() {
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get("status") || "all"
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All Statuses")
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [venueFilter, setVenueFilter] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  // Date filter logic
  const now = new Date();
  const filteredByDate = bookingsData.filter(booking => {
    const bookingDate = new Date(booking.date);
    if (dateFilter === "custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      return bookingDate >= start && bookingDate <= end;
    }
    if (dateFilter === "today") {
      return bookingDate.toDateString() === now.toDateString();
    }
    if (dateFilter === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
    }
    if (dateFilter === "month") {
      return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Filter bookings based on search query and status
  const filteredBookings = filteredByDate.filter((booking) => {
    const matchesSearch =
      booking.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.venue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      bookingStatusFilter === "" || bookingStatusFilter === "All Statuses" || booking.status.toLowerCase() === bookingStatusFilter.toLowerCase();

    const matchesEventType =
      eventTypeFilter === "" || eventTypeFilter === "All Types" ||
      (eventTypeFilter === "Free" && booking.feeStatus === "Free") ||
      (eventTypeFilter === "Paid" && booking.feeStatus === "Paid");

    const matchesVenue =
      venueFilter === "" || venueFilter === "All Venues" || booking.venue === venueFilter;

    const matchesPaymentStatus =
      paymentStatusFilter === "" || paymentStatusFilter === "All" ||
      (paymentStatusFilter === "Pending Payments" && booking.paymentStatus === "Pending") ||
      (paymentStatusFilter === "Amount Paid" && booking.paymentStatus === "Paid");

    return matchesSearch && matchesStatus && matchesEventType && matchesVenue && matchesPaymentStatus;
  });

  // Mock options for event type and venue
  const eventTypeOptions = ["All Types", "Free", "Paid"];
  const venueOptions = ["All Venues", "Grand Conference Hall", "Riverside Meeting Room", "Downtown Studio"];
  const bookingStatusOptions = ["All Statuses", "Pending", "Confirmed", "Canceled", "Auto Canceled", "Requested Cancellation"];
  const paymentStatusOptions = ["All", "Pending Payments", "Amount Paid"];

  return (
    <>
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="max-w-8xl flex-1 ">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Booking Requests</h1>
            <p className="text-gray-600">Manage and approve booking requests for your venues</p>
          </div>

          {/* Search, Status, and Date Filters */}
          <div className="flex flex-wrap gap-4 mb-8 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search bookings..."
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {/* Status Filter */}
              <div className="relative min-w-[140px]">
                <select
                  className="appearance-none w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 pr-8"
                  value={bookingStatusFilter}
                  onChange={e => setBookingStatusFilter(e.target.value)}
                >
                  {bookingStatusOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              {/* Date Filter */}
              <div className="relative min-w-[140px]">
                <select
                  className="appearance-none w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 pr-8"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
                {dateFilter === "custom" && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="input input-bordered"
                    />
                    <span className="self-center">to</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="input input-bordered"
                    />
                  </div>
                )}
              </div>
              {/* Event Type Filter */}
              <div className="relative min-w-[120px]">
                <select
                  className="appearance-none w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 pr-8"
                  value={eventTypeFilter}
                  onChange={e => setEventTypeFilter(e.target.value)}
                >
                  {eventTypeOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              {/* Venue Filter */}
              <div className="relative min-w-[120px]">
                <select
                  className="appearance-none w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 pr-8"
                  value={venueFilter}
                  onChange={e => setVenueFilter(e.target.value)}
                >
                  {venueOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              {/* Payment Status Filter */}
              <div className="relative min-w-[120px]">
                <select
                  className="appearance-none w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 pr-8"
                  value={paymentStatusFilter}
                  onChange={e => setPaymentStatusFilter(e.target.value)}
                >
                  {paymentStatusOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.event}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.customer}</div>
                      <div className="text-xs text-gray-500">{booking.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.venue}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.date}</div>
                      <div className="text-xs text-gray-500">{booking.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{booking.paymentId || "-"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {booking.status === "Pending" ? (
                        <div className="flex space-x-2">
                          <button className="text-green-600 hover:text-green-900">
                            <Check className="h-5 w-5" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <button className="text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md">
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
    </>
  )
}

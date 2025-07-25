"use client"

import { useAuth } from "@/contexts/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, X, Eye, XCircle } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import ApiService from "@/api/apiConfig";
import { toast } from "sonner";

export default function BookingRequestsPage() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [customDate, setCustomDate] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const ITEMS_PER_PAGE = 6;
  const [page, setPage] = useState(1);

  // Helper to normalize date string to YYYY-MM-DD
  function normalizeDateString(dateStr: string) {
    if (!dateStr) return '';
    // Accepts 'YYYY-MM-D' or 'YYYY-MM-DD' and returns 'YYYY-MM-DD'
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  // Fetch bookings for manager
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.userId) return;
      setLoading(true);
      try {
        const response = await ApiService.getAllBookingsByManager(user.userId);
        console.log("Fetched bookings:", response.data);
        setBookings(response.data.bookings || []);
      } catch (err) {
        toast.error("Failed to fetch bookings. Please try again later.");
        console.error("Error fetching bookings:", err);

        // Optionally show a toast
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetchBookings();
  }, [user?.userId]);

  // Date filter logic
  const now = new Date();
  const filteredByDate = bookings.filter(booking => {
    const bookingDateRaw = booking.bookingDates?.[0]?.date || "";
    const bookingDateStr = normalizeDateString(bookingDateRaw);
    const bookingDate = bookingDateStr ? new Date(bookingDateStr) : null;
    if (dateFilter === "custom" && customDate) {
      return bookingDateStr === normalizeDateString(customDate);
    }
    if (dateFilter === "today") {
      const todayStr = normalizeDateString(now.toISOString().split('T')[0]);
      return bookingDateStr === todayStr;
    }
    if (dateFilter === "week") {
      if (!bookingDate) return false;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
    }
    if (dateFilter === "month") {
      return bookingDate && bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Reset page to 1 when date filter changes
  useEffect(() => { setPage(1); }, [dateFilter, customDate]);

  // Filter bookings based on search query and status
  const filteredBookings = filteredByDate.filter((booking) => {
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      (booking.eventDetails?.eventName?.toLowerCase() || "").includes(search) ||
      (booking.venue?.venueName?.toLowerCase() || "").includes(search);

    const matchesStatus =
      bookingStatusFilter === "" || bookingStatusFilter === "All Statuses" || (booking.bookingStatus || "").toLowerCase() === bookingStatusFilter.toLowerCase();

    // For event type and payment status, you may need to adjust based on your API response
    const matchesEventType = true;
    // Remove venue filter; search input will handle venue name filtering
    const matchesVenue = true;
    const matchesPaymentStatus = true;

    return matchesSearch && matchesStatus && matchesEventType && matchesVenue && matchesPaymentStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const paginated = filteredBookings.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Mock options for event type and venue
  const bookingStatusOptions = ["All Statuses", "Pending", "Approved", "Cancelled"];

  const handleCancelBooking = (bookingId: string) => {
    // TODO: Implement cancel logic or open a dialog
    alert(`Cancel booking ${bookingId}`);
  };

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
                placeholder="Search by event or venue..."
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
                      value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                      className="input input-bordered"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8">No bookings found.</td></tr>
                ) : (
                  paginated.map((booking, idx) => (
                    <tr key={booking.bookingId || idx}>
                      <td className="px-4 py-3 whitespace-nowrap text-center">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap max-w-[200px] truncate">
                        <div className="text-sm font-medium text-gray-900">{booking.eventDetails?.eventName || '-'}</div>
                    </td>
                      <td className="px-4 py-3 whitespace-nowrap max-w-[160px] truncate">
                        <div className="text-sm text-gray-900">{booking.venue?.venueName || '-'}</div>
                    </td>
                      <td className="px-4 py-3 whitespace-nowrap max-w-[120px] truncate">
                        <div className="text-sm text-gray-900">{booking.bookingDates?.[0]?.date || '-'}</div>
                    </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.bookingStatus === "APPROVED"
                            ? "bg-green-100 text-green-800"
                              : booking.bookingStatus === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : booking.bookingStatus === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {booking.bookingStatus}
                      </span>
                    </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium flex gap-2">
                        <a
                          href={`/manage/venues/bookings/${booking.bookingId}`}
                          className="text-blue-600 hover:text-blue-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-full"
                          aria-label="View Booking"
                          title="View Booking"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                        <button
                          className="text-red-600 hover:text-red-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-full"
                          onClick={() => handleCancelBooking(booking.bookingId)}
                          aria-label="Cancel Booking"
                          title="Cancel Booking"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <div className="py-4 w-full flex justify-end">
              <div className="w-auto flex gap-1">
                <button
                  className="px-3 py-1 rounded border bg-white text-gray-700 disabled:opacity-50"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`px-3 py-1 rounded border ${page === i + 1 ? 'bg-gray-200 font-bold' : 'bg-white text-gray-700'}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="px-3 py-1 rounded border bg-white text-gray-700 disabled:opacity-50"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  )
}

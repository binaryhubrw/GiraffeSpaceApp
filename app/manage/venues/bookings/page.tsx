"use client"

import { useAuth } from "@/contexts/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, X, Eye, XCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import ApiService from "@/api/apiConfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BookingRequestsPage() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [customDate, setCustomDate] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
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

  // Helper function to get status display info
  const getStatusInfo = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return {
          label: "Pending",
          variant: "secondary",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200"
        };
      case "APPROVED_NOT_PAID":
        return {
          label: "Approved - Unpaid",
          variant: "default",
          className: "bg-orange-100 text-orange-800 border-orange-200"
        };
      case "APPROVED_PAID":
        return {
          label: "Approved - Paid",
          variant: "default",
          className: "bg-green-100 text-green-800 border-green-200"
        };
      case "PAID":
        return {
          label: "Paid",
          variant: "default",
          className: "bg-green-100 text-green-800 border-green-200"
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          variant: "destructive",
          className: "bg-red-100 text-red-800 border-red-200"
        };
      case "REJECTED":
        return {
          label: "Rejected",
          variant: "destructive",
          className: "bg-red-100 text-red-800 border-red-200"
        };
      default:
        return {
          label: status || "Unknown",
          variant: "secondary",
          className: "bg-gray-100 text-gray-800 border-gray-200"
        };
    }
  };

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

  // Reset page to 1 when filters change
  useEffect(() => { setPage(1); }, [dateFilter, customDate, bookingStatusFilter, searchQuery]);

  // Filter bookings based on search query and status
  const filteredBookings = filteredByDate.filter((booking) => {
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      (booking.eventDetails?.eventName?.toLowerCase() || "").includes(search) ||
      (booking.venue?.venueName?.toLowerCase() || "").includes(search);

    // Enhanced status filtering
    let matchesStatus = true;
    if (bookingStatusFilter !== "all") {
      const bookingStatus = booking.bookingStatus?.toUpperCase() || "";
      switch (bookingStatusFilter) {
        case "pending":
          matchesStatus = bookingStatus === "PENDING";
          break;
        case "approved_unpaid":
          matchesStatus = bookingStatus === "APPROVED_NOT_PAID";
          break;
        case "approved_paid":
          matchesStatus = bookingStatus === "APPROVED_PAID" || bookingStatus === "PAID";
          break;
        case "cancelled":
          matchesStatus = bookingStatus === "CANCELLED";
          break;
        case "rejected":
          matchesStatus = bookingStatus === "REJECTED";
          break;
        default:
          matchesStatus = true;
      }
    }

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const paginated = filteredBookings.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Status filter options
  const statusFilterOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved_unpaid", label: "Approved - Unpaid" },
    { value: "approved_paid", label: "Approved - Paid" },
    { value: "cancelled", label: "Cancelled" },
    { value: "rejected", label: "Rejected" }
  ];

  const handleCancelBooking = (bookingId: string) => {
    // TODO: Implement cancel logic or open a dialog
    alert(`Cancel booking ${bookingId}`);
  };

  return (
    <>
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="max-w-8xl flex-1">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Booking Requests</h1>
            <p className="text-gray-600">Manage and approve booking requests for your venues</p>
          </div>

          {/* Search, Status, and Date Filters */}
          <div className="bg-card p-4 rounded-lg border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by event or venue..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Status Filter */}
              <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Date</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground flex items-center">
                Showing {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Custom Date Input */}
            {dateFilter === "custom" && (
              <div className="mt-4">
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            )}
          </div>

          {/* Bookings Table */}
          <div className="bg-card rounded-lg border overflow-hidden bg-white">
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
                  paginated.map((booking, idx) => {
                    const statusInfo = getStatusInfo(booking.bookingStatus);
                    return (
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
                          <Badge 
                            variant={statusInfo.variant as any}
                            className={statusInfo.className}
                          >
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            asChild
                          >
                            <a
                              href={`/manage/venues/bookings/${booking.bookingId}`}
                              aria-label="View Booking"
                              title="View Booking"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleCancelBooking(booking.bookingId)}
                            aria-label="Cancel Booking"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-2">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} • {filteredBookings.length} total bookings
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
    </>
  )
}

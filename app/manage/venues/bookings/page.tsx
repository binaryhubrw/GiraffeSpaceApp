"use client"

import { useAuth } from "@/contexts/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, X, Eye, XCircle, Search, ChevronLeft, ChevronRight, Download, Calendar, HelpCircle, Settings } from "lucide-react";
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
import { format, isToday, isThisWeek, isSameMonth, parseISO } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/config"

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
}

interface BookingPaymentInfo {
  bookingId: string;
  eventDetails?: {
    eventId: string;
    eventName: string;
    eventType: string;
    eventDescription: string;
  };
  venue?: {
    venueId: string;
    venueName: string;
    location: string;
    bookingType: string;
    baseAmount: number;
    totalHours: number | null;
    totalAmount: number;
    depositRequired: any;
    paymentCompletionRequired: any;
  };
  bookingDates: Array<{ date: string; hours?: number[] }>;
  bookingStatus: string; // Directly use the status from the API
  isPaid: boolean; // From the API, indicates if any payment has been made
  createdAt: string;
  requester: Payer; // Assuming Payer interface is defined elsewhere
  paymentSummary: { // This object holds payment details
    totalAmount: number;
    depositAmount: number;
    totalPaid: number;
    remainingAmount: number;
    paymentStatus: string;
    paymentProgress: string;
    depositStatus: string;
    paymentHistory: ApiPayment[];
    nextPaymentDue: number;
    paymentDeadline: string;
  };
}

interface AllBookingsApiResponse {
  success: boolean;
  data: {
    bookings: BookingPaymentInfo[];
    summary: any;
  };
  message: string;
}

export default function BookingRequestsPage() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month, custom
  const [customDate, setCustomDate] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [bookings, setBookings] = useState<BookingPaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const ITEMS_PER_PAGE = 6;
  const [page, setPage] = useState(1);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancelId, setBookingToCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "#",
    "Booking No.",
    "Event",
    "Venue",
    "Event Date",
    "Total Paid",
    "Remaining",
    "Booking Status",
    "Payment Status",
    "Requester"
  ]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

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
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "APPROVED_NOT_PAID":
        return {
          label: "Approved - Unpaid",
          variant: "default",
          className: "bg-orange-100 text-orange-800 border-orange-200",
        };
      case "APPROVED_PAID":
        return {
          label: "Fully Paid",
          variant: "default",
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "PAID":
        return {
          label: "Paid",
          variant: "default",
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          variant: "destructive",
          className: "bg-red-100 text-red-800 border-red-200",
        };
      case "REJECTED":
        return {
          label: "Rejected",
          variant: "destructive",
          className: "bg-red-100 text-red-800 border-red-200",
        };
      case "PARTIAL": // Added partial status
        return {
          label: "Partially Paid",
          variant: "secondary",
          className: "bg-blue-100 text-blue-800 border-blue-200",
        };
      default:
        return {
          label: status || "Unknown",
          variant: "secondary",
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return `Frw ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  // Fetch bookings for manager
  const fetchBookings = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const response: AllBookingsApiResponse = await ApiService.getAllBookingsByManager(user.userId);
      setBookings(response.data.bookings || []);
    } catch (err) {
      toast.error("Failed to fetch bookings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userId) fetchBookings();
  }, [user?.userId]);

  // Close column selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showColumnSelector && !target.closest('.column-selector')) {
        setShowColumnSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnSelector]);

  // Handle cancellation directly from the table
  const handleCancelBooking = (bookingId: string) => {
    setBookingToCancelId(bookingId);
    setCancelDialogOpen(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancelId || !cancelReason.trim()) return;

    setIsCancelling(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please log in.");
        setIsCancelling(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/venue-bookings/${bookingToCancelId}/cancel-by-manager-without-slot-deletion`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: cancelReason }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast.success("Booking cancelled successfully.");
      fetchBookings(); // Re-fetch data to update the table
      setCancelDialogOpen(false);
      setBookingToCancelId(null);
      setCancelReason("");
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      toast.error(error.message || "Failed to cancel booking.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Date filter logic
  const now = new Date();
  const filteredByDate = bookings.filter((booking) => {
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
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
    }
    if (dateFilter === "month") {
      return bookingDate && bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [dateFilter, customDate, bookingStatusFilter, searchQuery]);

  // Filter bookings based on search query and status
  const filteredBookings = filteredByDate.filter((booking) => {
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      (booking.eventDetails?.eventName?.toLowerCase() || "").includes(search) ||
      (booking.venue?.venueName?.toLowerCase() || "").includes(search) ||
      (booking.requester?.fullName?.toLowerCase() || "").includes(search) || // Use requester.fullName
      (booking.bookingId?.toLowerCase() || "").includes(search);

    // Use booking.bookingStatus directly from API for primary status filtering
    let matchesStatus = true;
    if (bookingStatusFilter !== "all") {
      matchesStatus = booking.bookingStatus.toLowerCase() === bookingStatusFilter.toLowerCase();
    }

    // Also filter by payment status if provided (from paymentSummary.paymentStatus)
    let matchesPaymentStatus = true;
    if (paymentStatusFilter !== "all") {
      matchesPaymentStatus = (booking.paymentSummary?.paymentStatus || "").toLowerCase() === paymentStatusFilter.toLowerCase();
    }

    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const paginated = filteredBookings.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Export filtered bookings to CSV
  const handleExportReport = () => {
    // Apply date filters to the export data
    let exportData = filteredBookings;
    
    if (exportStartDate || exportEndDate) {
      exportData = filteredBookings.filter((booking) => {
        const bookingDate = booking.bookingDates?.[0]?.date;
        if (!bookingDate) return false;
        
        const date = new Date(bookingDate);
        const startDate = exportStartDate ? new Date(exportStartDate) : null;
        const endDate = exportEndDate ? new Date(exportEndDate) : null;
        
        if (startDate && endDate) {
          return date >= startDate && date <= endDate;
        } else if (startDate) {
          return date >= startDate;
        } else if (endDate) {
          return date <= endDate;
        }
        return true;
      });
    }
    
    // Helper function to format date for export
    const formatDateForExport = (dateString: string) => {
      if (!dateString) return "N/A";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          weekday: 'short'
        });
      } catch {
        return "Invalid Date";
      }
    };

    // Helper function to format currency for export
    const formatCurrencyForExport = (amount: number) => {
      if (amount === 0) return "Frw 0";
      return `Frw ${amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })}`;
    };

    // Helper function to get readable status
    const getReadableStatus = (status: string) => {
      const statusMap: { [key: string]: string } = {
        'HOLDING': 'Pending',
        'APPROVED_PAID': 'Fully Paid',
        'APPROVED_NOT_PAID': 'Approved - Unpaid',
        'PARTIAL': 'Partially Paid',
        'CANCELLED': 'Cancelled',
        'REJECTED': 'Rejected',
        'PAID': 'Paid'
      };
      return statusMap[status] || status || 'Unknown';
    };

    // Helper function to get readable payment status
    const getReadablePaymentStatus = (status: string) => {
      const paymentStatusMap: { [key: string]: string } = {
        'PAID': 'Paid',
        'PENDING': 'Pending',
        'FAILED': 'Failed',
        'PARTIAL': 'Partially Paid'
      };
      return paymentStatusMap[status] || status || 'Unknown';
    };
    
    // Available columns for export
    const availableColumns = [
      "#",
      "Booking No.",
      "Event",
      "Venue",
      "Event Date",
      "Time",
      "Total Paid",
      "Remaining",
      "Booking Status",
      "Payment Status",
      "Requester",
      "Contact Info",
      "Created Date"
    ];

    // Filter headers based on selected columns
    const headers = availableColumns.filter(col => selectedColumns.includes(col));

    // Function to get data for a specific column
    const getColumnData = (booking: any, idx: number, column: string) => {
      switch (column) {
        case "#":
          return idx + 1;
        case "Booking No.":
          return toReadableBookingNo(booking.bookingId, idx + 1);
        case "Event":
          return booking.eventDetails?.eventName || "N/A";
        case "Venue":
          return booking.venue?.venueName || "N/A";
        case "Event Date":
          return formatDateForExport(booking.bookingDates?.[0]?.date || "");
        case "Time":
          return booking.bookingDates?.[0]?.hours ? 
            `${booking.bookingDates[0].hours[0] || 0}:00 - ${(booking.bookingDates[0].hours[0] || 0) + (booking.venue?.totalHours || 1)}:00` : 
            "N/A";
        case "Total Paid":
          return formatCurrencyForExport(booking.paymentSummary?.totalPaid ?? 0);
        case "Remaining":
          return formatCurrencyForExport(booking.paymentSummary?.remainingAmount ?? 0);
        case "Booking Status":
          return getReadableStatus(booking.bookingStatus || "");
        case "Payment Status":
          return getReadablePaymentStatus(booking.paymentSummary?.paymentStatus || "");
        case "Requester":
          return booking.requester?.fullName || "N/A";
        case "Contact Info":
          return booking.requester?.phoneNumber || booking.requester?.email || "N/A";
        case "Created Date":
          return formatDateForExport(booking.createdAt || "");
        default:
          return "N/A";
      }
    };

    const toReadableBookingNo = (id: string | undefined, fallbackIndex: number) => {
      if (!id) return String(fallbackIndex).padStart(5, '0');
      const digits = id.replace(/\D/g, "");
      if (digits.length >= 6) return digits.slice(-6); // last 6 digits
      if (digits.length > 0) return digits.padStart(6, '0');
      return String(fallbackIndex).padStart(5, '0');
    };
    const rows = exportData.map((b, idx) => 
      headers.map(column => getColumnData(b, idx, column))
    );

    // Add summary row
    const totalPaid = exportData.reduce((sum, b) => sum + (b.paymentSummary?.totalPaid ?? 0), 0);
    const totalRemaining = exportData.reduce((sum, b) => sum + (b.paymentSummary?.remainingAmount ?? 0), 0);
    const summaryRow = headers.map(column => {
      if (column === "Total Paid") {
        return `TOTAL: ${formatCurrencyForExport(totalPaid)}`;
      } else if (column === "Remaining") {
        return `TOTAL: ${formatCurrencyForExport(totalRemaining)}`;
      } else {
        return "";
      }
    });

    const csv = [headers, ...rows]
      .map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    // Add summary row to CSV
    const csvWithSummary = csv + "\n" + summaryRow.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",");

    const blob = new Blob([csvWithSummary], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const dateRange = exportStartDate || exportEndDate ? 
      `-${exportStartDate || 'all'}-to-${exportEndDate || 'all'}` : '';
    a.download = `GiraffeSpace-Bookings-${timestamp}${dateRange}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    // Show success message with export details
    toast.success(`Exported ${exportData.length} bookings to CSV${exportStartDate || exportEndDate ? ' with date filters' : ''}`);
  };

  // Status filter options - Now directly mapping to backend bookingStatus
  const statusFilterOptions = [
    { value: "all", label: "All Statuses" },
    { value: "HOLDING", label: "Pending" },
    { value: "APPROVED_PAID", label: "Fully Paid" },
    { value: "PARTIAL", label: "Partially Paid" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <>
      <div className="min-h-screen flex">
        <Sidebar />

        <main className="max-w-8xl flex-1">
          <div className="p-8">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Requests</h1>
              <p className="text-gray-600">Manage and approve booking requests for your venues</p>
            </div>

            {/* Export Section */}
            <div className="bg-white rounded-lg border p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-6 items-end justify-between">
                {/* Date Filters - Left Side */}
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  {/* Date Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="export-start-date" className="text-sm text-gray-600">
                        From Date
                      </Label>
                      <Input
                        id="export-start-date"
                        type="date"
                        value={exportStartDate}
                        onChange={(e) => setExportStartDate(e.target.value)}
                        className="w-36"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="export-end-date" className="text-sm text-gray-600">
                        To Date
                      </Label>
                      <Input
                        id="export-end-date"
                        type="date"
                        value={exportEndDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                        className="w-36"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-sm text-gray-600 opacity-0">
                        Clear
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setExportStartDate("");
                          setExportEndDate("");
                        }}
                        className="w-36 h-10 text-gray-600 hover:text-gray-800"
                        disabled={!exportStartDate && !exportEndDate}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Export Button and Info - Right Side */}
                <div className="flex flex-col items-end gap-2">
                   {/* Column Selector Button */}
                   <div className="relative flex items-center gap-2 mb-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setShowColumnSelector(!showColumnSelector)}
                       className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                     >
                       <Settings className="h-4 w-4" />
                       Select Columns
                     </Button>
                     
                     {/* Column Selection Modal */}
                     {showColumnSelector && (
                       <div className="absolute left-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-4 z-10 min-w-[300px] column-selector">
                         <div className="mb-3">
                           <h4 className="font-medium text-gray-900 mb-2">Select columns to export:</h4>
                           <div className="text-xs text-gray-600 mb-3">
                             {selectedColumns.length} of 13 columns selected
                           </div>
                         </div>
                        
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {[
                            "#",
                            "Booking No.",
                            "Event",
                            "Venue",
                            "Event Date",
                            "Time",
                            "Total Paid",
                            "Remaining",
                            "Booking Status",
                            "Payment Status",
                            "Requester",
                            "Contact Info",
                            "Created Date"
                          ].map((column) => (
                            <label key={column} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={selectedColumns.includes(column)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedColumns([...selectedColumns, column]);
                                  } else {
                                    setSelectedColumns(selectedColumns.filter(col => col !== column));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-gray-700">{column}</span>
                            </label>
                          ))}
                        </div>
                        
                        <div className="flex gap-2 mt-4 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedColumns([
                              "#",
                              "Booking No.",
                              "Event",
                              "Venue",
                              "Event Date",
                              "Time",
                              "Total Paid",
                              "Remaining",
                              "Booking Status",
                              "Payment Status",
                              "Requester",
                              "Contact Info",
                              "Created Date"
                            ])}
                            className="text-xs"
                          >
                            Select All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedColumns([])}
                            className="text-xs"
                          >
                            Clear All
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setShowColumnSelector(false)}
                            className="text-xs"
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleExportReport} 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    disabled={filteredBookings.length === 0 || selectedColumns.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  {/* <div className="text-xs text-gray-600 text-center">
                    <div className="font-medium">
                      {exportStartDate || exportEndDate ? 'Filtered Export' : 'Full Export'}
                    </div>
                    <div className="text-xs">
                      {exportStartDate || exportEndDate ? 
                        `${exportStartDate ? `From: ${new Date(exportStartDate).toLocaleDateString()}` : ''} ${exportEndDate ? `To: ${new Date(exportEndDate).toLocaleDateString()}` : ''}`.trim() :
                        'All bookings'
                      }
                    </div>
                    <div className="text-xs font-medium text-blue-600">
                      {filteredBookings.length} bookings available
                    </div>
                  </div> */}
                </div>
              </div>
            </div>

            {/* Search, Status, and Date Filters */}
            <div className="bg-white p-6 rounded-lg border mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by event, venue, or payer..."
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

                {/* Payment Filter */}
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
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

              {/* Results Count */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Venue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Paid
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Remained
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
                    <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8">No bookings found.</td></tr>
                  ) : (
                    paginated.map((booking, idx) => {
                      const statusInfo = getStatusInfo(booking.bookingStatus || "UNKNOWN");
                      const isCancellable = booking.bookingStatus === 'APPROVED_PAID' || booking.bookingStatus === 'APPROVED_NOT_PAID';
                      return (
                        <tr key={booking.bookingId || idx}><td className="px-4 py-3 whitespace-nowrap text-center">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</td><td className="px-4 py-3 whitespace-nowrap max-w-[200px] truncate"><div className="text-sm font-medium text-gray-900">{booking.eventDetails?.eventName || '-'}</div></td><td className="px-4 py-3 whitespace-nowrap max-w-[160px] truncate"><div className="text-sm text-gray-900">{booking.venue?.venueName || '-'}</div></td><td className="px-4 py-3 whitespace-nowrap max-w-[120px] truncate"><div className="text-sm text-gray-900">{booking.bookingDates?.[0]?.date || '-'}</div></td><td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{formatCurrency(booking.paymentSummary?.totalPaid || 0)}</td><td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{formatCurrency(booking.paymentSummary?.remainingAmount || 0)}</td><td className="px-4 py-3 whitespace-nowrap"><Badge variant={statusInfo.variant as any} className={statusInfo.className}>{statusInfo.label}</Badge></td><td className="px-4 py-3 whitespace-nowrap text-sm font-medium flex gap-2"><Button variant="outline" size="sm" className="h-8 px-3" asChild><a href={`/manage/venues/bookings/${booking.bookingId || ''}`} aria-label="View Booking" title="View Booking"><Eye className="w-4 h-4 mr-1" />View More</a></Button></td></tr>
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
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
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
  );
}

